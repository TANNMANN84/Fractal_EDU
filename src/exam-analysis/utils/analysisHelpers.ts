// src/utils/analysisHelpers.ts

import { Student, Question } from '../types';
import { getLeafQuestions } from '../utils/helpers';

// Define the structure for the analysis data
export interface AnalysisDataItem {
  total: number;
  scored: number;
  students: {
    [studentId: string]: {
      total: number;
      scored: number;
    };
  };
}

export interface AnalysisData {
  moduleData: Record<string, AnalysisDataItem>;
  contentData: Record<string, AnalysisDataItem>;
  outcomeData: Record<string, AnalysisDataItem>;
  verbData: Record<string, AnalysisDataItem>;
  bandData: Record<string, number>;
}

/**
 * Calculates analysis data based on student responses and question structure.
 * @param students - Array of all student objects.
 * @param questions - Array of all top-level question objects.
 * @param activeTags - Array of active filter tags.
 * @param specificStudents - Optional array of specific students for individual/comparative analysis.
 */
export function getAnalysisData(
  students: Student[],
  questions: Question[],
  activeTags: string[] = [],
  specificStudents?: Student[]
): AnalysisData {
  let studentsToAnalyze: Student[];

  if (specificStudents) {
    // For individual or comparative analysis
    studentsToAnalyze = specificStudents;
  } else if (activeTags.length > 0 && students.some(s => s.tags && s.tags.length > 0)) {
    // For class analysis filtered by tags
    studentsToAnalyze = students.filter(
      (s) => s.tags && s.tags.length > 0 && activeTags.every((t) => s.tags!.includes(t))
    );
  } else {
    // For entire class analysis
    studentsToAnalyze = students.filter(
      (s) => s.lastName && s.firstName && Object.keys(s.responses).length > 0
    );
  }

  const moduleData: Record<string, AnalysisDataItem> = {};
  const contentData: Record<string, AnalysisDataItem> = {};
  const outcomeData: Record<string, AnalysisDataItem> = {};
  const verbData: Record<string, AnalysisDataItem> = {};

  const leafQuestions = getLeafQuestions(questions);

  leafQuestions.forEach((q: Question) => {
    const maxMarks = Number(q.maxMarks || 0);
    if (isNaN(maxMarks) || maxMarks === 0) return;

    const processCategory = (
      categoryData: Record<string, AnalysisDataItem>,
      itemKeys: string[] | undefined,
      distributedMaxMarks: number
    ) => {
      const keys = itemKeys && itemKeys.length > 0 ? itemKeys : ['Uncategorised'];
      
      keys.forEach((key) => {
        if (!categoryData[key]) {
          categoryData[key] = { total: 0, scored: 0, students: {} };
        }

        studentsToAnalyze.forEach((s) => {
          if (!categoryData[key].students[s.id]) {
            categoryData[key].students[s.id] = { total: 0, scored: 0 };
          }
          
          const studentData = categoryData[key].students[s.id];
          studentData.total += distributedMaxMarks;

          const responseScore = s.responses[q.id];
          if (responseScore !== undefined) {
            studentData.scored += responseScore / keys.length;
          }
        });
      });
    };
    
    // Distribute marks evenly among categories
    processCategory(moduleData, q.module, maxMarks / (q.module?.length || 1));
    processCategory(contentData, q.contentArea, maxMarks / (q.contentArea?.length || 1));
    processCategory(outcomeData, q.outcome, maxMarks / (q.outcome?.length || 1));
    processCategory(verbData, q.cognitiveVerb, maxMarks / (q.cognitiveVerb?.length || 1));
  });

  // Sum up totals from student data
  [moduleData, contentData, outcomeData, verbData].forEach((dataObject) => {
    Object.values(dataObject).forEach((item) => {
      let itemTotal = 0;
      let itemScored = 0;
      studentsToAnalyze.forEach((s) => {
        if (item.students[s.id]) {
          itemTotal += item.students[s.id].total;
          itemScored += item.students[s.id].scored;
        }
      });
      item.total = itemTotal;
      item.scored = itemScored;
    });
  });

  // Calculate Performance Band Data
  const bandData: Record<string, number> = {
    '90-100%': 0,
    '80-89%': 0,
    '70-79%': 0,
    '60-69%': 0,
    '50-59%': 0,
    '<50%': 0,
  };

  const totalMax = leafQuestions.reduce((s: number, q: Question) => s + Number(q.maxMarks || 0), 0);
  
  // Only calculate bands for class view (not individual)
  if (totalMax > 0 && !specificStudents) {
    studentsToAnalyze.forEach((s) => {
      const totalScore = leafQuestions.reduce(
        (sum: number, q: Question) => sum + (s.responses[q.id] || 0),
        0
      );
      const perc = (totalScore / totalMax) * 100;

      if (perc >= 90) bandData['90-100%']++;
      else if (perc >= 80) bandData['80-89%']++;
      else if (perc >= 70) bandData['70-79%']++;
      else if (perc >= 60) bandData['60-69%']++;
      else if (perc >= 50) bandData['50-59%']++;
      else bandData['<50%']++;
    });
  }

  return { moduleData, contentData, outcomeData, verbData, bandData };
}