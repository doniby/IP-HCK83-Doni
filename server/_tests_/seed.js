const { User, Category, Entry, Translation, EntryCategory, Transaction, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

async function seedAll() {
  await sequelize.sync({ force: true });
  // Create users
  const password = await bcrypt.hash('password', 10);
  const users = await User.bulkCreate([
    { username: 'user1', email: 'user1@mail.com', password },
    { username: 'user2', email: 'user2@mail.com', password, tier: 'premium' },
  ]);
  // Create categories for each user
  const categories = await Category.bulkCreate([
    { name: 'general', UserId: users[0].id },
    { name: 'general', UserId: users[1].id },
    { name: 'food', UserId: users[0].id },
    { name: 'travel', UserId: users[1].id },
  ]);
  // Create entries
  const entries = await Entry.bulkCreate([
    { content: 'saya makan', type: 'sentence', UserId: users[0].id },
    { content: 'pergi', type: 'word', UserId: users[1].id },
  ]);
  // Create translations
  await Translation.bulkCreate([
    { translatedText: 'I eat', EntryId: entries[0].id },
    { translatedText: 'go', EntryId: entries[1].id },
  ]);
  // Link entries to categories
  await EntryCategory.bulkCreate([
    { EntryId: entries[0].id, CategoryId: categories[0].id },
    { EntryId: entries[1].id, CategoryId: categories[3].id },
  ]);
  // Create a transaction
  await Transaction.create({
    orderId: 'ORDER-1-123456',
    status: 'settlement',
    UserId: users[0].id,
    redirectUrl: 'http://example.com',
  });
}

module.exports = { seedAll };
