import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTransactions, createTransaction, clearError, completeTransaction } from "../store/transactionSlice";
import Button from "../components/Button";
import Card from "../components/Card";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const TransactionPage = () => {
  const dispatch = useDispatch();
  const { transactions, loading, actionLoading, error } = useSelector(state => state.transactions);
  const { user } = useSelector((state) => state.user);
  const handleCreateTransaction = async () => {
    try {
      const result = await dispatch(createTransaction()).unwrap();
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      }
    } catch (err) {
      console.error('Failed to create transaction:', err);
    }
  };

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(fetchTransactions());
  };

  const handleDismissError = () => {
    dispatch(clearError());
  };

  // Define handleCompleteTransaction function
  const handleCompleteTransaction = async (transactionId) => {
    try {
      await dispatch(completeTransaction(transactionId)).unwrap();
    } catch (err) {
      console.error('Failed to complete transaction:', err);
    }
  };

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "settlement":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "challenge":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Premium Subscription</h1>
          <p className="text-gray-600">Unlock unlimited entries and advanced features</p>
        </div>
        {user?.tier && (
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              user.tier === "premium"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}>
            {user.tier.toUpperCase()} USER
          </span>
        )}
      </div>

      <ErrorMessage 
        error={error} 
        onRetry={handleRetry}
        onDismiss={handleDismissError}
        className="mb-6"
      />

      {user?.tier !== "premium" && (
        <Card className="mb-8 p-8 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Upgrade to Premium</h2>
              <p className="text-gray-600 mb-6 text-lg">
                Get unlimited entries, AI-powered translations, and advanced features with our Premium plan.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span>
                    Unlimited diary entries
                  </li>
                  <li className="flex items-center">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span>
                    AI-powered translations
                  </li>
                </ul>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span>
                    Advanced categorization
                  </li>
                  <li className="flex items-center">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span>
                    Priority customer support
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-center ml-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  IDR 50,000
                </div>
                <div className="text-gray-500 text-sm mb-4">one-time payment</div>
                <Button 
                  onClick={handleCreateTransaction} 
                  disabled={actionLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Upgrade Now"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Transaction History</h2>
        
        {loading ? (
          <Loading text="Loading transactions..." />
        ) : transactions.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">💳</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-500">Your transaction history will appear here once you make a purchase.</p>
          </Card>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-blue-600 font-semibold text-sm">💳</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{transaction.orderId}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(transaction.amount)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-4 py-2 rounded-full text-xs font-semibold ${getStatusColor(
                        transaction.status
                      )}`}>
                      {transaction.status.toUpperCase()}
                    </span>
                    {transaction.status === "pending" && (
                      <Button
                        onClick={() => handleCompleteTransaction(transaction.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionPage;
