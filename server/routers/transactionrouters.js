const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/TransactionController');
const authenticate = require('../middlewares/authenticate');

router.use(authenticate);
router.post('/', TransactionController.createTransaction);
// Webhook does not require authentication
router.post('/notification', TransactionController.midtransNotification);

module.exports = router;
