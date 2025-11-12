
import React from 'react';
// FIX: Corrected import path to be relative.
import type { Student } from '../types';
import { DraggableSyntheticListeners } from '@dnd-kit/core';

interface StudentCardProps {
  student: Student;
  onClick: () => void;
  isRemoveMode: boolean;
  onRemoveFromClass: () => void;
  listeners?: DraggableSyntheticListeners;
}

const Badge: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
    <span className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded ${color}`}>
        {children}
    </span>
);

const StudentCard: React.FC<StudentCardProps> = ({ student, onClick, isRemoveMode, onRemoveFromClass, listeners }) => {
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onClick of the parent div from firing
    onRemoveFromClass();
  }

  return (
    <div
        className={`relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-200 group hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 ${
            isRemoveMode ? 'cursor-pointer animate-wobble' : ''
        }`}
    >
      {!isRemoveMode && (
        <button {...listeners} className="absolute top-1 left-1 p-1 cursor-grab text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}

      <div className={`absolute top-1 right-1 flex transition-opacity ${isRemoveMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button 
            onClick={onClick}
            className="p-1 text-gray-400 dark:text-gray-500 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Edit ${student.firstName}`}
            disabled={isRemoveMode}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
          </button>
          <button 
            onClick={handleRemoveClick}
            className={`p-1 text-gray-400 dark:text-gray-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-500 dark:hover:text-red-400 ${!isRemoveMode && 'hidden'}`}
            aria-label={`Remove ${student.firstName} from class`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
      </div>

      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-200">{student.firstName} {student.lastName}</h3>
      <div className="mt-2 flex flex-wrap gap-1">
        {student.wellbeing.hasBehaviourPlan && <Badge color="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">Behaviour</Badge>}
        {student.wellbeing.hasLearningPlan && <Badge color="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300">Learning</Badge>}
        {student.hpge.status !== 'Not Identified' && <Badge color="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">HPGE</Badge>}
      </div>
    </div>
  );
};

export default StudentCard;