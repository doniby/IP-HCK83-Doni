import React from 'react';

const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white shadow rounded p-4 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
