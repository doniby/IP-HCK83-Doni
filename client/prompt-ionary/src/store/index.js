import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import entryReducer from './entrySlice';
import categoryReducer from './categorySlice';
import transactionReducer from './transactionSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    entries: entryReducer,
    categories: categoryReducer,
    transactions: transactionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;
