import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ObservationList from './pages/ObservationList';
import ObservationForm from './pages/ObservationForm';
import Reports from './pages/Reports';
import Targets from './pages/Targets';
import Users from './pages/Users';
import BasicInfo from './pages/BasicInfo';
import Settings from './pages/Settings';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router basename="/smart_reserch/">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="observations" element={<ObservationList />} />
            <Route path="observations/new" element={<ObservationForm />} />
            <Route path="observations/edit/:id" element={<ObservationForm />} />
            <Route path="observations/fill/:id" element={<ObservationForm mode="fill" />} />
            <Route path="reports" element={<Reports />} />
            <Route path="targets" element={<Targets />} />
            <Route path="users" element={<Users />} />
            <Route path="basic-info" element={<BasicInfo />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
