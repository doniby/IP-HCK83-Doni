const request = require('supertest');
const app = require('../app');
const { User, Category } = require('../models');
const bcrypt = require('bcryptjs');

require('./setup');

describe('User Authentication Endpoints', () => {
  describe('POST /user/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/user/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username', userData.username);
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password');

      // Verify user was created in database
      const user = await User.findOne({ where: { email: userData.email } });
      expect(user).toBeTruthy();
      expect(user.username).toBe(userData.username);

      // Verify general category was created
      const generalCategory = await Category.findOne({ 
        where: { name: 'general', UserId: user.id } 
      });
      expect(generalCategory).toBeTruthy();
    });

    it('should return 400 for missing username', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/user/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing email', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/user/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/user/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/user/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Create first user
      await request(app)
        .post('/user/register')
        .send(userData)
        .expect(201);

      // Try to create user with same email
      const duplicateUserData = {
        username: 'testuser2',
        email: 'test@example.com',
        password: 'password456'
      };

      const response = await request(app)
        .post('/user/register')
        .send(duplicateUserData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Create first user
      await request(app)
        .post('/user/register')
        .send(userData)
        .expect(201);

      // Try to create user with same username
      const duplicateUserData = {
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password456'
      };

      const response = await request(app)
        .post('/user/register')
        .send(duplicateUserData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /user/login', () => {
    let userData;

    beforeEach(async () => {
      userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Create user for login tests
      await request(app)
        .post('/user/register')
        .send(userData)
        .expect(201);
    });

    it('should login user successfully with correct credentials', async () => {
      const loginData = {
        email: userData.email,
        password: userData.password
      };

      const response = await request(app)
        .post('/user/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User logged in successfully');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('access_token');
      expect(typeof response.body.user.access_token).toBe('string');
    });

    it('should return 400 for invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: userData.password
      };

      const response = await request(app)
        .post('/user/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });

    it('should return 400 for invalid password', async () => {
      const loginData = {
        email: userData.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/user/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });

    it('should return 400 for missing email', async () => {
      const loginData = {
        password: userData.password
      };

      const response = await request(app)
        .post('/user/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing password', async () => {
      const loginData = {
        email: userData.email
      };

      const response = await request(app)
        .post('/user/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /user/google-login', () => {
    it('should return 400 for missing credential', async () => {
      const response = await request(app)
        .post('/user/google-login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid Google credential', async () => {
      const invalidCredential = {
        credential: 'invalid.jwt.token'
      };

      const response = await request(app)
        .post('/user/google-login')
        .send(invalidCredential)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    // Note: Testing with actual Google tokens would require mock implementation
    // This would need to be expanded with proper Google OAuth mocking
  });
});
