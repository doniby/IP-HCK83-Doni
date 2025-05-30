import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, createCategory, updateCategory, deleteCategory, clearError } from '../store/categorySlice';
import CategoryForm from '../components/CategoryForm';
import Button from '../components/Button';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const CategoryPage = () => {
  const dispatch = useDispatch();
  const { categories, loading, error, actionLoading } = useSelector(state => state.categories);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCreateOrUpdate = async (category) => {
    try {
      if (category.id) {
        await dispatch(updateCategory({ id: category.id, categoryData: category })).unwrap();
      } else {
        await dispatch(createCategory(category)).unwrap();
      }
      setSelectedCategory(null);
    } catch (err) {
      // Error is already handled by Redux
      console.error('Failed to save category:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await dispatch(deleteCategory(id)).unwrap();
    } catch (err) {
      // Error is already handled by Redux
      console.error('Failed to delete category:', err);
    }
  };

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(fetchCategories());
  };

  const handleDismissError = () => {
    dispatch(clearError());
  };

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Categories</h1>
        <p className="text-gray-600">Organize your prompts with custom categories for better discovery and management.</p>
      </div>

      {loading && (
        <Loading text="Loading categories..." />
      )}
      
      <ErrorMessage 
        error={error} 
        onRetry={handleRetry}
        onDismiss={handleDismissError}
        className="mb-6"
      />

      <CategoryForm
        category={selectedCategory}
        onSave={handleCreateOrUpdate}
        onCancel={() => setSelectedCategory(null)}
        isLoading={actionLoading}
      />

      {!loading && categories.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Your Categories</h2>
            <p className="text-sm text-gray-600">Click edit to modify a category or delete to remove it.</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {categories.map((category) => (
              <div key={category.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-700 font-semibold text-sm">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500">Category ID: {category.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setSelectedCategory(category)}
                    disabled={actionLoading}
                    className={`px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDelete(category.id)}
                    disabled={category.name === 'general' || actionLoading}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      category.name === 'general' 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : actionLoading 
                          ? 'bg-red-100 text-red-400 cursor-not-allowed' 
                          : 'bg-red-100 hover:bg-red-200 text-red-700'
                    }`}
                    title={category.name === 'general' ? 'Cannot delete default category' : ''}
                  >
                    {actionLoading ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && categories.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <span className="text-gray-500 text-2xl">📁</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
          <p className="text-gray-600 mb-4">Create your first category to start organizing your prompts.</p>
          <div className="text-sm text-gray-500">
            <p>💡 Try creating categories like:</p>
            <p className="mt-1 font-medium">"Writing", "Coding", "Marketing", "Creative"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;