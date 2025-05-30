const request = require('supertest');
const app = require('../app');
const { User, Transaction } = require('../models');
const { createTestUser, generateToken } = require('./setup');

require('./setup');

describe('Transactions Endpoints', () => {
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

  describe('GET /transactions', () => {
    beforeEach(async () => {
      // Create some test transactions
      await Transaction.create({
        orderId: 'ORDER-123',
        amount: 50000,
        status: 'pending',
        redirectUrl: 'https://app.midtrans.com/snap/v2/vtweb/12345',
        UserId: user.id
      });

      await Transaction.create({
        orderId: 'ORDER-456',
        amount: 50000,
        status: 'settlement',
        redirectUrl: 'https://app.midtrans.com/snap/v2/vtweb/67890',
        UserId: user.id
      });
    });

    it('should get all transactions for authenticated user', async () => {
      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      const transaction = response.body[0];
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('status');
      expect(transaction).toHaveProperty('createdAt');
      expect(transaction).toHaveProperty('UserId', user.id);
    });

    it('should return 401 for missing authorization token', async () => {
      const response = await request(app)
        .get('/transactions')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for invalid authorization token', async () => {
      const response = await request(app)
        .get('/transactions')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should only return transactions belonging to authenticated user', async () => {
      // Create another user and their transaction
      const otherUserData = {
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123'
      };

      const otherUserResponse = await request(app)
        .post('/user/register')
        .send(otherUserData);

      const otherUser = otherUserResponse.body.user;

      await Transaction.create({
        orderId: 'ORDER-OTHER',
        amount: 50000,
        status: 'pending',
        redirectUrl: 'https://app.midtrans.com/snap/v2/vtweb/other',
        UserId: otherUser.id
      });

      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should only return transactions for the authenticated user
      expect(response.body.length).toBe(2);
      response.body.forEach(transaction => {
        expect(transaction.UserId).toBe(user.id);
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error by temporarily corrupting the user token to trigger error in getTransactions
      const invalidToken = generateToken({ id: 999999 }); // Non-existent user ID
      
      // This should still work but let's create a scenario that causes DB error
      // We'll mock Transaction.findAll to throw an error
      const originalFindAll = Transaction.findAll;
      Transaction.findAll = jest.fn().mockRejectedValue(new Error('Database connection error'));

      try {
        const response = await request(app)
          .get('/transactions')
          .set('Authorization', `Bearer ${token}`)
          .expect(500);

        expect(response.body).toHaveProperty('message');
      } finally {
        // Restore original method
        Transaction.findAll = originalFindAll;
      }
    });
  });

  describe('POST /transactions', () => {
    it('should create a new transaction successfully', async () => {
      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body).toHaveProperty('redirect_url');
      expect(typeof response.body.redirect_url).toBe('string');
      expect(response.body.redirect_url).toMatch(/https?:\/\//);

      // Verify transaction was created in database
      const transaction = await Transaction.findOne({
        where: { UserId: user.id },
        order: [['createdAt', 'DESC']]
      });
      expect(transaction).toBeTruthy();
      expect(transaction.status).toBe('pending');
      expect(transaction.amount).toBe(50000);
    });

    it('should return 401 for missing authorization token', async () => {
      const response = await request(app)
        .post('/transactions')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for invalid authorization token', async () => {
      const response = await request(app)
        .post('/transactions')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 when user not found', async () => {
      // Create token for non-existent user
      const nonExistentUserToken = generateToken({ id: 999999 });
      
      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${nonExistentUserToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should handle successful Midtrans API response', async () => {
      // Mock the midtrans-client to return successful response
      const midtransClient = require('midtrans-client');
      const originalSnap = midtransClient.Snap;
      
      // Create a mock that simulates successful Midtrans response
      const mockCreateTransaction = jest.fn().mockResolvedValue({
        redirect_url: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-success-token'
      });

      midtransClient.Snap = jest.fn().mockImplementation(() => ({
        createTransaction: mockCreateTransaction
      }));

      try {
        const response = await request(app)
          .post('/transactions')
          .set('Authorization', `Bearer ${token}`)
          .expect(201);

        expect(response.body).toHaveProperty('redirect_url');
        expect(response.body.redirect_url).toBe('https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-success-token');
        expect(response.body).toHaveProperty('transaction');
        expect(response.body.transaction).toHaveProperty('redirectUrl', 'https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-success-token');

        // Verify the transaction was saved with the redirect URL
        const transaction = await Transaction.findOne({
          where: { UserId: user.id },
          order: [['createdAt', 'DESC']]
        });
        expect(transaction.redirectUrl).toBe('https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-success-token');
      } finally {
        // Restore original Snap constructor
        midtransClient.Snap = originalSnap;
      }
    });

    it('should handle Midtrans API errors and use mock redirect URL', async () => {
      // Mock the midtrans-client to throw an error
      const midtransClient = require('midtrans-client');
      const originalSnap = midtransClient.Snap;
      
      const mockCreateTransaction = jest.fn().mockRejectedValue(new Error('Midtrans API error'));

      midtransClient.Snap = jest.fn().mockImplementation(() => ({
        createTransaction: mockCreateTransaction
      }));

      try {
        const response = await request(app)
          .post('/transactions')
          .set('Authorization', `Bearer ${token}`)
          .expect(201);

        expect(response.body).toHaveProperty('redirect_url');
        expect(response.body.redirect_url).toMatch(/https:\/\/app\.sandbox\.midtrans\.com\/snap\/v2\/vtweb\/ORDER-/);
        expect(response.body).toHaveProperty('transaction');

        // Verify the transaction was saved with the mock redirect URL
        const transaction = await Transaction.findOne({
          where: { UserId: user.id },
          order: [['createdAt', 'DESC']]
        });
        expect(transaction.redirectUrl).toMatch(/https:\/\/app\.sandbox\.midtrans\.com\/snap\/v2\/vtweb\/ORDER-/);
      } finally {
        // Restore original Snap constructor
        midtransClient.Snap = originalSnap;
      }
    });
  });

  describe('POST /transactions/notification', () => {
    let transaction;

    beforeEach(async () => {
      // Create a pending transaction
      transaction = await Transaction.create({
        orderId: 'ORDER-NOTIFICATION-TEST',
        amount: 50000,
        status: 'pending',
        redirectUrl: 'https://app.midtrans.com/snap/v2/vtweb/test',
        UserId: user.id
      });
    });

    it('should process settlement notification successfully', async () => {
      const notificationData = {
        order_id: transaction.orderId,
        transaction_status: 'settlement',
        fraud_status: 'accept'
      };

      const response = await request(app)
        .post('/transactions/notification')
        .send(notificationData)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify transaction status was updated
      const updatedTransaction = await Transaction.findByPk(transaction.id);
      expect(updatedTransaction.status).toBe('settlement');

      // Verify user tier was upgraded to premium
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.tier).toBe('premium');
    });

    it('should process failed notification successfully', async () => {
      const notificationData = {
        order_id: transaction.orderId,
        transaction_status: 'failure',
        fraud_status: 'deny'
      };

      const response = await request(app)
        .post('/transactions/notification')
        .send(notificationData)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify transaction status was updated
      const updatedTransaction = await Transaction.findByPk(transaction.id);
      expect(updatedTransaction.status).toBe('failure');

      // Verify user tier was not upgraded
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.tier).toBe('free');
    });

    it('should process pending notification successfully', async () => {
      const notificationData = {
        order_id: transaction.orderId,
        transaction_status: 'pending',
        fraud_status: 'accept'
      };

      const response = await request(app)
        .post('/transactions/notification')
        .send(notificationData)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify transaction status remains pending
      const updatedTransaction = await Transaction.findByPk(transaction.id);
      expect(updatedTransaction.status).toBe('pending');

      // Verify user tier was not upgraded
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.tier).toBe('free');
    });

    it('should handle fraud notification correctly', async () => {
      const notificationData = {
        order_id: transaction.orderId,
        transaction_status: 'capture',
        fraud_status: 'challenge'
      };

      const response = await request(app)
        .post('/transactions/notification')
        .send(notificationData)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify transaction status was updated
      const updatedTransaction = await Transaction.findByPk(transaction.id);
      expect(updatedTransaction.status).toBe('challenge');

      // Verify user tier was not upgraded for fraud challenge
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.tier).toBe('free');
    });

    it('should return 400 for missing order_id', async () => {
      const notificationData = {
        transaction_status: 'settlement',
        fraud_status: 'accept'
      };

      const response = await request(app)
        .post('/transactions/notification')
        .send(notificationData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for non-existent transaction', async () => {
      const notificationData = {
        order_id: 'NON-EXISTENT-ORDER',
        transaction_status: 'settlement',
        fraud_status: 'accept'
      };

      const response = await request(app)
        .post('/transactions/notification')
        .send(notificationData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle capture status with accept fraud status as success', async () => {
      const notificationData = {
        order_id: transaction.orderId,
        transaction_status: 'capture',
        fraud_status: 'accept'
      };

      const response = await request(app)
        .post('/transactions/notification')
        .send(notificationData)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify transaction status was updated
      const updatedTransaction = await Transaction.findByPk(transaction.id);
      expect(updatedTransaction.status).toBe('capture');

      // Verify user tier was upgraded for successful capture
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.tier).toBe('premium');
    });

    it('should handle notification when user is not found for tier upgrade', async () => {
      // Create transaction with non-existent user ID
      const orphanTransaction = await Transaction.create({
        orderId: 'ORDER-ORPHAN-TEST',
        amount: 50000,
        status: 'pending',
        redirectUrl: 'https://app.midtrans.com/snap/v2/vtweb/orphan',
        UserId: 999999 // Non-existent user
      });

      const notificationData = {
        order_id: orphanTransaction.orderId,
        transaction_status: 'settlement',
        fraud_status: 'accept'
      };

      const response = await request(app)
        .post('/transactions/notification')
        .send(notificationData)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify transaction status was still updated even though user doesn't exist
      const updatedTransaction = await Transaction.findByPk(orphanTransaction.id);
      expect(updatedTransaction.status).toBe('settlement');
    });

    it('should handle database errors during notification processing', async () => {
      // Mock Transaction.findOne to throw an error
      const originalFindOne = Transaction.findOne;
      Transaction.findOne = jest.fn().mockRejectedValue(new Error('Database error during notification'));

      try {
        const notificationData = {
          order_id: transaction.orderId,
          transaction_status: 'settlement',
          fraud_status: 'accept'
        };

        const response = await request(app)
          .post('/transactions/notification')
          .send(notificationData)
          .expect(500);

        expect(response.body).toHaveProperty('message');
      } finally {
        // Restore original method
        Transaction.findOne = originalFindOne;
      }
    });
  });

  describe('POST /transactions/:id/complete', () => {
    let transaction;

    beforeEach(async () => {
      transaction = await Transaction.create({
        orderId: 'ORDER-789',
        amount: 50000,
        status: 'pending',
        UserId: user.id
      });
    });

    it('should complete a transaction successfully', async () => {
      const response = await request(app)
        .post(`/transactions/${transaction.id}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Transaction completed successfully.');
      expect(response.body.transaction.status).toBe('settlement');
    });

    it('should return 404 if transaction is not found', async () => {
      const response = await request(app)
        .post('/transactions/999/complete')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Transaction not found or already completed.');
    });
  });
});
