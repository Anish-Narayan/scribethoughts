import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import TherapistDashboard from "./pages/TherapistDashboard";
import NotFound from "./pages/NotFound";
import React from "react";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/therapist" element={<TherapistDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
