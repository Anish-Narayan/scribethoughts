import React, { useState } from 'react';
import { X } from 'lucide-react';


export default function NewEntryModal({ isOpen, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content cannot be empty.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ title, content, mood });
      setTitle('');
      setContent('');
      onClose();
    } catch (error) {
      console.error("Failed to save entry:", error);
      alert("Could not save the entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 relative animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-4">New Journal Entry</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Entry Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="8"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="py-2 px-5 bg-gray-600 rounded-lg hover:bg-gray-500">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="py-2 px-5 bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}