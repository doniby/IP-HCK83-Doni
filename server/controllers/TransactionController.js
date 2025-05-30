const { Transaction, User } = require("../models");
const midtransClient = require("midtrans-client");

class TransactionController {
  // Add this method for GET /transactions
  static async getTransactions(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const transactions = await Transaction.findAll({
        where: { UserId: userId },
        order: [['createdAt', 'DESC']]
      });

      if (!transactions.length) {
        return res.status(404).json({ message: "No transactions found" });
      }

      res.status(200).json(transactions);
    } catch (err) {
      next(err);
    }
  }
  // Create a new transaction and get payment URL
  static async createTransaction(req, res, next) {
    try {
      // Ensure req.user exists and return 404 if not found
      if (!req.user?.id) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user exists in the database
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Restrict multiple transactions per user
      const existingTransaction = await Transaction.findOne({ where: { UserId: req.user.id, status: 'pending' } });
      if (existingTransaction) {
        return res.status(400).json({ message: "You already have a pending transaction." });
      }

      const orderId = `ORDER-${user.id}-${Date.now()}`;
      const amount = 50000; // Premium tier price
      const transaction = await Transaction.create({
        orderId,
        status: "pending",
        amount,
        UserId: req.user.id,
      });

      const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.MIDTRANS_CLIENT_KEY,
      });

      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        customer_details: {
          email: user.email,
        },
      };

      try {
        const midtransRes = await snap.createTransaction(parameter);
        transaction.redirectUrl = midtransRes.redirect_url;
        await transaction.save();

        res.status(201).json({
          transaction,
          redirect_url: midtransRes.redirect_url,
        });
      } catch (midtransError) {
        console.error("Midtrans error:", midtransError);

        const mockRedirectUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${orderId}`;
        transaction.redirectUrl = mockRedirectUrl;
        await transaction.save();

        res.status(201).json({
          transaction,
          redirect_url: mockRedirectUrl,
        });
      }
    } catch (err) {
      console.error("Transaction creation error:", err);
      next(err);
    }
  }
  // Midtrans notification handler (webhook)
  static async midtransNotification(req, res, next) {
    try {
      const notif = req.body;
      const orderId = notif.order_id;
      const transactionStatus = notif.transaction_status;
      const fraudStatus = notif.fraud_status;

      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      const transaction = await Transaction.findOne({ where: { orderId } });
      // Check if transaction exists
      if (!transaction) {
        return res.status(400).json({ message: "Transaction not found" });
      }

      // Check if user associated with the transaction exists
      const user = await User.findByPk(transaction.UserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let finalStatus = transactionStatus;
      if (transactionStatus === "capture" && fraudStatus === "challenge") {
        finalStatus = "challenge";
      }

      transaction.status = finalStatus;
      await transaction.save();

      if (
        finalStatus === "settlement" ||
        (finalStatus === "capture" && fraudStatus === "accept")
      ) {
        user.tier = "premium";
        await user.save();
      }

      res.status(200).json({ message: "Notification processed" });
    } catch (err) {
      next(err);
    }
  }

  // Add completeTransaction method
  static async completeTransaction(req, res, next) {
    try {
      const { transactionId } = req.params;
      const transaction = await Transaction.findByPk(transactionId);

      if (!transaction || transaction.status !== 'pending') {
        return res.status(404).json({ message: "Transaction not found or already completed." });
      }

      const user = await User.findByPk(transaction.UserId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      transaction.status = 'settlement';
      await transaction.save();

      return res.status(200).json({ message: "Transaction completed successfully.", transaction });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TransactionController;
