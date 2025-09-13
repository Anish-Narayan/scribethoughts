import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Book, Zap, Smile, BarChart2, LogOut, ArrowLeft, Bot, Lightbulb, HeartHandshake, PenSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../../firebase"; // Adjust path if needed
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import NewEntryModal from "../NewEntryModel"; // Adjust path if needed
import { copingStrategies } from "../data/CopingStrategies";

// --- Helper Mappings & Components ---
const emotionToValue = {
    'joy': 5, 'love': 5, 'surprise': 4, 'neutral': 3,
    'fear': 2, 'sadness': 1, 'anger': 1, 'disgust': 1,
};
const emotionToEmoji = {
    'joy': '😊', 'surprise': '😮', 'neutral': '🤔',
    'fear': '😨', 'sadness': '😢', 'anger': '😠', 'disgust': '🤢',
    'default': '📝'
};

const StatCard = ({ icon: Icon, name, value }) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-sm font-medium text-gray-400">{name}</h3>
      <Icon className="h-6 w-6 text-indigo-400" />
    </div>
    <div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  </div>
);

// --- Insights Panel Component ---
const InsightsPanel = ({ entries }) => {
  const insights = useMemo(() => {
    const analyzedEntries = entries.filter(e => e.analysis && e.analysis.keywords && e.analysis.emotion);
    if (analyzedEntries.length < 3) return null;

    const allKeywords = analyzedEntries.flatMap(e => e.analysis.keywords);
    const keywordCounts = allKeywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {});
    const topKeywords = Object.entries(keywordCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([keyword]) => keyword);

    const emotionCorrelations = {};
    const emotions = ['joy', 'sadness', 'anger', 'love', 'fear'];
    emotions.forEach(emotion => {
      const keywordsForEmotion = analyzedEntries.filter(e => e.analysis.emotion === emotion).flatMap(e => e.analysis.keywords);
      if (keywordsForEmotion.length > 2) {
        const emotionKeywordCounts = keywordsForEmotion.reduce((acc, keyword) => {
          acc[keyword] = (acc[keyword] || 0) + 1;
          return acc;
        }, {});
        const topKeywordForEmotion = Object.keys(emotionKeywordCounts).reduce((a, b) => emotionKeywordCounts[a] > emotionKeywordCounts[b] ? a : b);
        emotionCorrelations[emotion] = topKeywordForEmotion;
      }
    });
    return { topKeywords, emotionCorrelations };
  }, [entries]);

  if (!insights) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-full flex flex-col items-center justify-center text-center">
        <Lightbulb className="h-10 w-10 text-indigo-400 mb-4" />
        <h3 className="text-lg font-semibold">Insights Unlocking...</h3>
        <p className="text-gray-400 mt-2 text-sm">Write a few more entries to reveal patterns about your journey.</p>
      </div>
    );
  }

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-full">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Lightbulb /> Your Personal Insights</h3>
      <div className="space-y-5">
        <div>
          <h4 className="text-sm font-bold text-gray-400 mb-2">Top Themes</h4>
          <div className="flex flex-wrap gap-2">
            {insights.topKeywords.map(keyword => (
              <span key={keyword} className="bg-indigo-600/50 text-indigo-200 text-xs font-medium px-2.5 py-1 rounded-full">{keyword}</span>
            ))}
          </div>
        </div>
        {Object.keys(insights.emotionCorrelations).length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-400 mb-2">Emotion & Topic Connections</h4>
            <ul className="space-y-1.5 text-sm text-gray-300">
              {Object.entries(insights.emotionCorrelations).map(([emotion, keyword]) => (
                <li key={emotion}>
                  When you feel <strong className="text-indigo-300">{capitalize(emotion)}</strong>, you often write about <strong className="text-indigo-300">"{keyword}"</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Coping Strategies Panel Component ---
const CopingStrategiesPanel = ({ entries }) => {
  const latestAnalyzedEmotion = useMemo(() => {
    const latestAnalyzedEntry = entries.find(e => e.analysis && e.analysis.emotion);
    return latestAnalyzedEntry?.analysis.emotion.toLowerCase() || null;
  }, [entries]);

  const strategies = copingStrategies[latestAnalyzedEmotion] || copingStrategies.default;
  const title = latestAnalyzedEmotion ? `Suggestions for ${latestAnalyzedEmotion.charAt(0).toUpperCase() + latestAnalyzedEmotion.slice(1)}` : "Mindful Moments";

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-full">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <HeartHandshake className="text-teal-400" /> {title}
      </h3>
      <ul className="space-y-3">
        {strategies.map((strategy, index) => (
          <li key={index} className="text-sm">
            <strong className="block text-teal-300">{strategy.title}</strong>
            <p className="text-gray-400">{strategy.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

// --- Visual Timeline Component ---
const Timeline = ({ entries, onEntrySelect }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold">No entries yet!</h3>
        <p className="text-gray-400 mt-2">Click "New Entry" to start your first journal.</p>
      </div>
    );
  }
  return (
    <div className="relative pl-8">
      <div className="absolute left-4 top-2 h-full w-0.5 bg-gray-700"></div>
      <ul className="space-y-8">
        {entries.map(entry => (
          <li key={entry.id} className="relative">
            <div className="absolute left-[-16px] top-1 h-8 w-8 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="h-4 w-4 bg-indigo-500 rounded-full"></span>
            </div>
            <button onClick={() => onEntrySelect(entry)} className="w-full text-left ml-6 block hover:bg-gray-700/50 p-4 rounded-lg transition-colors">
              <p className="text-xs text-gray-400 mb-1">{entry.createdAt ? new Date(entry.createdAt.toDate()).toLocaleDateString() : 'Saving...'}</p>
              <h4 className="font-semibold flex items-center gap-2">
                <span className="text-2xl">{entry.analysis?.emotion ? (emotionToEmoji[entry.analysis.emotion.toLowerCase()] || emotionToEmoji.default) : emotionToEmoji.default}</span>
                {entry.title}
              </h4>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// --- Main Dashboard Component ---
export default function UserDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const userDocRef = doc(db, "users", currentUser.uid);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) setUserName(docSnap.data().name);
    });
    const entriesQuery = query(collection(db, "journals"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(entriesQuery, (querySnapshot) => {
      const userEntries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllEntries(userEntries);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const dashboardStats = useMemo(() => {
    const validEntries = allEntries.filter(entry => entry.createdAt);
    const totalEntries = validEntries.length;
    if (totalEntries === 0) return { totalEntries: 0, writingStreak: 0, wordCount: 0, avgMood: "N/A" };
    const wordCount = validEntries.reduce((sum, entry) => sum + (entry.content?.split(' ').length || 0), 0);
    let streak = 0;
    if (totalEntries > 0) {
      const entryDates = [...new Set(validEntries.map(e => new Date(e.createdAt.toDate()).setHours(0, 0, 0, 0)))];
      entryDates.sort((a, b) => b - a);
      let today = new Date().setHours(0, 0, 0, 0);
      let yesterday = today - 86400000;
      if (entryDates[0] === today || entryDates[0] === yesterday) {
          streak = 1;
          for (let i = 0; i < entryDates.length - 1; i++) {
              if (entryDates[i] - entryDates[i+1] === 86400000) streak++;
              else break;
          }
      }
    }
    const analyzedEntries = validEntries.slice(0, 30).filter(entry => entry.analysis?.emotion);
    let avgMood = "N/A";
    if (analyzedEntries.length > 0) {
      const moodSum = analyzedEntries.reduce((sum, entry) => sum + (emotionToValue[entry.analysis.emotion.toLowerCase()] || 3), 0);
      const avgMoodValue = Math.round(moodSum / analyzedEntries.length);
      avgMood = { 5: 'Positive', 4: 'Good', 3: 'Neutral', 2: 'Negative', 1: 'Very Negative' }[avgMoodValue] || "N/A";
    }
    return { totalEntries, writingStreak: streak, wordCount, avgMood };
  }, [allEntries]);

  const handleLogout = useCallback(async () => {
    try { await logout(); navigate("/login"); }
    catch (error) { console.error("Failed to log out", error); }
  }, [logout, navigate]);

  const handleSaveEntry = useCallback(async (newEntry) => {
    if (!currentUser) return;
    await addDoc(collection(db, "journals"), {
      ...newEntry,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      analysisPerformed: false,
    });
  }, [currentUser]);

  return (
    <>
      <NewEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEntry} />
      <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Welcome back, {userName || '...'}!</h1>
              <p className="mt-2 text-gray-400">Here's your personalized journaling dashboard.</p>
            </div>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg transition-transform transform hover:scale-105">
                <Plus className="h-5 w-5" /> New Entry
              </button>
              <button onClick={handleLogout} className="p-2 bg-gray-700 rounded-lg hover:bg-red-600 transition-colors"><LogOut size={20} /></button>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={Book} name="Total Entries" value={dashboardStats.totalEntries} />
            <StatCard icon={Zap} name="Writing Streak" value={`${dashboardStats.writingStreak} Days`} />
            <StatCard icon={BarChart2} name="Words Written" value={dashboardStats.wordCount.toLocaleString()} />
            <StatCard icon={Smile} name="AI Assessed Mood" value={dashboardStats.avgMood} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
              {selectedEntry ? (
                <div>
                  <button onClick={() => setSelectedEntry(null)} className="flex items-center gap-2 text-sm text-indigo-400 hover:underline mb-4">
                    <ArrowLeft size={16} /> Back to Timeline
                  </button>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-4xl">{selectedEntry.analysis?.emotion ? (emotionToEmoji[selectedEntry.analysis.emotion.toLowerCase()] || emotionToEmoji.default) : emotionToEmoji.default}</span>
                    <h2 className="text-2xl font-bold">{selectedEntry.title}</h2>
                  </div>
                  <p className="text-xs text-gray-400 mb-6 ml-1">{selectedEntry.createdAt ? new Date(selectedEntry.createdAt.toDate()).toLocaleString() : 'Just now'}</p>
                  <p className="whitespace-pre-wrap text-gray-300 leading-relaxed">{selectedEntry.content}</p>
                  {selectedEntry.analysis && (
                    <div className="mt-6 p-4 bg-gray-900/50 border border-indigo-500/30 rounded-lg">
                      <h4 className="font-semibold text-indigo-300 flex items-center gap-2"><Bot size={18}/> AI Insights</h4>
                      {selectedEntry.analysis.alert && (
                          <div className="p-2 my-2 text-sm text-yellow-300 bg-yellow-900/30 rounded-md">
                            It looks like you might be going through a tough time. Remember to be kind to yourself, and know that your therapist is there to support you.
                          </div>
                      )}
                      <p className="text-sm mt-2"><strong className="text-gray-400">Detected Emotion:</strong> {selectedEntry.analysis.emotion}</p>
                      <p className="text-sm mt-1"><strong className="text-gray-400">Quick Summary:</strong> {selectedEntry.analysis.summary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><PenSquare /> Your Recent Journey</h3>
                  {loading ? <p className="text-gray-400">Loading entries...</p> : 
                    <Timeline entries={allEntries.slice(0, 5)} onEntrySelect={setSelectedEntry} />
                  }
                </div>
              )}
            </div>
            
            <div className="lg:col-span-1 flex flex-col gap-8">
              <CopingStrategiesPanel entries={allEntries} />
              <InsightsPanel entries={allEntries} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}