import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { entryService } from '../services/apiService';

// Async thunks for API calls
export const fetchEntries = createAsyncThunk(
  'entries/fetchEntries',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await entryService.getAll(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch entries');
    }
  }
);

export const createEntry = createAsyncThunk(
  'entries/createEntry',
  async (entryData, { rejectWithValue }) => {
    try {
      const response = await entryService.create(entryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create entry');
    }
  }
);

export const updateEntry = createAsyncThunk(
  'entries/updateEntry',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await entryService.update(id, data);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update entry');
    }
  }
);

export const deleteEntry = createAsyncThunk(
  'entries/deleteEntry',
  async (id, { rejectWithValue }) => {
    try {
      await entryService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete entry');
    }
  }
);

const entrySlice = createSlice({
  name: 'entries',
  initialState: {
    entries: [],
    loading: false,
    error: null,
    filters: {
      type: '',
      categoryId: ''
    },
    pagination: {
      page: 1,
      hasMore: false
    }
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset page when filters change
    },
    clearError: (state) => {
      state.error = null;
    },
    resetEntries: (state) => {
      state.entries = [];
      state.pagination.page = 1;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch entries
      .addCase(fetchEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
        state.error = null;
      })
      .addCase(fetchEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create entry
      .addCase(createEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEntry.fulfilled, (state, action) => {
        state.loading = false;
        // Add new entry to the beginning of the list
        state.entries.unshift(action.payload.entry);
        state.error = null;
      })
      .addCase(createEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update entry
      .addCase(updateEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEntry.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.entries.findIndex(entry => entry.id === action.payload.id);
        if (index !== -1) {
          state.entries[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete entry
      .addCase(deleteEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = state.entries.filter(entry => entry.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setFilters, clearError, resetEntries } = entrySlice.actions;
export default entrySlice.reducer;
