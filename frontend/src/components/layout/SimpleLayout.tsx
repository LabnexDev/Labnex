import React from 'react';
import { Link } from 'react-router-dom';

export const SimpleLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter">
      <nav className="sticky top-0 z-50 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="font-bold text-2xl text-white">Labnex</Link>
            </div>
            <div className="flex items-center">
              <Link to="/" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                &larr; Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main>
        {children}
      </main>
    </div>
  );
}; 