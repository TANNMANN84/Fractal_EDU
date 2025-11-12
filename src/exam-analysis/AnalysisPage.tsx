import React, { Suspense, lazy } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import Header from './components/Header';
import RapidTestDashboard from './components/rapid-test/RapidTestDashboard';
import SessionManager from './components/SessionManager';
const ExamAnalysisContainer = lazy(() => import('./components/ExamAnalysisContainer'));

const AnalysisPage: React.FC = () => {
  const { data } = useAppContext();

  // --- ADD THIS BLOCK ---
  // This prevents any errors if the page renders before the
  // AppProvider's data has finished loading.
  if (!data) {
    return <div className="text-center p-8">Loading...</div>;
  }
  // --- END BLOCK ---

  // Now we know 'data' and 'data.examAnalysis' exist,
  // so we can safely remove the '?'
  const appMode = data.examAnalysis.appMode;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100">
      <Header />
      <SessionManager />
          <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
        <main>
          {appMode === 'rapidTest' ? (
            <RapidTestDashboard />
          ) : (
            <ExamAnalysisContainer />
          )}
        </main>
      </Suspense>
    </div>
  );
};

export default AnalysisPage;