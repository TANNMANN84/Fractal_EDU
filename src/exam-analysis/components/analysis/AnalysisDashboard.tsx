// src/components/analysis/AnalysisDashboard.tsx

import React from 'react';

// Import all the components
import ProblemQuestionsSummary from './ProblemQuestionsSummary';
import TagFilter from './TagFilter';
import ClassAnalysisCharts from './ClassAnalysisCharts';
import IndividualAnalysis from './IndividualAnalysis';
import DistractorAnalysis from './DistractorAnalysis';
import QuestionAnalysis from './QuestionAnalysis';

const AnalysisDashboard: React.FC = () => {
  return (
    <>
      <div className="flex justify-between items-center border-b border-gray-600 pb-3 mb-4">
        <h2 className="text-2xl font-semibold text-white">3. Performance Analysis</h2>
      </div>

      <div id="analysis-content" className="space-y-12">
        <ProblemQuestionsSummary />
        <TagFilter />
        <ClassAnalysisCharts />
        {/* ... rest of the components ... */}
        <IndividualAnalysis />
        <DistractorAnalysis />
        <QuestionAnalysis />
      </div>
    </>
  );
};

export default AnalysisDashboard;