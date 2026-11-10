import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-display font-black text-dark-700 mb-4">404</div>
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-display font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-dark-400 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-secondary">Go Home</Link>
          <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
