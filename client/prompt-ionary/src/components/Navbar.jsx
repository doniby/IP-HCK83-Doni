import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../store/userSlice';
import Button from './Button';

const Navbar = () => {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      localStorage.removeItem('access_token');
      await dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-900 hover:text-blue-700 transition-colors">
          Promptionary
        </Link>
        <div className="flex items-center">
          {user ? (
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4">
                <Link to="/entries" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  My Entries
                </Link>
                <Link to="/categories" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Categories
                </Link>
                <Link to="/transactions" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Premium
                </Link>
                <Link to="/profile" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Profile
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">
                    {user.username || user.email}
                  </div>
                  {user.tier && (
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${
                      user.tier === 'premium' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.tier.toUpperCase()}
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleLogout} 
                  disabled={isLoggingOut}
                  className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Login
              </Link>
              <Link to="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
