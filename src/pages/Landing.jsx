import React from "react";

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-200 to-purple-300">
      <h1 className="text-5xl font-bold text-gray-800">MindScribe</h1>
      <p className="mt-4 text-lg text-gray-700">Your AI-powered mental wellness journal</p>
      <a
        href="/login"
        className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
      >
        Get Started
      </a>
    </div>
  );
}
