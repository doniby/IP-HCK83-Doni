import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/apiService';

// Async thunk for updating user profile
export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData);
      return response.data.user; // Assuming the API returns updated user data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

// Try to get user data from localStorage on initial load
const getInitialState = () => {
  try {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user_data');
    
    if (token && user) {
      return {
        user: JSON.parse(user),
        token,
        isAuthenticated: true,
        loading: false,
      };
    }
  } catch (error) {
    console.error('Error parsing stored user data:', error);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
  }
  
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
  };
};

const userSlice = createSlice({
  name: 'user',
  initialState: getInitialState(),
  reducers: {
    setUser(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.loading = false;
      
      // Persist to localStorage
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
    },
    updateUser(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user_data', JSON.stringify(state.user));
      }
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      
      // Clear localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user_data', JSON.stringify(state.user));
      })
      .addCase(updateProfile.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setUser, updateUser, setLoading, logout } = userSlice.actions;
export default userSlice.reducer;
