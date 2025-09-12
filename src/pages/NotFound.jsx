import React from "react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-5xl font-bold text-red-500">404</h1>
      <p className="mt-2 text-lg">Page not found</p>
      <a href="/" className="mt-4 text-indigo-600 underline">Go Home</a>
    </div>
  );
}
