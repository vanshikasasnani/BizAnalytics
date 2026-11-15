import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import api from '../services/api';

const Messages = () => {
  const { user } = useAuth();
  const { socket, isConnected, refreshUnreadMessages } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Mobile view state: 'list' | 'chat'
  const [mobileView, setMobileView] = useState('list');

  // References
  const messagesEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const activeContactRef = useRef(activeContact);
  activeContactRef.current = activeContact;

  // Helper to extract clean string ID from string or object/ObjectId
  const extractId = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return (val._id || val.id || '').toString();
    }
    return String(val);
  };

  const currentUserId = extractId(user);

  const scrollToBottom = (smooth = true) => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // 1. Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const res = await api.get('/messages/conversations');
      const list = res.data.conversations || [];
      setConversations(list);

      // Check if URL has a target ?user=userId
      const queryUserId = searchParams.get('user');
      if (queryUserId) {
        const found = list.find((c) => c.contact._id === queryUserId);
        if (found) {
          setActiveContact(found.contact);
          setMobileView('chat');
        } else {
          // If user not in initial conversations (e.g. freshly created staff), fetch user info
          try {
            const userRes = await api.get(`/admin/users`);
            const targetUser = userRes.data?.users?.find((u) => u._id === queryUserId);
            if (targetUser) {
              setActiveContact(targetUser);
              setMobileView('chat');
            }
          } catch {
            // ignore
          }
        }
      } else if (!activeContactRef.current && list.length > 0 && window.innerWidth >= 768) {
        // Auto-select first conversation on desktop
        setActiveContact(list[0].contact);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 2. Fetch messages for active contact
  const fetchMessages = useCallback(async (contactId) => {
    if (!contactId) return;
    try {
      setLoadingMessages(true);
      setError('');
      const res = await api.get(`/messages/${contactId}`);
      setMessages(res.data.messages || []);

      // Mark unread count locally and refresh global counter
      setConversations((prev) =>
        prev.map((c) =>
          c.contact._id === contactId ? { ...c, unreadCount: 0 } : c
        )
      );
      if (refreshUnreadMessages) refreshUnreadMessages();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load message history');
    } finally {
      setLoadingMessages(false);
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [refreshUnreadMessages]);

  useEffect(() => {
    if (activeContact?._id) {
      fetchMessages(activeContact._id);
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  }, [activeContact, fetchMessages]);

  // 3. Socket event listeners for real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      const activeId = extractId(activeContactRef.current);
      const senderId = extractId(newMsg.senderId || newMsg.sender);
      const receiverId = extractId(newMsg.receiverId || newMsg.receiver);

      // If this message belongs to the open chat
      if (activeId && (senderId === activeId || receiverId === activeId)) {
        setMessages((prev) => {
          if (prev.some((m) => extractId(m._id) === extractId(newMsg._id))) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom(true), 50);

        // Mark as read immediately if from the other user
        if (senderId === activeId) {
          api.put(`/messages/read/${activeId}`).catch(() => {});
        }
      }

      // Update conversations preview
      setConversations((prev) => {
        const otherId = senderId === currentUserId ? receiverId : senderId;
        const exists = prev.some((c) => extractId(c.contact._id) === otherId);

        if (!exists) {
          fetchConversations();
          return prev;
        }

        return prev.map((c) => {
          if (extractId(c.contact._id) === otherId) {
            const isCurrentChat = activeContactRef.current?._id === otherId;
            return {
              ...c,
              lastMessage: newMsg,
              unreadCount: isCurrentChat || senderId === currentUserId ? c.unreadCount : c.unreadCount + 1,
            };
          }
          return c;
        });
      });
    };

    const handleMessagesRead = ({ readerId }) => {
      const activeId = extractId(activeContactRef.current);
      const cleanReaderId = extractId(readerId);
      if (activeId && activeId === cleanReaderId) {
        setMessages((prev) =>
          prev.map((m) => {
            const mSenderId = extractId(m.senderId || m.sender);
            return mSenderId === currentUserId ? { ...m, isRead: true } : m;
          })
        );
      }
    };

    const handleDirectoryUpdated = () => {
      fetchConversations();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('directory_updated', handleDirectoryUpdated);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('directory_updated', handleDirectoryUpdated);
    };
  }, [socket, user?._id, fetchConversations]);

  // 4. Send Message Handler
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !activeContact?._id || sending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const res = await api.post('/messages', {
        receiverId: activeContact._id,
        message: messageText,
      });

      const sentMsg = res.data.data;
      setMessages((prev) => {
        if (prev.some((m) => m._id === sentMsg._id)) return prev;
        return [...prev, sentMsg];
      });

      // Update conversation lastMessage
      setConversations((prev) =>
        prev.map((c) =>
          c.contact._id === activeContact._id
            ? { ...c, lastMessage: sentMsg }
            : c
        )
      );

      setTimeout(() => scrollToBottom(true), 30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
      // Restore input text if failed
      setInputMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  // Select contact handler
  const handleSelectContact = (contact) => {
    setActiveContact(contact);
    setSearchParams({ user: contact._id });
    setMobileView('chat');
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.contact.name.toLowerCase().includes(q) ||
      c.contact.email.toLowerCase().includes(q) ||
      c.contact.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-[calc(100vh-8.5rem)] min-h-[500px] flex flex-col animate-fade-in">
      {/* Top Section / Header */}
      <div className="flex items-center justify-between pb-3 border-b border-dark-700/80 mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-lg shadow-md shadow-blue-600/20">
            💬
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display flex items-center gap-2">
              Messages & Internal Comms
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-dark-500'}`} title={isConnected ? 'Real-Time Connected' : 'Connecting...'} />
            </h1>
            <p className="text-xs text-dark-300">
              {user?.role === 'admin'
                ? 'Two-way real-time communications with company staff members'
                : 'Direct two-way channel with Administrators'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex text-[11px] px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700 text-dark-300 items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {isConnected ? 'Real-Time Online' : 'Connecting Socket...'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center justify-between animate-fade-in flex-shrink-0">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 ml-2">✕</button>
        </div>
      )}

      {/* Main Chat Container */}
      <div className="flex-1 min-h-0 bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden flex shadow-xl">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-dark-700 flex flex-col bg-dark-850 flex-shrink-0 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Box */}
          <div className="p-3 border-b border-dark-700/80 bg-dark-800/60">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-xs">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={user?.role === 'admin' ? 'Search staff users...' : 'Search admin...'}
                className="w-full bg-dark-750 border border-dark-700 focus:border-blue-500 text-white placeholder-dark-400 text-xs rounded-xl pl-8 pr-3 py-2 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto divide-y divide-dark-700/40">
            {loadingConversations ? (
              <div className="py-12 text-center text-xs text-dark-400">Loading directory...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-dark-400">
                {searchQuery ? 'No contacts match your search' : 'No contacts available in directory'}
              </div>
            ) : (
              filteredConversations.map(({ contact, lastMessage, unreadCount }) => {
                const isSelected = activeContact?._id === contact._id;
                const isOnline = true; // Registered active user

                return (
                  <button
                    key={contact._id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-blue-600/15 border-l-4 border-blue-500'
                        : 'hover:bg-dark-750/70 border-l-4 border-transparent'
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        contact.role === 'admin'
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {contact.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-dark-850 rounded-full" title="Active Account" />
                    </div>

                    {/* Contact Details & Last Message */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-stone-200'}`}>
                          {contact.name}
                        </p>
                        {lastMessage?.createdAt && (
                          <span className="text-[10px] text-dark-400 flex-shrink-0">
                            {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] text-dark-400 truncate flex-1">
                          {lastMessage ? (
                            <span>
                              {extractId(lastMessage.senderId || lastMessage.sender) === currentUserId ? 'You: ' : ''}
                              {lastMessage.message}
                            </span>
                          ) : (
                            <span className="italic text-dark-500">No messages yet</span>
                          )}
                        </p>

                        {/* Unread Counter Badge */}
                        {unreadCount > 0 && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] shadow-sm animate-scale-in">
                            {unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Role Pill */}
                      <div className="mt-1">
                        <span className={`inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                          contact.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-dark-700 text-dark-300'
                        }`}>
                          {contact.role === 'admin' ? 'Administrator' : 'Staff User'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation */}
        <div
          className={`flex-1 flex flex-col bg-dark-800 min-w-0 ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeContact ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-dark-700 bg-dark-850 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 rounded-lg bg-dark-700 text-dark-300 hover:text-white"
                    title="Back to conversations"
                  >
                    ←
                  </button>

                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    activeContact.role === 'admin'
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {activeContact.name?.[0]?.toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white truncate font-display">
                        {activeContact.name}
                      </p>
                      <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                        activeContact.role === 'admin'
                          ? 'bg-purple-500/15 text-purple-300'
                          : 'bg-blue-500/15 text-blue-300'
                      }`}>
                        {activeContact.role === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-400 truncate">{activeContact.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-dark-400 hidden sm:inline">
                    Two-Way Encrypted Internal Comms
                  </span>
                </div>
              </div>

              {/* Message History Thread */}
              <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-dark-900/40">
                {loadingMessages ? (
                  <div className="py-20 text-center text-xs text-dark-400">Loading conversation history...</div>
                ) : messages.length === 0 ? (
                  <div className="py-20 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-dark-750 flex items-center justify-center text-2xl mx-auto text-dark-400">
                      👋
                    </div>
                    <p className="text-xs font-semibold text-white">Start the conversation</p>
                    <p className="text-[11px] text-dark-400 max-w-xs mx-auto">
                      Send a message to {activeContact.name}. Real-time alerts will notify them instantly.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const messageSenderId = extractId(m.senderId || m.sender);
                    const isMe = Boolean(currentUserId && messageSenderId === currentUserId);

                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
                      >
                        <div className="flex items-end gap-1.5 max-w-[85%] sm:max-w-[70%]">
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                              isMe
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
                                : 'bg-dark-750 text-stone-100 border border-dark-700 rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.message}</p>
                          </div>
                        </div>

                        {/* Message Metadata: Time and Read Receipt */}
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <span className="text-[10px] text-dark-400">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe && (
                            <span
                              className={`text-[11px] font-bold tracking-tighter ${
                                m.isRead ? 'text-sky-400 font-extrabold' : 'text-dark-400'
                              }`}
                              title={m.isRead ? 'Read (Double Blue Tick)' : 'Sent / Delivered (Single Tick)'}
                            >
                              {m.isRead ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="relative z-20 pointer-events-auto p-3 border-t border-dark-700 bg-dark-850 flex items-center gap-2 flex-shrink-0"
              >
                <input
                  ref={messageInputRef}
                  id="chat-message-input"
                  name="chatMessage"
                  type="text"
                  autoFocus
                  autoComplete="off"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Type your message to ${activeContact.name}... (Press Enter to send)`}
                  disabled={sending}
                  className="flex-1 bg-dark-750 border border-dark-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-dark-400 text-xs sm:text-sm rounded-xl px-4 py-2.5 outline-none transition-colors pointer-events-auto cursor-text select-text z-20"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0 pointer-events-auto cursor-pointer"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <span>➤</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Empty State when no conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-dark-750 border border-dark-700 flex items-center justify-center text-3xl mb-4 shadow-inner">
                💬
              </div>
              <h2 className="text-base font-bold text-white font-display mb-1">
                Select a Conversation
              </h2>
              <p className="text-xs text-dark-400 max-w-sm mb-4">
                {user?.role === 'admin'
                  ? 'Choose a staff user from the directory on the left to start sending and receiving real-time messages.'
                  : 'Select an administrator to ask questions, request stock updates, or send operational inquiries.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

