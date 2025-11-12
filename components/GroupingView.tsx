
import React, { useMemo } from 'react';
// FIX: Corrected import path to be relative.
import type { Student } from '../types';

interface GroupingViewProps {
  students: Student[];
  dataPoint: string;
}

const groupingConfig: { [key: string]: any } = {
  // --- Academic View ---
  "NAPLAN Year 7 - Reading": {
    columns: ["Needs additional support", "Developing", "Strong", "Exceeding", "Not Assessed"],
    accessor: (student: Student) => student.academic.naplan.year7.reading
  },
  "NAPLAN Year 7 - Writing": {
    columns: ["Needs additional support", "Developing", "Strong", "Exceeding", "Not Assessed"],
    accessor: (student: Student) => student.academic.naplan.year7.writing
  },
  "NAPLAN Year 7 - Spelling": {
    columns: ["Needs additional support", "Developing", "Strong", "Exceeding", "Not Assessed"],
    accessor: (student: Student) => student.academic.naplan.year7.spelling
  },
  "NAPLAN Year 7 - Grammar & Punctuation": {
    columns: ["Needs additional support", "Developing", "Strong", "Exceeding", "Not Assessed"],
    accessor: (student: Student) => student.academic.naplan.year7.grammar
  },
  "NAPLAN Year 7 - Numeracy": {
    columns: ["Needs additional support", "Developing", "Strong", "Exceeding", "Not Assessed"],
    accessor: (student: Student) => student.academic.naplan.year7.numeracy
  },
  "NAPLAN Year 9 - Reading": {
    columns: ["Needs additional support", "Developing", "Strong", "Exceeding", "Not Assessed"],
    accessor: (student: Student) => student.academic.naplan.year9.reading
  },
  "NAPLAN Year 9 - Writing": {
    columns: ["Needs additional support", "Developing", "Strong", "Exceeding", "Not Assessed"],
    accessor: (student: Student) => student.academic.naplan.year9.writing
  },
  "NAPLAN Year 9 - Spelling": {
    columns: ["Needs additional support", "Developing", "Strong", "Exceeding", "Not Assessed"],
    accessor: (student: Student) => student.academic.naplan.year9.spelling
  },
  "NAPLAN Year 9 - Grammar & Punctuation": {
    columns: ["Needs additional support", "Developing", "Strong", "Exceeding", "Not Assessed"],
    accessor: (student: Student) => student.academic.naplan.year9.grammar
  },
  "NAPLAN Year 9 - Numeracy": {
    columns: ["Needs additional support", "Developing", "Strong", "Exceeding", "Not Assessed"],
    accessor: (student: Student) => student.academic.naplan.year9.numeracy
  },
  // --- Wellbeing/Plans View ---
  "Has Behaviour Plan": {
    columns: [true, false],
    columnTitles: { 'true': "Has Plan", 'false': "No Plan" },
    accessor: (student: Student) => student.wellbeing.hasBehaviourPlan
  },
  "Has Learning Plan": {
    columns: [true, false],
    columnTitles: { 'true': "Has Plan", 'false': "No Plan" },
    accessor: (student: Student) => student.wellbeing.hasLearningPlan
  },
  "ATSI Status": {
    columns: ["Yes", "No", "Not Stated"],
    accessor: (student: Student) => student.profile.atsiStatus
  },
  // --- HPGE View ---
  "HPGE Status": {
    columns: ["Identified", "Nominated", "Not Identified"],
    accessor: (student: Student) => student.hpge.status
  }
};

const getNaplanBandColorClasses = (band: string): string => {
    switch (band) {
        case 'Exceeding': return 'bg-blue-100 text-blue-800';
        case 'Strong': return 'bg-green-100 text-green-800';
        case 'Developing': return 'bg-yellow-100 text-yellow-800';
        case 'Needs additional support': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const GroupingView: React.FC<GroupingViewProps> = ({ students, dataPoint }) => {
  const config = groupingConfig[dataPoint];

  const sortedStudents = useMemo(() => {
    if (!config) return {};

    const groups: { [key: string]: Student[] } = {};
    
    config.columns.forEach((col: any) => {
      groups[String(col)] = [];
    });
    
    students.forEach(student => {
      const value = config.accessor(student);
      const key = String(value);
      if (groups.hasOwnProperty(key)) {
        groups[key].push(student);
      }
    });

    return groups;
  }, [students, config]);

  if (!config) {
    return <div className="text-red-500">Error: Invalid data point selected.</div>;
  }

  const isNaplanView = dataPoint.startsWith('NAPLAN');

  return (
    <div className="flex flex-row gap-4 overflow-x-auto p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      {config.columns.map((columnValue: any) => {
        const columnKey = String(columnValue);
        const title = config.columnTitles?.[columnKey] ?? columnKey;
        const studentsInColumn = sortedStudents[columnKey] || [];
        
        const headerColorClass = isNaplanView 
            ? getNaplanBandColorClasses(columnKey)
            : 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200';

        return (
          <div key={columnKey} className="w-1/4 min-w-[220px] flex-shrink-0 bg-gray-200 dark:bg-gray-800 rounded-lg shadow">
            <h3 className={`font-bold text-center p-2 rounded-t-lg ${headerColorClass} transition-colors`}>
              {title}
              <span className="ml-2 font-semibold bg-gray-500 dark:bg-gray-600 text-white dark:text-gray-100 text-xs rounded-full px-2 py-0.5">
                {studentsInColumn.length}
              </span>
            </h3>
            <div className="p-2 space-y-2 min-h-[100px] max-h-[60vh] overflow-y-auto">
              {studentsInColumn.map(student => (
                <div key={student.studentId} className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-200">
                  {student.firstName} {student.lastName}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GroupingView;