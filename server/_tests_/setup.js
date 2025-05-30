require('./config');
const { sequelize } = require('../models');
const { User, Category } = require('../models');
const jwt = require('jsonwebtoken');

// Helper function to create a test user
async function createTestUser(userData = {}) {
  const defaultUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    tier: 'free'
  };
  
  const finalUserData = { ...defaultUserData, ...userData };
  
  const user = await User.create(finalUserData);
  
  // Create general category for the user (only if it doesn't exist)
  try {
    await Category.create({ 
      name: 'general', 
      UserId: user.id 
    });
  } catch (error) {
    // If it's a unique constraint error, that's fine - the category already exists for this user
    if (!error.name || !error.name.includes('Unique')) {
      throw error;
    }
  }
  
  return user;
}

// Helper function to generate JWT token for user
function generateToken(user) {
  const payload = {
    id: user.id,
    tier: user.tier
  };
  return jwt.sign(payload, process.env.JWT_SECRET);
}

// Setup and teardown for tests
beforeAll(async () => {
  // Sync database for testing
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

// Clean up database between tests
afterEach(async () => {
  // Clear all tables in proper order to avoid foreign key constraints
  const { EntryCategory, Translation, Entry, Transaction, Category, User } = sequelize.models;
  
  try {
    // Delete junction tables first
    await EntryCategory.destroy({ where: {}, force: true });
    
    // Delete dependent entities
    await Translation.destroy({ where: {}, force: true });
    await Entry.destroy({ where: {}, force: true });
    await Transaction.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
    
    // Delete users last
    await User.destroy({ where: {}, force: true });
  } catch (error) {
    console.log('Cleanup error:', error.message);
    // Force cleanup if constraints fail
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const model of Object.values(sequelize.models)) {
      await model.destroy({ where: {}, force: true });
    }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
});

module.exports = {
  sequelize,
  createTestUser,
  generateToken
};
