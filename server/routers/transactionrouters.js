const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/TransactionController');
const authenticate = require('../middlewares/authenticate');

// Webhook does not require authentication - put this BEFORE the middleware
router.post('/notification', TransactionController.midtransNotification);

// Apply authentication middleware for other routes
router.use(authenticate);
router.get('/', TransactionController.getTransactions); // Add this method if needed
router.post('/', TransactionController.createTransaction);
router.post('/:id/complete', TransactionController.completeTransaction);

module.exports = router;
