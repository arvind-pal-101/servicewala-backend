const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

const categories = [
  {
    name: 'Electrician',
    slug: 'electrician',
    description: 'Electrical wiring, repair, and installation services',
    icon: '⚡',
    isActive: true
  },
  {
    name: 'Plumber',
    slug: 'plumber',
    description: 'Plumbing repair, installation, and maintenance',
    icon: '🔧',
    isActive: true
  },
  {
    name: 'Carpenter',
    slug: 'carpenter',
    description: 'Furniture making, repair, and woodwork services',
    icon: '🪚',
    isActive: true
  },
  {
    name: 'Painter',
    slug: 'painter',
    description: 'House painting and wall decoration services',
    icon: '🎨',
    isActive: true
  },
  {
    name: 'AC Repair',
    slug: 'ac-repair',
    description: 'AC installation, repair, and servicing',
    icon: '❄️',
    isActive: true
  },
  {
    name: 'Mechanic',
    slug: 'mechanic',
    description: 'Vehicle repair and maintenance services',
    icon: '🔩',
    isActive: true
  },
  {
    name: 'Tutor',
    slug: 'tutor',
    description: 'Home tuition and educational services',
    icon: '📚',
    isActive: true
  },
  {
    name: 'Cleaner',
    slug: 'cleaner',
    description: 'House cleaning and sanitization services',
    icon: '🧹',
    isActive: true
  }
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Delete existing categories
    await Category.deleteMany();
    console.log('🗑️  Old categories deleted\n');

    console.log('📋 Creating Categories:');
    
    // Insert all categories at once (faster and no pre-save hooks)
    const createdCategories = await Category.insertMany(categories);
    
    // Display created categories
    createdCategories.forEach(cat => {
      console.log(`${cat.icon} ${cat.name} - ID: ${cat._id}`);
    });

    console.log('\n✅ All categories created successfully!');
    console.log('💡 Copy these Category IDs for testing!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedCategories();