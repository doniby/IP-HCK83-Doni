const request = require('supertest');
const app = require('../app');
const { User, Entry, Category, Translation } = require('../models');
const jwt = require('jsonwebtoken');
const { createTestUser, generateToken } = require('./setup');

require('./setup');

describe('Authentication Middleware Tests', () => {
  let user;
  let token;
  let expiredToken;
  let invalidToken;
  beforeEach(async () => {
    // Create a test user
    user = await createTestUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      tier: 'free'
    });
    
    token = generateToken(user);

    // Generate expired token (expires immediately)
    const payload = { id: user.id, tier: 'free' };
    expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1s' });

    // Generate invalid token with wrong secret
    invalidToken = jwt.sign(payload, 'wrong-secret');
  });

  describe('Valid Authentication', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/entries')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow access with token that has extra spaces', async () => {
      const response = await request(app)
        .get('/entries')
        .set('Authorization', ` Bearer  ${token} `)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Invalid Authentication', () => {
    it('should reject requests without Authorization header', async () => {
      const response = await request(app)
        .get('/entries')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject requests with empty Authorization header', async () => {
      const response = await request(app)
        .get('/entries')
        .set('Authorization', '')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject requests without Bearer prefix', async () => {
      const response = await request(app)
        .get('/entries')
        .set('Authorization', token)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject requests with malformed Bearer token', async () => {
      const response = await request(app)
        .get('/entries')
        .set('Authorization', 'Bearer')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject requests with expired token', async () => {
      const response = await request(app)
        .get('/entries')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject requests with invalid token signature', async () => {
      const response = await request(app)
        .get('/entries')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject requests with completely invalid token format', async () => {
      const response = await request(app)
        .get('/entries')
        .set('Authorization', 'Bearer invalid.token.format')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('User Context in Protected Routes', () => {
    it('should provide correct user context in request', async () => {
      // Create an entry to verify user context
      const entryData = {
        content: 'Test entry',
        type: 'text'
      };

      const response = await request(app)
        .post('/entries')
        .set('Authorization', `Bearer ${token}`)
        .send(entryData)
        .expect(201);

      expect(response.body.entry).toHaveProperty('UserId', user.id);
    });

    it('should handle non-existent user in token', async () => {
      // Create token with non-existent user ID
      const fakePayload = {
        id: 999999,
        tier: 'free'
      };
      const fakeToken = jwt.sign(fakePayload, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/entries')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});
