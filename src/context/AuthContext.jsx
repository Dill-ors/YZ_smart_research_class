import React, { createContext, useContext, useState, useEffect } from 'react';
import DataService from '../services/dataService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Check local storage for existing session
      const storedUserStr = localStorage.getItem('currentUser');
      if (storedUserStr && storedUserStr !== 'undefined' && storedUserStr !== 'null') {
        try {
          const storedUser = JSON.parse(storedUserStr);
          if (storedUser && storedUser.username) {
            // Fetch latest user data from backend to ensure we have 'id' and other new fields
            const users = await DataService.getAllUsers();
            const latestUser = users.find(u => u.username === storedUser.username);
            if (latestUser) {
              setUser(latestUser);
              localStorage.setItem('currentUser', JSON.stringify(latestUser));
            } else {
              setUser(storedUser);
            }
          }
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
          localStorage.removeItem('currentUser');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (userData) => {
    // In a real app, you'd validate credentials here.
    // For now, we trust the input and simulate a login.
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
