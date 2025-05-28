const { Transaction, User } = require("../models");
const midtransClient = require("midtrans-client");

class TransactionController {
  // Create a new transaction and get payment URL
  static async createTransaction(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);
      if (!user) throw { status: 404, message: "User not found" };
      // Create a new transaction record
      const orderId = `ORDER-${userId}-${Date.now()}`;
      const transaction = await Transaction.create({
        orderId,
        status: "pending",
        UserId: userId,
      });
      // Midtrans Snap
      const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.MIDTRANS_CLIENT_KEY,
      });
      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: 50000, // Example price for premium
        },
        customer_details: {
          email: user.email,
        },
      };
      const midtransRes = await snap.createTransaction(parameter);
      transaction.redirectUrl = midtransRes.redirect_url;
      await transaction.save();
      res.status(201).json({
        transaction,
        redirectUrl: midtransRes.redirect_url,
      });
    } catch (err) {
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
      // Find transaction
      const transaction = await Transaction.findOne({ where: { orderId } });
      if (!transaction) throw { status: 404, message: "Transaction not found" };
      // Update transaction status
      transaction.status = transactionStatus;
      await transaction.save();
      // If payment is successful, update user tier
      if (
        transactionStatus === "settlement" ||
        (transactionStatus === "capture" && fraudStatus === "accept")
      ) {
        const user = await User.findByPk(transaction.UserId);
        if (user) {
          user.tier = "premium";
          await user.save();
        }
      }
      res.status(200).json({ message: "Notification processed" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TransactionController;
