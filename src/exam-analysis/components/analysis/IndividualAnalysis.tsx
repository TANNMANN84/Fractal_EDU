// src/components/analysis/IndividualAnalysis.tsx

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../../../contexts/AppContext';
import { ExamStudent } from '../../../../types';
import IndividualAnalysisCharts from './IndividualAnalysisCharts';

const IndividualAnalysis: React.FC = () => {
  const { data } = useAppContext();

  if (!data) {
    return <div>Loading...</div>;
  }

  const activeExam = data.examAnalysis.activeExamId ? data.examAnalysis.exams.find(e => e.id === data.examAnalysis.activeExamId) : null;
  const examStudents = activeExam?.students || [];
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const activeStudents = useMemo(() => {
    return examStudents
      .filter((s: ExamStudent) => s.lastName && s.firstName)
      .sort((a: ExamStudent, b: ExamStudent) => a.lastName.localeCompare(b.lastName));
  }, [examStudents]);

  const selectedStudents = useMemo(() => {
    return activeStudents.filter((s: ExamStudent) =>
      selectedStudentIds.includes(s.id)
    );
  }, [activeStudents, selectedStudentIds]);

  const handleSelectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setSelectedStudentIds(selectedOptions);
  };

  const getTitle = () => {
    if (selectedStudents.length > 1) {
      return 'Comparative Student Analysis';
    }
    if (selectedStudents.length === 1) {
      return 'Individual Student Analysis';
    }
    return 'Individual Student Analysis';
  };

  if (activeStudents.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-700">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3
          id="individual-analysis-title"
          className="text-xl font-semibold text-white"
        >
          {getTitle()}
        </h3>
      </div>
      <label
        htmlFor="student-select-for-analysis"
        className="block text-sm font-medium text-gray-400 mb-1"
      >
        Select student(s) (hold Ctrl/Cmd to select multiple)
      </label>
      <select
        id="student-select-for-analysis"
        multiple
        value={selectedStudentIds}
        onChange={handleSelectionChange}
        className="block w-full max-w-xs pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-white"
      >
        {activeStudents.map((s: ExamStudent) => (
          <option key={s.id} value={s.id}>
            {s.lastName}, {s.firstName}
          </option>
        ))}
      </select>
      <div id="individual-analysis-content" className="mt-4">
        <IndividualAnalysisCharts selectedStudents={selectedStudents} />
      </div>
    </div>
  );
};

export default IndividualAnalysis;