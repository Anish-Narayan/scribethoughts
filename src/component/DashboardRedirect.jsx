import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardRedirect() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    // Show a loading screen while we fetch the user's role
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading your dashboard...</p>
      </div>
    );
  }

  if (!userProfile) {
    // This can happen briefly or if the profile doc is missing.
    // ProtectedRoute should handle the main case of no currentUser.
    return <Navigate to="/login" />;
  }

  if (userProfile.role === 'therapist') {
    return <Navigate to="/dashboard/therapist" />;
  }
  
  // Default to user dashboard
  return <Navigate to="/dashboard/user" />;
}