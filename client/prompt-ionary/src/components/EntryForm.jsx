import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../store/categorySlice";
import Button from "./Button";
import Card from "./Card";

const EntryForm = ({ onSubmit, initialData = null, isLoading = false }) => {
  const dispatch = useDispatch();
  const { categories } = useSelector(state => state.categories);
  const [form, setForm] = useState({
    content: initialData?.content || "",
    type: initialData?.type || "prompt",
    categoryNames: initialData?.Categories?.map((c) => c.name).join(", ") || "",
  });
  const [error, setError] = useState("");  const [suggestions, setSuggestions] = useState([]);
  const maxLength = 1000; // Set max length for content
  
  useEffect(() => {
    // Fetch existing categories using Redux
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleCategoryInput = (e) => {
    const value = e.target.value;
    setForm({ ...form, categoryNames: value });
    
    // Show suggestions based on last typed category
    const lastCategory = value.split(",").pop().trim().toLowerCase();
    if (lastCategory) {
      const filtered = categories
        .filter(cat => cat.name.toLowerCase().includes(lastCategory))
        .map(cat => cat.name);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  // Ensure category suggestion click updates the form correctly
  const handleSuggestionClick = (categoryName) => {
    const currentCategories = form.categoryNames
      .split(",")
      .map(c => c.trim())
      .filter(Boolean);
    currentCategories.pop(); // Remove the partial category
    currentCategories.push(categoryName);
    setForm({ 
      ...form, 
      categoryNames: [...currentCategories, ""].join(", ")
    });
    setSuggestions([]);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (form.content.length > maxLength) {
      setError(`Content must be less than ${maxLength} characters`);
      return;
    }

    try {
      const categoryNames = form.categoryNames
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);

      await onSubmit({ ...form, categoryNames });

      if (!initialData) {
        // Clear form if it's a new entry
        setForm({ content: "", type: "prompt", categoryNames: "" });
        setSuggestions([]);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card className="mb-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            disabled={isLoading}
            className="w-full border rounded px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500">
            <option value="prompt">Prompt</option>
            <option value="response">Response</option>
            <option value="note">Note</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            disabled={isLoading}
            className="w-full border rounded px-3 py-2 min-h-[100px] disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Enter your content here..."
            required
          />
          <div className="text-sm text-gray-500 mt-1">
            {form.content.length}/{maxLength} characters
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categories
          </label>          <input
            type="text"
            value={form.categoryNames}
            onChange={handleCategoryInput}
            disabled={isLoading}
            className="w-full border rounded px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Enter categories separated by commas"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg">
              {suggestions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleSuggestionClick(category)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              {initialData ? "Updating..." : "Creating..."}
            </>
          ) : (
            initialData ? "Update Entry" : "Create Entry"
          )}
        </Button>
      </form>
    </Card>
  );
};

export default EntryForm;
