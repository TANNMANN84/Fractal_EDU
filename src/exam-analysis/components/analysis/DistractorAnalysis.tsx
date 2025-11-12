// src/components/analysis/DistractorAnalysis.tsx

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../../../contexts/AppContext';
import { getLeafQuestions } from '../../utils/helpers';
import { ExamStudent } from '../../../../types';
import { Bar } from 'react-chartjs-2';

const DistractorAnalysis: React.FC = () => {
  const { data } = useAppContext();

  if (!data) {
    return <div>Loading...</div>;
  }

  const activeExam = data.examAnalysis.activeExamId ? data.examAnalysis.exams.find(e => e.id === data.examAnalysis.activeExamId) : null;
  const examStudents = activeExam?.students || [];
  const questions = activeExam?.questions || [];
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');

  const activeStudents = useMemo(() => {
    return examStudents.filter((s: ExamStudent) => s.lastName && s.firstName);
  }, [examStudents]);

  const mcqQuestions = useMemo(() => {
    return getLeafQuestions(questions).filter((q) => q.type === 'mcq');
  }, [questions]);

  const chartData = useMemo(() => {
    if (!selectedQuestionId || activeStudents.length === 0) {
      return null;
    }
    const question = mcqQuestions.find((q) => q.id === selectedQuestionId);
    if (!question) return null;

    const responseDistribution: Record<string, number> = {};
    activeStudents.forEach((s: ExamStudent) => {
      const response = s.mcqResponses[question.id]
        ? s.mcqResponses[question.id]
        : 'No Answer';
      responseDistribution[response] = (responseDistribution[response] || 0) + 1;
    });

    const labels = Object.keys(responseDistribution).sort();
    const data = labels.map((label) => responseDistribution[label]);
    const bgColors = labels.map((label) =>
      label === question.correctAnswer ? '#10b981' : '#ef4444' // Green for correct, Red for incorrect
    );

    return {
      labels,
      datasets: [
        {
          label: '# of Students',
          data: data,
          backgroundColor: bgColors,
        },
      ],
    };
  }, [selectedQuestionId, activeStudents, mcqQuestions]);

  if (mcqQuestions.length === 0) {
    return null; // Don't show this section if no MCQs exist
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Response Distribution for ${
          mcqQuestions.find((q) => q.id === selectedQuestionId)?.displayNumber ||
          ''
        }`,
        color: '#d1d5db',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Students',
          color: '#9ca3af',
        },
        ticks: { color: '#9ca3af', stepSize: 1 },
        grid: { color: '#374151' },
      },
      x: {
        title: { display: true, text: 'Selected Answer', color: '#9ca3af' },
        ticks: { color: '#9ca3af' },
        grid: { color: '#374151' },
      },
    },
  };

  return (
    <div
      id="distractor-analysis-container"
      className="mt-8 pt-6 border-t border-gray-700"
    >
      <h3 className="text-xl font-semibold text-white mb-2">
        Distractor Analysis
      </h3>
      <select
        id="distractor-select-for-analysis"
        value={selectedQuestionId}
        onChange={(e) => setSelectedQuestionId(e.target.value)}
        className="block w-full max-w-xs pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-white"
      >
        <option value="">Select a multiple choice question...</option>
        {mcqQuestions.map((q) => (
          <option key={q.id} value={q.id}>
            {q.displayNumber}
          </option>
        ))}
      </select>
      <div id="distractor-analysis-content" className="mt-4">
        {chartData ? (
          <div className="bg-gray-800/50 p-4 rounded-lg max-w-3xl mx-auto">
            <Bar options={chartOptions as any} data={chartData} />
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Select a question to see the class response distribution.
          </p>
        )}
      </div>
    </div>
  );
};

export default DistractorAnalysis;