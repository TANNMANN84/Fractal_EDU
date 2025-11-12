import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20 print:hidden">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="font-bold text-xl text-indigo-600 dark:text-indigo-400">Fractal EDU</Link>
              <Link to="/" className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">Student Profiler</Link>
              <Link to="/analysis" className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">Exam Analysis</Link>
            </div>
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <Outlet />
    </div>
  );
};

export default RootLayout;