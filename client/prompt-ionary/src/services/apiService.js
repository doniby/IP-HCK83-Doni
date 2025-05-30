import api from '../api';

// Enhance handleApiCall to retry on 429 status
const handleApiCall = async (apiCall) => {
  let retries = 3;
  while (retries > 0) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && retries > 0) {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
      } else {
        const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
        throw new Error(message);
      }
    }
  }
};

// Authentication services
export const authService = {
  register: (userData) => handleApiCall(() => api.post('/user/register', userData)),
  login: (credentials) => handleApiCall(() => api.post('/user/login', credentials)),
  googleLogin: (credential) => handleApiCall(() => api.post('/user/google-login', { credential })),
  updateProfile: (profileData) => handleApiCall(() => api.put('/user/profile', profileData)),
  // Logout helper
  logout: () => {
    localStorage.removeItem('access_token');
    return Promise.resolve();
  }
};

// Entry services
export const entryService = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    return handleApiCall(() => api.get(`/entries?${params.toString()}`));
  },
  getById: (id) => handleApiCall(() => api.get(`/entries/${id}`)),
  create: (entryData) => handleApiCall(() => api.post('/entries', entryData)),
  update: (id, entryData) => handleApiCall(() => api.put(`/entries/${id}`, entryData)),
  delete: (id) => handleApiCall(() => api.delete(`/entries/${id}`)),
};

// Category services
export const categoryService = {
  getAll: () => handleApiCall(() => api.get('/categories')),
  getById: (id) => handleApiCall(() => api.get(`/categories/${id}`)),
  create: (categoryData) => handleApiCall(() => api.post('/categories', categoryData)),
  update: (id, categoryData) => handleApiCall(() => api.put(`/categories/${id}`, categoryData)),
  delete: (id) => handleApiCall(() => api.delete(`/categories/${id}`)),
};

// Transaction services
export const transactionService = {
  getAll: () => handleApiCall(() => api.get('/transactions')),
  create: () => handleApiCall(() => api.post('/transactions')),
  complete: (transactionId) => handleApiCall(() => api.patch(`/transactions/${transactionId}/complete`)),
  // Webhook endpoint is handled by backend directly
};

// Combined service object for easy importing
const apiService = {
  auth: authService,
  entries: entryService,
  categories: categoryService,
  transactions: transactionService,
};

export default apiService;
