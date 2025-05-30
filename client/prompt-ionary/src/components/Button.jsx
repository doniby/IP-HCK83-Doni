import React from 'react';

const Button = ({ children, className = '', ...props }) => (
  <button 
    className={`px-4 py-2 rounded font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
      className || 'bg-blue-100 text-blue-900 hover:bg-blue-200'
    }`} 
    {...props}
  >
    {children}
  </button>
);

export default Button;
