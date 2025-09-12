import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 1. Import your AuthProvider and the useAuth hook
import { AuthProvider, useAuth } from './context/AuthContext'; // Adjust path if needed

// 2. Import all your page components
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard'
import TherapistDashboard from './pages/TherapistDashboard';
import DashboardRedirect from './component/DashboardRedirect';

/**
 * A wrapper component that protects routes requiring authentication.
 * If a user is not logged in, it redirects them to the /login page.
 * Otherwise, it renders the child component (the protected page).
 */
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  // If there's no authenticated user, redirect to the login page
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // If the user is authenticated, render the page they were trying to access
  return children;
}

/**
 * The main component that defines the application's structure and routing.
 */
export default function App() {
  return (
    // The AuthProvider wraps the entire application, making authentication
    // state (currentUser, userProfile, etc.) available to all components.
    <AuthProvider>
      <Router>
        <Routes>
          {/* == PUBLIC ROUTE == */}
          {/* The login page is accessible to everyone. */}
          <Route path="/login" element={<Login />} />
          
          {/* == PROTECTED ROUTES == */}
          
          {/* The GENERIC /dashboard route is the main entry point for logged-in users.
              It's protected, and its only job is to render the DashboardRedirect
              component, which will then handle the role-based navigation. */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } 
          />
          
          {/* The SPECIFIC route for regular users. */}
          <Route 
            path="/dashboard/user" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* The SPECIFIC route for therapists. */}
          <Route 
            path="/dashboard/therapist" 
            element={
              <ProtectedRoute>
                <TherapistDashboard />
              </ProtectedRoute>
            } 
          />

          {/* == REDIRECTS == */}
          {/* Redirect the root path ("/") to the main dashboard handler.
              The ProtectedRoute and DashboardRedirect will then figure out
              where the user should ultimately land. */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}