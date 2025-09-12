import React, { useState, useEffect } from "react";
import { Plus, Book, Zap, Smile, BarChart2, ChevronRight, LogOut } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../../firebase";
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";

import NewEntryModal from "../NewEntryModel";

const stats = [
  { name: "Total Entries", value: "78", icon: Book, change: "+5 this week" },
  { name: "Writing Streak", value: "12 Days", icon: Zap, change: "New record!" },
];
const moodData = [ { name: 'Mon', mood: 4 }, { name: 'Tue', mood: 3 }, { name: 'Wed', mood: 5 }, { name: 'Thu', mood: 2 }, { name: 'Fri', mood: 4 }, { name: 'Sat', mood: 3 }, { name: 'Sun', mood: 4 } ];

const StatCard = ({ icon: Icon, name, value, change }) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-start">
    <div className="flex items-center mb-4">
      <span className="bg-indigo-600 p-2 rounded-lg mr-3">
        <Icon className="h-6 w-6 text-white" />
      </span>
      <span className="text-lg font-semibold">{name}</span>
    </div>
    <div className="text-3xl font-bold mb-2">{value}</div>
    <div className="text-sm text-green-400">{change}</div>
  </div>
);
const MoodChart = () => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-full">
    <h3 className="text-lg font-semibold mb-4">Mood Over Time</h3>
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={moodData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="name" stroke="#9CA3AF" />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#9CA3AF" />
        <Tooltip />
        <Line type="monotone" dataKey="mood" stroke="#6366F1" strokeWidth={3} dot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);


export default function UserDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        setUserName(docSnap.data().name);
      }
    });

    const entriesQuery = query(
      collection(db, "journals"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(entriesQuery, (querySnapshot) => {
      const userEntries = [];
      querySnapshot.forEach((doc) => {
        userEntries.push({ id: doc.id, ...doc.data() });
      });
      setEntries(userEntries);
      setLoading(false);
    });

    return () => unsubscribe();

  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };
  
  const handleSaveEntry = async (newEntry) => {
    if (!currentUser) return;
    await addDoc(collection(db, "journals"), {
      ...newEntry,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      analysisPerformed: false,
    });
  };

  return (
    <>
      <NewEntryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
      />
      <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Welcome back, {userName || '...'}!</h1>
              <p className="mt-2 text-gray-400">Here's a snapshot of your journaling journey.</p>
            </div>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg transition-transform transform hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                New Entry
              </button>
              <button onClick={handleLogout} className="p-2 bg-gray-700 rounded-lg hover:bg-red-600 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Entries</h3>
                <a href="#" className="text-sm text-indigo-400 hover:underline">View All</a>
              </div>
              
              {loading ? (
                <p className="text-gray-400">Loading entries...</p>
              ) : entries.length > 0 ? (
                <ul className="space-y-4">
                  {entries.map((entry) => (
                    <li key={entry.id} className="p-4 bg-gray-700/50 rounded-lg flex items-center justify-between hover:bg-gray-700 transition-colors duration-200">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{entry.mood}</span>
                        <div>
                          <p className="font-semibold">{entry.title}</p>
                          <p className="text-sm text-gray-400">
                            {entry.createdAt ? new Date(entry.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                   <h3 className="text-xl font-semibold">No entries yet!</h3>
                   <p className="text-gray-400 mt-2">Click "New Entry" to start your first journal.</p>
                </div>
              )}
            </div>
            
\            <div className="lg:col-span-1">
              <MoodChart />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
