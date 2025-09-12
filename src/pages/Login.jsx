import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, BrainCircuit, AlertCircle, Users } from "lucide-react"; // NEW: Added Users icon
import { useAuth } from "../context/AuthContext"; // Make sure path is correct
import { auth, db } from "../../firebase"; // Make sure path is correct
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"; // NEW: Added imports for querying

export default function Login() {
  const [activeTab, setActiveTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // NEW: State for therapist selection
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState("");

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard"); // Redirect to the correct dashboard
    }
  }, [currentUser, navigate]);

  // NEW: Effect to fetch therapists from Firestore
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const therapistsQuery = query(collection(db, "users"), where("role", "==", "therapist"));
        const querySnapshot = await getDocs(therapistsQuery);
        const therapistsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTherapists(therapistsList);
      } catch (err) {
        console.error("Error fetching therapists:", err);
        // You could set an error state here if needed
      }
    };

    fetchTherapists();
  }, []); // Runs once on component mount

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (activeTab === "signup") {
      // --- SIGN UP LOGIC ---
      if (!name) {
        setError("Please enter your name.");
        setLoading(false);
        return;
      }
      
      // NEW: Determine role based on email
      const isTherapist = email.toLowerCase().endsWith('@t.com');
      const role = isTherapist ? 'therapist' : 'user';

      // NEW: Validation for regular users
      if (role === 'user' && !selectedTherapist) {
        setError("Please select a therapist to continue.");
        setLoading(false);
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // NEW: Construct user data with conditional fields
        const userData = {
          uid: user.uid,
          name,
          email,
          role,
          createdAt: serverTimestamp(),
        };

        if (role === 'user') {
          userData.assignedTherapist = selectedTherapist; // Add therapist UID
        }

        await setDoc(doc(db, "users", user.uid), userData);

        navigate("/dashboard");
      } catch (err) {
        // ... (error handling remains the same)
        switch (err.code) {
          case "auth/email-already-in-use": setError("This email address is already in use."); break;
          case "auth/invalid-email": setError("Please enter a valid email address."); break;
          case "auth/weak-password": setError("Password should be at least 6 characters long."); break;
          default: setError("An unexpected error occurred. Please try again."); console.error("Signup Error:", err);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // --- LOGIN LOGIC (remains the same) ---
      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/dashboard");
      } catch (err) {
        switch (err.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential": setError("Invalid email or password."); break;
          default: setError("An unexpected error occurred. Please try again."); console.error("Login Error:", err);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // NEW: Determine if the therapist selector should be visible
  const showTherapistSelector = activeTab === "signup" && !email.toLowerCase().endsWith('@t.com');

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 shadow-2xl rounded-xl overflow-hidden">
        <div className="bg-gray-800 p-8 md:p-12 flex-col justify-center items-center text-center hidden md:flex">
            <BrainCircuit className="w-24 h-24 text-indigo-400 mb-6" />
            <h1 className="text-3xl font-bold mb-3">MindScribe AI</h1>
            <p className="text-gray-300">Your personal space for journaling, reflection, and AI-powered insights.</p>
        </div>
        <div className="bg-gray-800/50 p-8 md:p-12">
          {/* ... Tabs and titles ... */}
          <div className="flex mb-6 border-b border-gray-700">
            <button
              onClick={() => { setActiveTab("login"); setError(""); }}
              className={`w-1/2 py-3 text-sm font-semibold transition-colors ${
                activeTab === "login"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => { setActiveTab("signup"); setError(""); }}
              className={`w-1/2 py-3 text-sm font-semibold transition-colors ${
                activeTab === "signup"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              SIGN UP
            </button>
          </div>
          
          <h2 className="text-2xl font-semibold mb-2 text-center">
            {activeTab === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-gray-400 mb-6 text-center text-sm">
             {activeTab === 'login' ? 'Sign in to continue your journey.' : 'Get started in just a few clicks.'}
          </p>
          
          <form onSubmit={handleFormSubmit}>
            {activeTab === "signup" && (
              <div className="relative mb-4">
                <User className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}
            <div className="relative mb-4">
              <Mail className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="relative mb-4">
              <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* NEW: Therapist Selector Dropdown */}
            {showTherapistSelector && (
              <div className="relative mb-6">
                <Users className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedTherapist}
                  onChange={(e) => setSelectedTherapist(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  required
                >
                  <option value="" disabled>Select your therapist</option>
                  {therapists.map(therapist => (
                    <option key={therapist.id} value={therapist.id}>
                      {therapist.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center p-3 text-sm text-red-300 bg-red-900/30 rounded-md">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 rounded-md font-semibold hover:bg-indigo-700 transition-all duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (activeTab === 'login' ? 'Login' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}