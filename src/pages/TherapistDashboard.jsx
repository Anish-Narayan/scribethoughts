import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; // Adjust path if your firebase.js is elsewhere
import { collection, query, where, getDocs, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { LogOut, User, BookOpen, BrainCircuit, Loader2, AlertTriangle, CheckCircle, ShieldCheck, XCircle } from 'lucide-react';

// --- Reusable Journal Entry Card Component ---
const JournalEntryCard = ({ entry, patientName, onAnalyze, onAcknowledge, onResolve, analyzingId }) => {
  // Determine the three possible states of an alert for styling and logic
  const isAlertUnacknowledged = entry.analysis?.alert && !entry.alertAcknowledged;
  const isAlertAcknowledged = entry.analysis?.alert && entry.alertAcknowledged && !entry.alertResolved;
  const isAlertResolved = entry.analysis?.alert && entry.alertResolved;

  // Determine card styling based on the alert state
  const cardStyle = isAlertUnacknowledged ? 'bg-red-900/50 border border-red-500'
    : isAlertAcknowledged ? 'bg-yellow-900/50 border border-yellow-500'
      : 'bg-gray-700/50';

  return (
    <div className={`p-4 rounded-lg transition-all ${cardStyle}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-lg font-semibold">{entry.mood} {entry.title}</p>
          <p className="text-xs text-gray-400">
            {patientName && <span className="font-bold">{patientName}</span>}
            {' on '}{new Date(entry.createdAt?.toDate()).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => onAnalyze(entry.id, entry.content)}
          disabled={analyzingId === entry.id || entry.analysisPerformed}
          className="flex items-center gap-2 py-1 px-3 bg-indigo-600 rounded-md text-sm hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex-shrink-0"
        >
          {analyzingId === entry.id ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
          {entry.analysisPerformed ? 'Analyzed' : (analyzingId === entry.id ? 'Analyzing...' : 'Analyze')}
        </button>
      </div>
      <p className="mt-4 text-gray-300 whitespace-pre-wrap">{entry.content}</p>

      {entry.analysis && (
        <div className={`mt-4 p-3 rounded-lg border ${isAlertUnacknowledged ? 'bg-red-800/40 border-red-500/50' :
            isAlertAcknowledged ? 'bg-yellow-800/40 border-yellow-500/50' :
              'bg-gray-800 border-indigo-500/30'
          }`}>
          <h4 className={`font-semibold mb-2 ${isAlertUnacknowledged ? 'text-red-300' :
              isAlertAcknowledged ? 'text-yellow-300' :
                'text-indigo-300'
            }`}>AI Insights</h4>

          {isAlertUnacknowledged && (
            <div className="p-2 bg-red-900/50 rounded-md mb-2">
              <p className="text-sm font-bold text-red-300">ALERT: Potential self-harm risk detected.</p>
              <button onClick={() => onAcknowledge(entry.id)} className="text-xs mt-1 underline text-yellow-400 hover:text-yellow-300">Acknowledge this alert</button>
            </div>
          )}
          {isAlertAcknowledged && (
            <div className="p-2 bg-yellow-900/50 rounded-md mb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-yellow-300">Alert Acknowledged. Awaiting resolution.</p>
                <button onClick={() => onResolve(entry.id)} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-1 px-2 rounded">Mark as Resolved</button>
              </div>
            </div>
          )}
          {isAlertResolved && (
            <div className="flex items-center gap-2 text-sm text-green-400 mb-2">
              <ShieldCheck size={16} />
              <span>Alert has been resolved.</span>
            </div>
          )}

          <p className="text-sm"><strong className="text-gray-400">Emotion:</strong> {entry.analysis.emotion}</p>
          <p className="text-sm mt-1"><strong className="text-gray-400">Summary:</strong> {entry.analysis.summary}</p>
        </div>
      )}
    </div>
  );
};


// --- Main Therapist Dashboard Component ---
export default function TherapistDashboard() {
  const { userProfile, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  // State
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientEntries, setPatientEntries] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);

  const API_ENDPOINT = "http://localhost:8000/analyze";

  // Effect 1: Fetch assigned patients on mount
  useEffect(() => {
    if (!currentUser) return;
    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const patientsQuery = query(collection(db, "users"), where("assignedTherapist", "==", currentUser.uid));
        const querySnapshot = await getDocs(patientsQuery);
        const patientsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPatients(patientsList);
      } catch (err) { console.error("Error fetching patients:", err); }
      finally { setLoadingPatients(false); }
    };
    fetchPatients();
  }, [currentUser]);

  // Effect 2: Fetch a selected patient's journal entries
  useEffect(() => {
    if (!selectedPatient) {
      setPatientEntries([]);
      return;
    }
    setLoadingEntries(true);
    const entriesQuery = query(collection(db, "journals"), where("userId", "==", selectedPatient.id), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(entriesQuery, (snapshot) => {
      const entriesList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPatientEntries(entriesList);
      setLoadingEntries(false);
    }, (error) => { console.error("Error fetching patient entries:", error); setLoadingEntries(false); });
    return () => unsubscribe();
  }, [selectedPatient]);

  // Effect 3: Listen for new, unanalyzed entries for background processing
  useEffect(() => {
    if (!patients.length) return;
    const patientIds = patients.map(p => p.id);
    const unanalyzedQuery = query(collection(db, "journals"), where("userId", "in", patientIds), where("analysisPerformed", "==", false));
    const unsubscribe = onSnapshot(unanalyzedQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const newEntry = { id: change.doc.id, ...change.doc.data() };
          performAnalysis(newEntry.id, newEntry.content, true);
        }
      });
    });
    return () => unsubscribe();
  }, [patients]);

  // Effect 4: Listen for all unresolved alerts to populate the main alerts list
  useEffect(() => {
    if (!patients.length) return;
    const patientIds = patients.map(p => p.id);
    const alertQuery = query(collection(db, "journals"), where("userId", "in", patientIds), where("analysis.alert", "==", true), where("alertResolved", "==", false));
    const unsubscribe = onSnapshot(alertQuery, (snapshot) => {
      const activeAlerts = snapshot.docs.map(d => {
        const entryData = d.data();
        const patient = patients.find(p => p.id === entryData.userId);
        return { id: d.id, ...entryData, patientName: patient?.name || 'Unknown' };
      });
      setAlerts(activeAlerts);
    });
    return () => unsubscribe();
  }, [patients]);

  // --- Action Handlers ---
  const performAnalysis = useCallback(async (entryId, text, isBackground = false) => {
    if (!isBackground) setAnalyzingId(entryId);
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error("Analysis request failed");
      const result = await response.json();
      const updateData = { analysis: result, analysisPerformed: true };
      if (result.alert) {
        updateData.alertAcknowledged = false;
        updateData.alertResolved = false;
      }
      const entryRef = doc(db, "journals", entryId);
      await updateDoc(entryRef, updateData);
    } catch (error) {
      console.error("Failed to analyze entry:", error);
      if (!isBackground) alert("Could not analyze the entry.");
    } finally {
      if (!isBackground) setAnalyzingId(null);
    }
  }, []);

  const handleAcknowledgeAlert = async (entryId) => {
    await updateDoc(doc(db, "journals", entryId), { alertAcknowledged: true });
  };

  const handleResolveAlert = async (entryId) => {
    await updateDoc(doc(db, "journals", entryId), { alertResolved: true });
  };

  const handleLogout = async () => {
    try { await logout(); navigate("/login"); }
    catch (error) { console.error("Failed to log out", error); }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <a href="/dashboard/therapist">
              <h1 className="text-3xl font-bold">Therapist Dashboard</h1>
            </a>
            <p className="mt-2 text-gray-400">Welcome, {userProfile?.name || 'Therapist'}.</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-gray-700 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* --- Patient List (Left Column) --- */}
          <div className="md:col-span-1 bg-gray-800 p-4 rounded-xl border border-gray-700 self-start">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><User /> Your Patients</h2>
            {loadingPatients ? <p className="text-gray-400">Loading...</p> : (
              <ul className="space-y-2">
                {patients.map(patient => {
                  const hasNewAlert = alerts.some(a => a.userId === patient.id && !a.alertAcknowledged);
                  return (
                    <li key={patient.id}>
                      <button onClick={() => setSelectedPatient(patient)} className={`w-full flex justify-between items-center text-left p-3 rounded-lg transition-colors ${selectedPatient?.id === patient.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}>
                        <span>{patient.name}</span>
                        {hasNewAlert && <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 animate-pulse" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* --- Main Content Panel (Right Column) --- */}
          <div className="md:col-span-3">
            {selectedPatient ? (
              // --- View for a SELECTED PATIENT ---
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3"><BookOpen /> Journal for {selectedPatient.name}</h2>
                  <button onClick={() => setSelectedPatient(null)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                    <XCircle size={18} /> View All Alerts
                  </button>
                </div>
                {loadingEntries ? <p className="text-gray-400">Loading entries...</p> : patientEntries.length > 0 ? (
                  <div className="space-y-6">
                    {patientEntries.map(entry => (
                      <JournalEntryCard
                        key={entry.id}
                        entry={entry}
                        onAnalyze={performAnalysis}
                        onAcknowledge={handleAcknowledgeAlert}
                        onResolve={handleResolveAlert}
                        analyzingId={analyzingId}
                      />
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-center py-10">This patient has not written any journal entries yet.</p>}
              </div>
            ) : (
              // --- DEFAULT View for GLOBAL ALERTS ---
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><AlertTriangle className="text-yellow-400" /> All Active Alerts</h2>
                {alerts.length > 0 ? (
                  <div className="space-y-6">
                    {alerts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map(alertEntry => (
                      <JournalEntryCard
                        key={alertEntry.id}
                        entry={alertEntry}
                        patientName={alertEntry.patientName}
                        onAnalyze={performAnalysis}
                        onAcknowledge={handleAcknowledgeAlert}
                        onResolve={handleResolveAlert}
                        analyzingId={analyzingId}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <h3 className="mt-2 text-lg font-medium text-white">No Active Alerts</h3>
                    <p className="mt-1 text-sm text-gray-400">All patient alerts are resolved. Great work!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}