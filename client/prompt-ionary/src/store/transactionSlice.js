import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionService } from '../services/apiService';

// Async thunks for API calls
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await transactionService.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch transactions');
    }
  }
);

export const createTransaction = createAsyncThunk(
  'transactions/createTransaction',
  async (_, { rejectWithValue }) => {
    try {
      const response = await transactionService.create();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create transaction');
    }
  }
);

// Add completeTransaction action
export const completeTransaction = createAsyncThunk(
  'transactions/completeTransaction',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await transactionService.complete(transactionId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to complete transaction');
    }
  }
);

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    transactions: [],
    loading: false,
    error: null,
    paymentUrl: null,
    actionLoading: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPaymentUrl: (state) => {
      state.paymentUrl = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
        state.error = null;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create transaction
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.unshift(action.payload.transaction);
        state.paymentUrl = action.payload.redirect_url;
        state.error = null;
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Complete transaction
      .addCase(completeTransaction.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(completeTransaction.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.transactions.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(completeTransaction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearPaymentUrl } = transactionSlice.actions;
export default transactionSlice.reducer;

// Update transactionService to include complete method