import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';

const CategoryForm = ({ category, onSave, onCancel, isLoading = false }) => {
  const [form, setForm] = useState({ name: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setForm({ name: category.name || '' });
    } else {
      setForm({ name: '' });
    }
    setError('');
  }, [category]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!form.name.trim()) {
      setError('Category name is required');
      return;
    }

    if (form.name.trim().length < 2) {
      setError('Category name must be at least 2 characters long');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const categoryData = {
        ...form,
        name: form.name.trim(),
        ...(category?.id && { id: category.id })
      };
      
      await onSave(categoryData);
      
      // Reset form after successful save (only for new categories)
      if (!category?.id) {
        setForm({ name: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: '' });
    setError('');
    onCancel();
  };

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {category?.id ? 'Edit Category' : 'Add New Category'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
            Category Name
          </label>          <input
            id="categoryName"
            name="name"
            type="text"
            placeholder="Enter category name (e.g., Writing, Coding, Marketing)"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500"
            disabled={isSubmitting || isLoading}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Categories help organize your prompts for easy discovery
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">          <Button
            type="submit"
            disabled={isSubmitting || isLoading || !form.name.trim()}
            className={`px-6 py-2 text-white font-medium rounded-lg transition-colors ${
              isSubmitting || isLoading || !form.name.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting || isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                {category?.id ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              category?.id ? 'Update Category' : 'Create Category'
            )}
          </Button>

          {category?.id && (
            <Button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting || isLoading}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      {!category?.id && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Category Tips:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Use descriptive names like "Marketing Copy", "Code Snippets", "Creative Writing"</li>
            <li>• Categories make it easier to find and organize your prompts</li>
            <li>• You can edit or delete categories later (except the default "general" category)</li>
          </ul>
        </div>
      )}
    </Card>
  );
};

export default CategoryForm;