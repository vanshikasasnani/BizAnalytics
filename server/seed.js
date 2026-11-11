const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Sale = require('./models/Sale');
const Notification = require('./models/Notification');

const sampleProducts = [
  {
    name: 'Enterprise Cloud ERP Suite',
    sku: 'ERP-ENT-2024',
    description: 'All-in-one cloud enterprise resource planning software subscription (Annual)',
    category: 'Software & SaaS',
    price: 49999,
    costPrice: 12000,
    stock: 999,
    lowStockThreshold: 10,
    soldCount: 8,
    status: 'Active',
  },
  {
    name: 'Pro Ultra HD 4K Monitor 32"',
    sku: 'MON-4K-PRO32',
    description: 'IPS color-calibrated professional workstation display with USB-C Hub',
    category: 'Electronics',
    price: 34999,
    costPrice: 24000,
    stock: 24,
    lowStockThreshold: 5,
    soldCount: 15,
    status: 'Active',
  },
  {
    name: 'Ergonomic Executive Mesh Chair',
    sku: 'FURN-CHR-ERG01',
    description: 'High-back lumbar support ergonomic mesh chair with 4D adjustable armrests',
    category: 'Furniture',
    price: 18499,
    costPrice: 11000,
    stock: 12,
    lowStockThreshold: 5,
    soldCount: 22,
    status: 'Active',
  },
  {
    name: 'Wireless Mechanical Keyboard & Mouse Combo',
    sku: 'ACC-KBD-WLS02',
    description: 'Low-profile wireless mechanical switch keyboard and precision optical mouse',
    category: 'Accessories',
    price: 6499,
    costPrice: 3800,
    stock: 45,
    lowStockThreshold: 8,
    soldCount: 38,
    status: 'Active',
  },
  {
    name: 'Business Laptop Core i7 16GB/512GB',
    sku: 'LAP-BUS-I716',
    description: 'Lightweight business ultrabook with 14-inch anti-glare screen and TPM 2.0 security',
    category: 'Electronics',
    price: 68999,
    costPrice: 52000,
    stock: 9,
    lowStockThreshold: 4,
    soldCount: 14,
    status: 'Active',
  },
  {
    name: 'Gigabit Managed PoE+ Switch 24-Port',
    sku: 'NET-SW-POE24',
    description: 'Enterprise rackmount 24-port Gigabit PoE+ network switch with SFP fiber uplinks',
    category: 'Hardware',
    price: 22500,
    costPrice: 16000,
    stock: 4, // Intentionally low stock for alert demo
    lowStockThreshold: 5,
    soldCount: 11,
    status: 'Active',
  },
  {
    name: 'Electric Motorized Standing Desk 140x70',
    sku: 'FURN-DSK-MOT14',
    description: 'Dual-motor electric height adjustable standing desk with memory presets',
    category: 'Furniture',
    price: 28999,
    costPrice: 18500,
    stock: 7,
    lowStockThreshold: 3,
    soldCount: 19,
    status: 'Active',
  },
  {
    name: 'Noise-Cancelling Conference Headset',
    sku: 'ACC-AUD-NC01',
    description: 'Bluetooth 5.3 headset with AI beamforming microphone for clear calls',
    category: 'Accessories',
    price: 4999,
    costPrice: 2800,
    stock: 35,
    lowStockThreshold: 10,
    soldCount: 42,
    status: 'Active',
  },
  {
    name: 'Quarterly Cybersecurity Audit & Support',
    sku: 'SRV-SEC-AUDQ',
    description: 'Scheduled vulnerability assessment, penetration testing, and IT security consult',
    category: 'Services',
    price: 45000,
    costPrice: 15000,
    stock: 100,
    lowStockThreshold: 5,
    soldCount: 6,
    status: 'Active',
  },
  {
    name: 'Color Laser Multi-Function Network Printer',
    sku: 'OFC-PRN-MFP03',
    description: 'Fast duplex color laser printing, scanning, and copying with Wi-Fi Direct',
    category: 'Office Supplies',
    price: 32000,
    costPrice: 23500,
    stock: 3, // Low stock demo
    lowStockThreshold: 5,
    soldCount: 12,
    status: 'Active',
  },
  {
    name: 'Heavy-Duty Cross-Cut Paper Shredder',
    sku: 'OFC-SHR-HD10',
    description: 'P-4 high security 18-sheet cross-cut shredder for sensitive office documents',
    category: 'Office Supplies',
    price: 8999,
    costPrice: 5500,
    stock: 18,
    lowStockThreshold: 4,
    soldCount: 16,
    status: 'Active',
  },
  {
    name: 'Thermal Receipt & Barcode Printer',
    sku: 'POS-PRN-TH80',
    description: 'High-speed 80mm thermal POS receipt and label printer with auto-cutter',
    category: 'Hardware',
    price: 7499,
    costPrice: 4200,
    stock: 22,
    lowStockThreshold: 5,
    soldCount: 29,
    status: 'Active',
  },
];

