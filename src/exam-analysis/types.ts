// src/types.ts

// --- Exam Analysis Question Type ---
export interface Question {
  id: string;
  number: string; // e.g., "1", "a", "i"
  maxMarks: number;
  type: 'marks' | 'mcq';
  correctAnswer: string; // For MCQ
  module?: string[]; // Optional arrays
  contentArea?: string[];
  outcome?: string[];
  cognitiveVerb?: string[];
  notes?: string; // Optional notes
  subQuestions: Question[]; // Always an array, even if empty
  // Properties added by helper functions, optional
  displayNumber?: string;
  level?: number;
}

// --- Student Type (Shared) ---
export interface Student {
  id: string;
  lastName: string;
  firstName: string;
  className?: string;
  tags?: string[]; // Optional tags array
  // Exam responses
  responses: { [questionId: string]: number }; // Keyed by Exam Question ID
  mcqResponses: { [questionId: string]: string }; // Keyed by Exam Question ID
}

// --- Exam Template Type ---
export interface Template {
  questions: Question[];
  selectedSyllabus: string;
}

// --- Rapid Test Question Types ---
export type RapidQuestionType =
  | 'Spelling'
  | 'MCQ'
  | 'Matching'
  | 'Written'
  | 'Marks';

export interface RapidQuestion {
  id: string;
  prompt: string;
  type: RapidQuestionType;
  maxMarks: number;
  // --- Matching Type Specific ---
  matchPairs?: Array<{
    id: string;
    term: string;
    correctMatch: string;
  }>;
  // --- MCQ Specific ---
  options?: string[];
  // --- Spelling/MCQ Specific ---
  correctAnswer?: string;
}

// --- Rapid Test Result Type ---
export interface RapidTestResult {
  studentId: string; // Links to Student.id
  type: 'pre' | 'post';
  responses: {
    // Keyed by RapidQuestion ID (for non-matching) or MatchPair ID (for matching)
    [questionOrTermId: string]: string | number | boolean; // boolean for matching items
  };
  totalScore: number;
}

// --- Rapid Test Type ---
export interface RapidTest {
  id: string;
  name: string;
  questions: RapidQuestion[];
  results: RapidTestResult[]; // Array of results
}

// --- App Mode ---
export type AppMode = 'exam' | 'rapidTest';

// --- Exam Type ---
export interface Exam {
  id: string;
  name: string;
  questions: Question[];
  students: Student[];
  selectedSyllabus: string;
  structureLocked: boolean;
}

// --- Global Application State ---
export interface AppState {
  // Mode and Data
  appMode: AppMode;
  rapidTests: RapidTest[]; // Array of rapid tests
  exams: Exam[]; // Array of exams
  activeExamId: string | null; // ID of the currently active exam
  rapidTestStudents: Student[]; // For junior pre/post tests
  // UI State
  deleteMode: boolean;
  selectedStudentId: string | null; // For exam data entry
  activeTags: string[]; // For filtering analysis
  rankingSort: { key: string; direction: 'asc' | 'desc' }; // For exam ranking table
}

// --- Actions for Reducer ---
export type AppAction =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'SET_APP_MODE'; payload: AppMode }
  // Exam Actions
  | { type: 'ADD_EXAM'; payload: Exam }
  | { type: 'SET_ACTIVE_EXAM'; payload: string | null }
  | { type: 'SET_SYLLABUS'; payload: { examId: string; syllabus: string } }
  | { type: 'SET_QUESTIONS'; payload: { examId: string; questions: Question[] } }
  | { type: 'SET_STRUCTURE_LOCKED'; payload: { examId: string; locked: boolean } }
  | { type: 'SET_EXAM_STUDENTS'; payload: { examId: string; students: Student[] } }
  // Student Actions (Shared)
  | { type: 'ADD_STUDENT'; payload: { mode: AppMode, student?: Student } }
  | { type: 'BULK_ADD_STUDENTS'; payload: { students: Student[], mode: AppMode } }
  | { type: 'REMOVE_STUDENT'; payload: { studentId: string, mode: AppMode } }
  | { type: 'SET_SELECTED_STUDENT'; payload: string | null } // payload is studentId
  | { type: 'UPDATE_STUDENT'; payload: { student: Student, mode: AppMode } }
  | { type: 'SET_DELETE_MODE'; payload: boolean }
  // Analysis Actions
  | { type: 'SET_ACTIVE_TAGS'; payload: string[] }
  | { type: 'SET_RANKING_SORT'; payload: AppState['rankingSort'] }
  // Rapid Test Actions
  | { type: 'ADD_RAPID_TEST'; payload: RapidTest }
  | { type: 'UPDATE_RAPID_TEST'; payload: RapidTest }
  | { type: 'DELETE_RAPID_TEST'; payload: string } // payload is testId
  | { type: 'SET_RAPID_TEST_RESULTS'; payload: { testId: string; studentId: string; testType: 'pre' | 'post'; responses: RapidTestResult['responses'] } };