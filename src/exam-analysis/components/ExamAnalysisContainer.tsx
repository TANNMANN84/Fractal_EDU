// src/components/ExamAnalysisContainer.tsx

import React from 'react';
import { produce } from 'immer';
import { useAppContext } from '../../../contexts/AppContext';
import SetupSection from './setup/SetupSection';
import DataEntryView from './entry/DataEntryView';
import AnalysisDashboard from './analysis/AnalysisDashboard';
import { Exam } from '../../../types';

const ExamAnalysisContainer = () => {
  const { data, saveData } = useAppContext();

  if (!data) {
    return <div>Loading exam analysis data...</div>;
  }

  const { exams, activeExamId } = data.examAnalysis;
  const activeExam = activeExamId ? exams.find(e => e.id === activeExamId) : null;

  const handleCreateNewExam = () => {
    const newExamName = window.prompt("Enter a name for the new exam:", "New Exam");
    if (newExamName) {
      const newExam: Exam = {
        id: `exam-${crypto.randomUUID()}`,
        name: newExamName,
        questions: [],
        students: [],
        selectedSyllabus: '',
        structureLocked: false,
      };
      const nextData = produce(data, draft => {
        draft.examAnalysis.exams.push(newExam);
      });
      saveData(nextData);
    }
  };

  // If an exam is active, show the appropriate view (Setup, Data Entry, or Analysis)
  if (activeExam) {
    const structureLocked = activeExam.structureLocked;
    const handleEditSetup = () => {
      const nextData = produce(data, draft => {
        const exam = draft.examAnalysis.exams.find(e => e.id === activeExam.id);
        if (exam) {
          exam.structureLocked = false;
        }
      });
      saveData(nextData);
    };
    return (
      <>{!structureLocked ? <SetupSection onFinalize={() => {}} /> : <><DataEntryView onEditSetup={handleEditSetup} /><AnalysisDashboard /></>}</>
    );
  }

  // If no exam is active, show the exam dashboard
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Exam Dashboard</h2>
        <button onClick={handleCreateNewExam} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
          + Create New Exam
        </button>
      </div>
      <div className="space-y-3">
        {exams.length > 0 ? (
          exams.map(exam => (
            <div key={exam.id} className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800 dark:text-white">{exam.name}</span>
              <button onClick={() => {
                const nextData = produce(data, draft => {
                  draft.examAnalysis.activeExamId = exam.id;
                });
                saveData(nextData);
              }} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                Select
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 py-8">No exams found. Create a new exam or import one using the Session Management tools.</p>
        )}
      </div>
    </div>
  );
};

export default ExamAnalysisContainer;