const sampleCustomers = [
  {
    name: 'Acme Technologies Pvt Ltd',
    email: 'purchasing@acmetech.in',
    phone: '+91 98201 11223',
    company: 'Acme Technologies',
    address: '402 Cyber City, Tech Park',
    city: 'Bengaluru',
    country: 'India',
    status: 'Active',
    notes: 'Premium enterprise client with quarterly hardware refresh cycles',
  },
  {
    name: 'Apex Global Logistics',
    email: 'ops@apexgl.com',
    phone: '+91 98450 33445',
    company: 'Apex Global',
    address: '77 Port Road, Logistics Hub',
    city: 'Mumbai',
    country: 'India',
    status: 'Active',
    notes: 'Key logistics partner purchasing network and POS gear',
  },
  {
    name: 'BrightSpark Digital Solutions',
    email: 'accounts@brightspark.io',
    phone: '+91 97110 55667',
    company: 'BrightSpark Media',
    address: '12 Creative Studio Lane',
    city: 'Hyderabad',
    country: 'India',
    status: 'Active',
    notes: 'Fast-growing creative agency buying displays and ergonomics',
  },
  {
    name: 'Zenith Financial Advisors',
    email: 'admin@zenithfa.com',
    phone: '+91 99200 77889',
    company: 'Zenith Financial',
    address: 'B-Wing Financial District',
    city: 'Mumbai',
    country: 'India',
    status: 'Active',
    notes: 'High security requirements, purchased cybersecurity consulting',
  },
  {
    name: 'Pinnacle Healthcare Labs',
    email: 'procurement@pinnaclelabs.org',
    phone: '+91 98300 22334',
    company: 'Pinnacle Healthcare',
    address: 'Plot 15 Biotech Valley',
    city: 'Pune',
    country: 'India',
    status: 'Active',
    notes: 'Regular orders of printing and desktop equipment',
  },
  {
    name: 'Vanguard Retail Ventures',
    email: 'stores@vanguardretail.in',
    phone: '+91 98111 66778',
    company: 'Vanguard Retail',
    address: '5th Floor Central Mall',
    city: 'New Delhi',
    country: 'India',
    status: 'Active',
    notes: 'Multi-store retail chain ordering POS and barcode equipment',
  },
  {
    name: 'Nexus Cloud Systems',
    email: 'billing@nexuscloud.tech',
    phone: '+91 98666 44556',
    company: 'Nexus Systems',
    address: 'Tower C Infotech Park',
    city: 'Chennai',
    country: 'India',
    status: 'Active',
    notes: 'SaaS partner',
  },
  {
    name: 'Horizon Architecture Studio',
    email: 'contact@horizonstudio.co',
    phone: '+91 98888 12345',
    company: 'Horizon Architects',
    address: 'Studio 4 Design Enclave',
    city: 'Ahmedabad',
    country: 'India',
    status: 'Active',
    notes: 'High-end workstation displays and motorized standing desks',
  },
  {
    name: 'Starlight Media Group',
    email: 'finance@starlightmedia.com',
    phone: '+91 97777 98765',
    company: 'Starlight Media',
    address: '88 Film City Road',
    city: 'Mumbai',
    country: 'India',
    status: 'Active',
    notes: 'Conference gear and office equipment',
  },
  {
    name: 'Quantum Bio Innovations',
    email: 'purchasing@quantumbio.in',
    phone: '+91 96666 54321',
    company: 'Quantum Bio',
    address: 'Science Corridor Unit 9',
    city: 'Bengaluru',
    country: 'India',
    status: 'Lead',
    notes: 'Prospective customer evaluating enterprise software packages',
  },
  {
    name: 'Silverline Legal Partners',
    email: 'office@silverlinelegal.com',
    phone: '+91 95555 11223',
    company: 'Silverline Legal',
    address: 'High Court Chambers 2B',
    city: 'New Delhi',
    country: 'India',
    status: 'Active',
    notes: 'Document management, shredders, and ergonomic seating',
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for Business Analytics seeding');

    // Clean up existing collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Sale.deleteMany({});
    await Notification.deleteMany({});
    console.log('🧹 Cleared previous collections');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Administrator',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
    });

    const staffUser = await User.create({
      name: 'Sales Manager',
      email: 'staff@example.com',
      password: 'staff123',
      role: 'user',
    });

    const demoUser = await User.create({
      name: 'Business Owner',
      email: 'demo@example.com',
      password: 'password123',
      role: 'admin', // Demo account gets full access
    });

    console.log('👤 Created Users (Admin, Staff, Demo)');

    // 2. Create Products
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`📦 Seeded ${createdProducts.length} Sample Products`);

    // 3. Create Customers
    const createdCustomers = await Customer.insertMany(sampleCustomers);
    console.log(`👥 Seeded ${createdCustomers.length} Sample Customers`);

    // 4. Create 25 Sample Sales across past 6 months
    const paymentMethods = ['Credit Card', 'Bank Transfer', 'UPI', 'PayPal', 'Cash'];
    const now = new Date();
    const salesToInsert = [];

    // Helper to get random item from array
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    for (let i = 1; i <= 25; i++) {
      // Pick random customer
      const cust = getRandom(createdCustomers);

      // Pick 1 to 3 distinct products
      const numItems = getRandomInt(1, 3);
      const chosenProducts = [];
      while (chosenProducts.length < numItems) {
        const prod = getRandom(createdProducts);
        if (!chosenProducts.some((p) => p._id.toString() === prod._id.toString())) {
          chosenProducts.push(prod);
        }
      }

      let subtotal = 0;
      let totalCost = 0;
      let totalProfit = 0;
      const saleItems = [];

      for (const prod of chosenProducts) {
        const qty = getRandomInt(1, 4);
        const itemSubtotal = qty * prod.price;
        const itemCost = qty * prod.costPrice;
        const itemProfit = itemSubtotal - itemCost;

        subtotal += itemSubtotal;
        totalCost += itemCost;
        totalProfit += itemProfit;

        saleItems.push({
          product: prod._id,
          name: prod.name,
          sku: prod.sku,
          category: prod.category,
          quantity: qty,
          unitPrice: prod.price,
          unitCost: prod.costPrice,
          subtotal: itemSubtotal,
          profit: itemProfit,
        });
      }

      // Generate date distributed over last 180 days
      const daysAgo = Math.floor((25 - i) * 6.5) + getRandomInt(0, 3);
      const saleDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const tax = Math.round(subtotal * 0.05); // 5% tax
      const discount = i % 4 === 0 ? Math.round(subtotal * 0.1) : 0; // 10% discount on some
      const totalAmount = subtotal + tax - discount;
      const finalProfit = totalProfit + tax - discount;

      const invNumber = `INV-2024-${String(1000 + i)}`;

      salesToInsert.push({
        saleNumber: invNumber,
        customer: cust._id,
        customerName: cust.name,
        customerEmail: cust.email,
        items: saleItems,
        subtotal,
        tax,
        discount,
        totalAmount,
        totalCost,
        totalProfit: finalProfit,
        paymentMethod: getRandom(paymentMethods),
        paymentStatus: 'Paid',
        date: saleDate,
        notes: `Sample demonstration invoice #${invNumber}`,
        createdBy: demoUser._id,
      });

      // Update customer running totals
      cust.totalOrders += 1;
      cust.totalSpent += totalAmount;
    }

    await Sale.insertMany(salesToInsert);
    console.log(`💳 Seeded ${salesToInsert.length} Sample Sales Transactions`);

    // Save updated customer totals
    for (const cust of createdCustomers) {
      await cust.save();
    }

    // 5. Seed Initial Notifications
    await Notification.create([
      {
        title: 'Low Stock Alert',
        message: 'Color Laser Multi-Function Network Printer (OFC-PRN-MFP03) has only 3 units left.',
        type: 'low_stock',
        link: '/products',
        read: false,
      },
      {
        title: 'High-Value Sale Completed',
        message: 'Acme Technologies Pvt Ltd purchased Enterprise Cloud ERP Suite for ₹49,999.',
        type: 'sale',
        link: '/sales',
        read: false,
      },
      {
        title: 'New Customer Registered',
        message: 'Silverline Legal Partners registered as a new active enterprise account.',
        type: 'customer',
        link: '/customers',
        read: true,
      },
      {
        title: 'System Initialized',
        message: 'Business Performance & Sales Analytics platform is online and ready.',
        type: 'system',
        link: '/dashboard',
        read: true,
      },
    ]);
    console.log('🔔 Seeded Initial Notifications');

    console.log('\n🎉 Demonstration Business Data Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
