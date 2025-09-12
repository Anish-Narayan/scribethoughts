import React, { useContext, useState, useEffect, createContext } from "react";
import { auth, db } from "../../firebase"; // Adjust path if needed
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore"; // Import Firestore functions

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // NEW: State for Firestore profile data
  const [loading, setLoading] = useState(true);

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    let unsubscribeProfile; // To clean up Firestore listener

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        // NEW: If user is logged in, listen for profile changes
        const docRef = doc(db, "users", user.uid);
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            console.log("No such user profile document!");
            setUserProfile(null);
          }
          setLoading(false);
        });
      } else {
        // NEW: If user logs out, clear profile and stop listening
        if (unsubscribeProfile) unsubscribeProfile();
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Cleanup both listeners on component unmount
    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const value = {
    currentUser,
    userProfile, // NEW: Expose user profile
    logout,
    loading,     // NEW: Expose loading state
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}