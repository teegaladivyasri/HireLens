import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial authentication state from stored session
    const storedUser = authService.getStoredUser();
    const token = authService.getToken();

    if (storedUser && token) {
      setUser(storedUser);
      // Verify token in background
      authService.getCurrentUser()
        .then((fetchedUser) => {
          setUser(fetchedUser);
          localStorage.setItem('hirelens_user', JSON.stringify(fetchedUser));
        })
        .catch(() => {
          authService.logout();
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    const userPayload = {
      id: data.user_id,
      name: data.name,
      email: data.email,
      role: data.role,
    };
    setUser(userPayload);
    return userPayload;
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        isJobSeeker: user?.role === 'JOB_SEEKER',
        isRecruiter: user?.role === 'RECRUITER',
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
