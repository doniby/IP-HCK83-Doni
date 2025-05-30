const request = require('supertest');
const app = require('../app');
const { User, Category } = require('../models');
const { createTestUser, generateToken } = require('./setup');

require('./setup');

describe('Categories Endpoints', () => {
  let user;
  let token;
  beforeEach(async () => {
    // Create a test user
    user = await createTestUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      tier: 'free'
    });
    
    token = generateToken(user);
  });

  describe('GET /categories', () => {
    it('should get all categories for authenticated user', async () => {
      const response = await request(app)
        .get('/categories')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Should have at least the 'general' category created during registration
      const generalCategory = response.body.find(cat => cat.name === 'general');
      expect(generalCategory).toBeTruthy();
      expect(generalCategory.UserId).toBe(user.id);
    });

    it('should return 401 for missing authorization token', async () => {
      const response = await request(app)
        .get('/categories')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for invalid authorization token', async () => {
      const response = await request(app)
        .get('/categories')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /categories', () => {
    it('should create a new category successfully', async () => {
      const categoryData = {
        name: 'work'
      };

      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', categoryData.name);
      expect(response.body).toHaveProperty('UserId', user.id);

      // Verify category was created in database
      const category = await Category.findByPk(response.body.id);
      expect(category).toBeTruthy();
      expect(category.name).toBe(categoryData.name);
    });

    it('should return 401 for missing authorization token', async () => {
      const categoryData = {
        name: 'work'
      };

      const response = await request(app)
        .post('/categories')
        .send(categoryData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for empty name', async () => {
      const categoryData = {
        name: ''
      };

      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for duplicate category name for same user', async () => {
      const categoryData = {
        name: 'work'
      };

      // Create first category
      await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /categories/:id', () => {
    let category;

    beforeEach(async () => {
      // Create a category to update
      const categoryData = {
        name: 'work'
      };

      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData);

      category = response.body;
    });

    it('should update category successfully', async () => {
      const updateData = {
        name: 'updated-work'
      };

      const response = await request(app)
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', category.id);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('UserId', user.id);

      // Verify category was updated in database
      const updatedCategory = await Category.findByPk(category.id);
      expect(updatedCategory.name).toBe(updateData.name);
    });

    it('should return 401 for missing authorization token', async () => {
      const updateData = {
        name: 'updated-work'
      };

      const response = await request(app)
        .put(`/categories/${category.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent category', async () => {
      const updateData = {
        name: 'updated-work'
      };

      const response = await request(app)
        .put('/categories/999999')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });    it('should not allow updating category that belongs to another user', async () => {
      // Create another user
      const otherUserData = {
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123'
      };

      const otherUserResponse = await request(app)
        .post('/user/register')
        .send(otherUserData);

      const otherUser = otherUserResponse.body.user;
      const otherToken = generateToken(otherUser);

      const updateData = {
        name: 'updated-work'
      };

      const response = await request(app)
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /categories/:id', () => {
    let category;

    beforeEach(async () => {
      // Create a category to delete
      const categoryData = {
        name: 'work'
      };

      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData);

      category = response.body;
    });

    it('should delete category successfully', async () => {
      const response = await request(app)
        .delete(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify category was deleted from database
      const deletedCategory = await Category.findByPk(category.id);
      expect(deletedCategory).toBeFalsy();
    });

    it('should return 401 for missing authorization token', async () => {
      const response = await request(app)
        .delete(`/categories/${category.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .delete('/categories/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when trying to delete general category', async () => {
      // Find the general category
      const generalCategory = await Category.findOne({
        where: { name: 'general', UserId: user.id }
      });

      const response = await request(app)
        .delete(`/categories/${generalCategory.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/general/i);
    });    it('should not allow deleting category that belongs to another user', async () => {
      // Create another user
      const otherUserData = {
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123'
      };

      const otherUserResponse = await request(app)
        .post('/user/register')
        .send(otherUserData);

      const otherUser = otherUserResponse.body.user;
      const otherToken = generateToken(otherUser);

      const response = await request(app)
        .delete(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
});
