// src/components/Header.tsx

import React from 'react';
import { produce } from 'immer';
import { useAppContext } from '../../../contexts/AppContext';
import { AppMode } from '../../../types';

const Header: React.FC = () => {
  const { data, saveData } = useAppContext();

  const setMode = (mode: AppMode) => {
    if (!data) return;
    const nextData = produce(data, draft => {
      draft.examAnalysis.appMode = mode;
    });
    saveData(nextData);
  };

  return (
    <div className="flex justify-between items-center py-4 mb-6 border-b border-gray-200 dark:border-gray-700">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
        Examination & Growth Analysis Tool
      </h1>
      <div className="flex space-x-1 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
        <button
          onClick={() => setMode('exam')}
          className={`px-3 py-1.5 font-semibold text-sm rounded-md transition-colors duration-200 ${
            data?.examAnalysis.appMode === 'exam'
              ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 shadow'
              : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-600/60'
          }`}
        >
          Exam Analysis
        </button>
        <button
          onClick={() => setMode('rapidTest')}
          className={`px-3 py-1.5 font-semibold text-sm rounded-md transition-colors duration-200 ${
            data?.examAnalysis.appMode === 'rapidTest'
              ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 shadow'
              : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-600/60'
          }`}
        >
          Pre/Post Test
        </button>
      </div>
    </div>
  );
};

export default Header;