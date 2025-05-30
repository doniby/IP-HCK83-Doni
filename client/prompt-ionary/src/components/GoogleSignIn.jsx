import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../store/userSlice';
import { authService } from '../services/apiService';

const GoogleSignIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { data } = await authService.googleLogin(credentialResponse.credential);
      
      // Create user object with proper structure
      const user = {
        email: data.user.email,
        username: data.user.username,
        tier: data.user.tier || 'free',
        id: data.user.id,
      };
      
      dispatch(setUser({
        user,
        token: data.user.access_token
      }));
      
      navigate('/entries');
    } catch (err) {
      console.error('Google login failed:', err);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => console.error('Google Login Failed')}
      theme="outline"
      size="large"
      text="continue_with"
      shape="rectangular"
    />
  );
};

export default GoogleSignIn;
