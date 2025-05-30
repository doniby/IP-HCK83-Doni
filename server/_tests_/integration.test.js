const request = require('supertest');
const app = require('../app');

require('./setup');

describe('Integration Tests', () => {
  describe('Error Handling Middleware', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle validation errors properly', async () => {
      const response = await request(app)
        .post('/user/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });    it('should handle internal server errors gracefully', async () => {
      // Test that our error handler middleware is properly configured
      // by creating a route that throws an error
      const testApp = require('express')();
      testApp.use(require('express').json());
      
      // Add a route that throws an error
      testApp.get('/test-error', (req, res, next) => {
        const error = new Error('Test internal server error');
        error.status = 500;
        next(error);
      });
      
      // Add our error handler
      testApp.use(require('../middlewares/errorHandler'));
      
      const response = await request(testApp)
        .get('/test-error')
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Test internal server error');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .options('/user/register')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('JSON Parsing', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/user/register')
        .set('Content-Type', 'application/json')
        .send('{ malformed json }')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });
  describe('Request Size Limits', () => {
    it('should handle large request bodies appropriately', async () => {
      const largeContent = 'a'.repeat(10000); // 10KB content (exceeds 5KB limit)
      
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Register user first
      await request(app)
        .post('/user/register')
        .send(userData)
        .expect(201);

      // Login to get token
      const loginResponse = await request(app)
        .post('/user/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const token = loginResponse.body.user.access_token;

      // Try to create entry with large content (should fail due to payload size limit)
      const entryData = {
        content: largeContent,
        type: 'text'
      };

      const response = await request(app)
        .post('/entries')
        .set('Authorization', `Bearer ${token}`)
        .send(entryData);

      // Should return 413 Payload Too Large due to Express json size limit
      expect(response.status).toBe(413);
    });

    it('should handle request bodies within size limits', async () => {
      const normalContent = 'This is normal sized content'; // Small content
      
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123'
      };

      // Register user first
      await request(app)
        .post('/user/register')
        .send(userData)
        .expect(201);

      // Login to get token
      const loginResponse = await request(app)
        .post('/user/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const token = loginResponse.body.user.access_token;

      // Try to create entry with normal content (should succeed)
      const entryData = {
        content: normalContent,
        type: 'text'
      };

      const response = await request(app)
        .post('/entries')
        .set('Authorization', `Bearer ${token}`)
        .send(entryData)
        .expect(201);

      expect(response.body).toHaveProperty('entry');
      expect(response.body.entry.content).toBe(normalContent);
    });
  });
});
