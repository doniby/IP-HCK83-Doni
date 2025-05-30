const request = require('supertest');
const app = require('../app');
const { User, Entry, Category, Translation, EntryCategory } = require('../models');
const { createTestUser, generateToken } = require('./setup');

require('./setup');

describe('Entries Endpoints', () => {
  let user;
  let token;
  let premiumUser;
  let premiumToken;
  let generalCategory;
  beforeEach(async () => {
    // Create a free tier test user
    user = await createTestUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      tier: 'free'
    });
    
    token = generateToken(user);

    // Create a premium user
    premiumUser = await createTestUser({
      username: 'premiumuser',
      email: 'premium@example.com',
      password: 'password123',
      tier: 'premium'
    });
    
    premiumToken = generateToken(premiumUser);

    // Find general category for the user
    generalCategory = await Category.findOne({
      where: { name: 'general', UserId: user.id }
    });
  });

  describe('GET /entries', () => {
    beforeEach(async () => {
      // Create some test entries
      const entry1 = await Entry.create({
        content: 'Hello world',
        type: 'text',
        UserId: user.id
      });

      const entry2 = await Entry.create({
        content: 'Goodbye world',
        type: 'text',
        UserId: user.id
      });

      // Create translations
      await Translation.create({
        originalText: 'Hello world',
        translatedText: 'Hola mundo',
        targetLanguage: 'es',
        EntryId: entry1.id
      });

      await Translation.create({
        originalText: 'Goodbye world',
        translatedText: 'Adiós mundo',
        targetLanguage: 'es',
        EntryId: entry2.id
      });

      // Associate entries with categories
      await EntryCategory.create({
        EntryId: entry1.id,
        CategoryId: generalCategory.id
      });

      await EntryCategory.create({
        EntryId: entry2.id,
        CategoryId: generalCategory.id
      });
    });

    it('should get all entries for authenticated user', async () => {
      const response = await request(app)
        .get('/entries')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      const entry = response.body[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('content');
      expect(entry).toHaveProperty('type');
      expect(entry).toHaveProperty('Translation');
      expect(entry).toHaveProperty('Categories');
      expect(Array.isArray(entry.Categories)).toBe(true);
    });

    it('should return 401 for missing authorization token', async () => {
      const response = await request(app)
        .get('/entries')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for invalid authorization token', async () => {
      const response = await request(app)
        .get('/entries')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should only return entries belonging to authenticated user', async () => {
      // Create entry for premium user
      await Entry.create({
        content: 'Premium content',
        type: 'text',
        UserId: premiumUser.id
      });

      const response = await request(app)
        .get('/entries')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should only return entries for the authenticated user (not premium user's entry)
      expect(response.body.length).toBe(2);
      response.body.forEach(entry => {
        expect(entry.UserId).toBe(user.id);
      });
    });
  });

  describe('POST /entries', () => {
    const retryRequest = async (requestFn, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        const response = await requestFn();
        if (response.status !== 429) {
          return response;
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
      }
      throw new Error('Rate limit exceeded after retries');
    };

    it('should create a new entry successfully', async () => {
      const entryData = {
        content: 'New entry content',
        type: 'text'
      };

      const response = await retryRequest(() =>
        request(app)
          .post('/entries')
          .set('Authorization', `Bearer ${token}`)
          .send(entryData)
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('entry');
      expect(response.body).toHaveProperty('translation');
      expect(response.body.entry).toHaveProperty('id');
      expect(response.body.entry).toHaveProperty('content', entryData.content);
      expect(response.body.entry).toHaveProperty('type', entryData.type);
      expect(response.body.entry).toHaveProperty('UserId', user.id);

      // Verify entry was created in database
      const entry = await Entry.findByPk(response.body.entry.id);
      expect(entry).toBeTruthy();
    });

    it('should create entry with specific categories using categoryIds', async () => {
      // Create a custom category
      const customCategory = await Category.create({
        name: 'custom',
        UserId: user.id
      });

      const entryData = {
        content: 'New entry content',
        type: 'text',
        categoryIds: [customCategory.id]
      };

      const response = await retryRequest(() =>
        request(app)
          .post('/entries')
          .set('Authorization', `Bearer ${token}`)
          .send(entryData)
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('entry');
      
      // Verify category association
      const entryCategories = await EntryCategory.findAll({
        where: { EntryId: response.body.entry.id }
      });
      expect(entryCategories.length).toBe(1);
      expect(entryCategories[0].CategoryId).toBe(customCategory.id);
    });

    it('should create entry with categories using categoryNames', async () => {
      const entryData = {
        content: 'New entry content',
        type: 'text',
        categoryNames: ['work', 'personal']
      };

      const response = await request(app)
        .post('/entries')
        .set('Authorization', `Bearer ${token}`)
        .send(entryData)
        .expect(201);

      expect(response.body).toHaveProperty('entry');
      
      // Verify categories were created and associated
      const workCategory = await Category.findOne({
        where: { name: 'work', UserId: user.id }
      });
      const personalCategory = await Category.findOne({
        where: { name: 'personal', UserId: user.id }
      });
      
      expect(workCategory).toBeTruthy();
      expect(personalCategory).toBeTruthy();

      const entryCategories = await EntryCategory.findAll({
        where: { EntryId: response.body.entry.id }
      });
      expect(entryCategories.length).toBe(2);
    });

    it('should return 401 for missing authorization token', async () => {
      const entryData = {
        content: 'New entry content',
        type: 'text'
      };

      const response = await request(app)
        .post('/entries')
        .send(entryData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing content', async () => {
      const entryData = {
        type: 'text'
      };

      const response = await request(app)
        .post('/entries')
        .set('Authorization', `Bearer ${token}`)
        .send(entryData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing type', async () => {
      const entryData = {
        content: 'New entry content'
      };

      const response = await request(app)
        .post('/entries')
        .set('Authorization', `Bearer ${token}`)
        .send(entryData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when free user exceeds entry limit', async () => {
      // Create 5 entries (assuming free limit is 5)
      for (let i = 0; i < 5; i++) {
        await Entry.create({
          content: `Entry ${i}`,
          type: 'text',
          UserId: user.id
        });
      }

      const entryData = {
        content: 'This should fail',
        type: 'text'
      };

      const response = await request(app)
        .post('/entries')
        .set('Authorization', `Bearer ${token}`)
        .send(entryData)
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/limit/i);
    });

    it('should allow premium user to create more than 5 entries', async () => {
      // Create 5 entries for premium user
      for (let i = 0; i < 5; i++) {
        await Entry.create({
          content: `Entry ${i}`,
          type: 'text',
          UserId: premiumUser.id
        });
      }

      const entryData = {
        content: 'Premium user entry',
        type: 'text'
      };

      const response = await request(app)
        .post('/entries')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send(entryData)
        .expect(201);

      expect(response.body).toHaveProperty('entry');
    });
  });

  describe('PUT /entries/:id', () => {
    let entry;

    beforeEach(async () => {
      // Create an entry to update
      entry = await Entry.create({
        content: 'Original content',
        type: 'text',
        UserId: user.id
      });

      // Associate with general category
      await EntryCategory.create({
        EntryId: entry.id,
        CategoryId: generalCategory.id
      });
    });

    it('should update entry successfully', async () => {
      const updateData = {
        content: 'Updated content',
        type: 'text'
      };

      const response = await request(app)
        .put(`/entries/${entry.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('entry');
      expect(response.body.entry).toHaveProperty('content', updateData.content);

      // Verify entry was updated in database
      const updatedEntry = await Entry.findByPk(entry.id);
      expect(updatedEntry.content).toBe(updateData.content);
    });

    it('should update entry categories using categoryIds', async () => {
      // Create a new category
      const newCategory = await Category.create({
        name: 'updated',
        UserId: user.id
      });

      const updateData = {
        categoryIds: [newCategory.id]
      };

      const response = await request(app)
        .put(`/entries/${entry.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('entry');

      // Verify category associations were updated
      const entryCategories = await EntryCategory.findAll({
        where: { EntryId: entry.id }
      });
      expect(entryCategories.length).toBe(1);
      expect(entryCategories[0].CategoryId).toBe(newCategory.id);
    });

    it('should return 401 for missing authorization token', async () => {
      const updateData = {
        content: 'Updated content'
      };

      const response = await request(app)
        .put(`/entries/${entry.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent entry', async () => {
      const updateData = {
        content: 'Updated content'
      };

      const response = await request(app)
        .put('/entries/999999')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should not allow updating entry that belongs to another user', async () => {
      const updateData = {
        content: 'Updated content'
      };

      const response = await request(app)
        .put(`/entries/${entry.id}`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /entries/:id', () => {
    let entry;

    beforeEach(async () => {
      // Create an entry to delete
      entry = await Entry.create({
        content: 'Entry to delete',
        type: 'text',
        UserId: user.id
      });

      // Create translation
      await Translation.create({
        originalText: 'Entry to delete',
        translatedText: 'Entrada para eliminar',
        targetLanguage: 'es',
        EntryId: entry.id
      });

      // Associate with category
      await EntryCategory.create({
        EntryId: entry.id,
        CategoryId: generalCategory.id
      });
    });

    it('should delete entry successfully', async () => {
      const response = await request(app)
        .delete(`/entries/${entry.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify entry was deleted from database
      const deletedEntry = await Entry.findByPk(entry.id);
      expect(deletedEntry).toBeFalsy();

      // Verify associated translation was deleted
      const translation = await Translation.findOne({
        where: { EntryId: entry.id }
      });
      expect(translation).toBeFalsy();

      // Verify entry-category association was deleted
      const entryCategory = await EntryCategory.findOne({
        where: { EntryId: entry.id }
      });
      expect(entryCategory).toBeFalsy();
    });

    it('should return 401 for missing authorization token', async () => {
      const response = await request(app)
        .delete(`/entries/${entry.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent entry', async () => {
      const response = await request(app)
        .delete('/entries/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should not allow deleting entry that belongs to another user', async () => {
      const response = await request(app)
        .delete(`/entries/${entry.id}`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
});
