import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchEntries, 
  createEntry, 
  updateEntry, 
  deleteEntry, 
  setFilters, 
  clearError 
} from '../store/entrySlice';
import { fetchCategories } from '../store/categorySlice';
import Card from '../components/Card';
import Button from '../components/Button';
import EntryForm from '../components/EntryForm';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const EntryPage = () => {
  const dispatch = useDispatch();
  const { 
    entries, 
    loading, 
    error, 
    filters 
  } = useSelector((state) => state.entries);
  const { categories } = useSelector((state) => state.categories);
  const { user } = useSelector((state) => state.user);
  
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  useEffect(() => {
    dispatch(fetchEntries(filters));
    dispatch(fetchCategories());
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(fetchEntries(filters));
  };

  const handleDismissError = () => {
    dispatch(clearError());
  };

  const handleCreate = (formData) => {
    const updatedFormData = { ...formData, type: 'indonesia_text' };
    dispatch(createEntry(updatedFormData))
      .unwrap()
      .then(() => {
        setShowForm(false);
      })
      .catch(() => {
        // Error is handled by Redux
      });
  };

  const handleUpdate = (formData) => {
    dispatch(updateEntry({ id: editingEntry.id, data: formData }))
      .unwrap()
      .then(() => {
        setEditingEntry(null);
      })
      .catch(() => {
        // Error is handled by Redux
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    dispatch(deleteEntry(id))
      .unwrap()
      .catch(() => {
        // Error is handled by Redux
      });
  };

  // Check if user has reached entry limit
  const canCreateEntry = user?.tier === 'premium' || entries.length < 20;

  if (loading && entries.length === 0) {
    return <Loading fullScreen text="Loading entries..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dictionary Entries</h1>
          <p className="text-gray-600">
            Manage your Indonesian-English translations
            {user?.tier === 'free' && (
              <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {entries.length}/20 entries used
              </span>
            )}
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          disabled={!canCreateEntry || loading}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            !canCreateEntry 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {showForm ? 'Cancel' : 'Add New Entry'}
        </Button>
      </div>

      {!canCreateEntry && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            You've reached the maximum number of entries for free users (20). 
            <a href="/transactions" className="text-blue-600 hover:underline ml-1">
              Upgrade to Premium
            </a> for unlimited entries.
          </p>
        </div>
      )}

      <ErrorMessage 
        error={error} 
        onRetry={handleRetry}
        onDismiss={handleDismissError}
        className="mb-6"
      />

      {/* Filters */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Entries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleFilterChange({ ...filters, categoryId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      {(showForm || editingEntry) && (
        <div className="mb-8">
          <EntryForm 
            onSubmit={editingEntry ? handleUpdate : handleCreate}
            initialData={editingEntry}
            onCancel={() => {
              setShowForm(false);
              setEditingEntry(null);
            }}
            loading={loading}
            hideTypeSelection={true} // Pass a prop to hide type selection
          />
        </div>
      )}

      {/* Entries Grid */}
      {entries.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📖</div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No entries yet</h3>
          <p className="text-gray-500 mb-6">Start building your personal Indonesian-English dictionary!</p>
          {canCreateEntry && (
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
            >
              Create Your First Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Indonesian</h4>
                  <p className="text-gray-800 leading-relaxed">{entry.content}</p>
                </div>
                {entry.Translation && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Translation</h4>
                    <p className="text-gray-700 leading-relaxed">{entry.Translation.translatedText}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button 
                  onClick={() => {
                    setEditingEntry(entry);
                    setShowForm(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium"
                >
                  Edit
                </Button>
                <button 
                  onClick={() => handleDelete(entry.id)}
                  disabled={loading}
                  className={`text-red-600 hover:text-red-800 text-sm font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {loading && entries.length > 0 && (
        <div className="text-center mt-8">
          <Loading text="Updating entries..." />
        </div>
      )}
    </div>
  );
};

export default EntryPage;
