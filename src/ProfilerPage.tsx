
import React, { useState } from 'react';
import { AppProvider } from '../contexts/AppContext';
import ClassDashboard from '../components/ClassDashboard';
// FIX: Corrected import path for ManagementConsole to be explicit.
import ManagementConsole from '../components/ManagementConsole';

const ProfilerPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'console'>('dashboard');

  return (    
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Student Profiler
        </h1>
        <div className="flex space-x-1 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-3 py-1.5 font-semibold text-sm rounded-md transition-colors duration-200 ${
              activeView === 'dashboard' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-600/60'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveView('console')}
            className={`px-3 py-1.5 font-semibold text-sm rounded-md transition-colors duration-200 ${
              activeView === 'console' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-600/60'
            }`}
          >
            Management
          </button>
        </div>
      </div>
      {activeView === 'dashboard' ? <ClassDashboard /> : <ManagementConsole />}
    </div>
  );
};

export default ProfilerPage;