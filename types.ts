// --- Core Data Structures (From Student Profiler) ---
export interface AppData {
  students: Student[];
  classes: ClassData[];
  monitoringDocs: MonitoringDoc[];
  teacherProfile: Teacher | null;
  version?: number; // From profiler's AppContext/storageService logic

  // --- ADDED FROM EXAM ANALYSIS APP ---
  examAnalysis: {
    appMode: AppMode;
    rapidTests: RapidTest[];
    exams: Exam[];
    activeExamId: string | null;
    rapidTestStudents: ExamStudent[]; // Uses the renamed ExamStudent
    deleteMode: boolean;
    selectedStudentId: string | null;
    activeTags: string[];
    rankingSort: { key: string; direction: 'asc' | 'desc' };
  };
  // --- END OF ADDED BLOCK ---
}

export interface Teacher {
  name: string;
  email: string;
}

export interface Student {
  studentId: string;
  firstName: string;
  lastName: string;
  profile: StudentProfile;
  academic: StudentAcademic;
  wellbeing: StudentWellbeing;
  hpge: StudentHpge;
  evidenceLog: EvidenceLogEntry[];
  workSamples: WorkSample[];

  // --- [NEW] ADDED THIS PROPERTY ---
  analysisResults?: {
    examResponses: {
      // Key will be the Exam.id
      [examId: string]: {
        examName: string; // Store this for easy display
        responses: { [questionId: string]: number };
        mcqResponses: { [questionId: string]: string };
      };
    };
    rapidTestResults: {
      // Key will be the RapidTest.id
      [testId: string]: {
        testName: string;
        // Store pre/post results separately
        pre?: { [questionOrTermId: string]: string | number | boolean };
        post?: { [questionOrTermId: string]: string | number | boolean };
      };
    };
  };
  // --- END OF NEW PROPERTY ---
}

export interface ClassData {
  classId: string;
  className: string;
  teacher: string;
  studentIds: string[];
  status: 'Active' | 'Archived';
  studentSortOrder?: string[];
  seatingCharts?: { [name: string]: SeatingChart };
  activeSeatingChartName?: string;
}

export interface SeatingChart {
  rows: number;
  seatsPerRow: number;
  arrangement: (string | null)[][];
}

export interface MonitoringDoc {
  id: string;
  classId: string;
  year: number;
  certifySyllabus: boolean;
  scopeAndSequence: FileUpload | null;
  teachingPrograms: TermBased<FileUpload[]>;
  semesterReports: TermBased<FileUpload | null>;
  assessmentSchedule: FileUpload | null;
  assessmentTask1: FileUpload[];
  assessmentTask2: FileUpload[];
  assessmentTask3: FileUpload[];
  prePostDiagnostic: FileUpload[];
  marksAndRanks: TermBased<FileUpload | null>;
  scannedWorkSamples: {
    task1: WorkSampleScans;
    task2: WorkSampleScans;
    task3: WorkSampleScans;
  };
  specificLearningNeeds: TermBased<boolean>;
  studentsCausingConcern: TermBased<ConcernEntry[]>;
  illnessMisadventure: TermBased<FileUpload[]>;
  malpractice: TermBased<FileUpload[]>;
  teacherSignOff: TermBased<TermSignOff | { teacherName: string; date: null }>;
  headTeacherSignOff: TermBased<TermSignOff | { teacherName: string; date: null }>;
}

// --- Student Sub-types (From Student Profiler) ---

export interface StudentProfile {
  dob: string;
  atsiStatus: 'No' | 'Yes' | 'Not Stated';
  gender: string;
  pronouns: string;
  currentYearGroup: number;
  status: 'Active' | 'Archived';
}

export interface StudentAcademic {
  naplan: {
    year7: NaplanDataSet;
    year9: NaplanDataSet;
  };
  reportGrades: ReportGrade[];
  notes: NoteEntry[];
  learningSupport: LearningSupport;
}

export interface StudentWellbeing {
  hasBehaviourPlan: boolean;
  behaviourPlanLink: string;
  hasLearningPlan: boolean;
  learningPlanLink: string;
  strengths: string[];
  triggers: string[];
  proactiveStrategies: string[];
  deescalationStrategies: string[];
  medicalNeeds: string[];
  attendancePercent: number;
  evidenceLog?: EvidenceLogEntry[];
  sentralBehaviourSummary: string;
  notes: NoteEntry[];
}

export interface StudentHpge {
  status: 'Not Identified' | 'Nominated' | 'Identified';
  domain: 'Not Applicable' | 'Intellectual' | 'Creative' | 'Social-Emotional' | 'Physical';
  identificationEvidence: HpgeEvidence[];
  talentDevelopmentPlan: string;
  notes: NoteEntry[];
}

// --- Generic & Reusable Types (From Student Profiler) ---

export type Term = '1' | '2' | '3' | '4';
export interface TermBased<T> {
  '1': T;
  '2': T;
  '3': T;
  '4': T;
}

export interface FileUpload {
  id: string; // Unique ID for IndexedDB lookup
  name: string;
}

export interface NoteEntry {
  id: string;
  date: string; // ISO string
  author: string;
  content: string;
}

// --- Specific Data Entry Types (From Student Profiler) ---

export type NaplanBand =
  | 'Needs additional support'
  | 'Developing'
  | 'Strong'
  | 'Exceeding'
  | 'Not Assessed';

export interface NaplanDataSet {
  reading: NaplanBand;
  writing: NaplanBand;
  spelling: NaplanBand;
  grammar: NaplanBand;
  numeracy: NaplanBand;
}

export interface ReportGrade {
  id: string;
  period: string; // e.g., "Y7S1"
  grade: string;
}

export interface LearningSupport {
  isSwan: boolean;
  requiresLearningCentreBooking: boolean;
  differentiation: DifferentiationEntry[];
  numeracyEvidence: NumeracyEvidenceEntry[];
  literacyEvidence: LiteracyEvidenceEntry[];
}

export interface DifferentiationEntry {
  id: string;
  date: string; // ISO string
  note: string;
  file?: FileUpload;
}

export interface LiteracyEvidenceEntry {
  id: string;
  date: string; // ISO string
  note?: string;
  file?: FileUpload;
  tags: LiteracyTag[];
}

export interface NumeracyEvidenceEntry {
  id: string;
  date: string; // ISO string
  note?: string;
  file?: FileUpload;
  numeracyTags: NumeracyTag[];
  newmansTags: NewmansTag[];
}

export interface HpgeEvidence {
  id: string;
  note: string;
  fileLink?: string;
  evidenceFile?: FileUpload;
}

export interface EvidenceLogEntry {
  logId: string;
  date: string; // ISO String
  teacher: string;
  note: string;
  tags: EvidenceTag[];
  adjustment_level?: string;
  adjustments_used?: string[];
  evidenceLink?: string;
  evidenceFile?: FileUpload;
}

export interface WorkSample {
  id: string;
  title: string;
  comments?: string;
  fileLink?: string;
  fileUpload?: FileUpload;
}

export interface WorkSampleScans {
  top: FileUpload | null;
  middle: FileUpload | null;
  low: FileUpload | null;
}

export interface ConcernEntry {
  id: string;
  file: FileUpload;
  studentIds: string[];
}

export interface TermSignOff {
  teacherName: string;
  date: string; // ISO String
  signatureImage?: string; // Base64 encoded image
}

// --- Tag Types (From Student Profiler) ---
export type EvidenceTag =
  | 'Wellbeing'
  | 'Learning Support'
  | 'HPGE'
  | 'NCCD'
  | 'Cultural';
export type LiteracyTag = 'Reading' | 'Writing' | 'Spelling' | 'Grammar';
export type NumeracyTag =
  | 'Number'
  | 'Algebra'
  | 'Measurement'
  | 'Geometry'
  | 'Statistics'
  | 'ProblemSolving'
  | 'Reasoning'
  | 'Calculating';
export type NewmansTag = 'Read it' | 'What' | 'How' | 'Have a Go' | 'Answer it';

// --- Import/Export Types (From Student Profiler) ---
export interface ReviewPackage {
  dataType: 'reviewPackage';
  classData: ClassData;
  monitoringDoc: MonitoringDoc;
  students: Student[];
  profilerSnapshot: StudentProfilerSnapshotEntry[];
}

export interface StudentProfilerSnapshotEntry {
  studentId: string;
  firstName: string;
  lastName: string;
  hasWellbeingNotes: boolean;
  hasAcademicNotes: boolean;
  hasHpgeNotes: boolean;
  hasDifferentiation: boolean;
  hasEvidenceLogs: boolean;
  hasWorkSamples: boolean;
  naplan: {
    year7: { reading: NaplanBand; writing: NaplanBand; numeracy: NaplanBand };
    year9: { reading: NaplanBand; writing: NaplanBand; numeracy: NaplanBand };
  };
}

export interface StudentTransferPackage {
  dataType: 'studentTransfer';
  student: Student;
  files: { [id: string]: string };
}

export interface ClassTransferPackage {
  dataType: 'classTransfer';
  classData: ClassData;
  students: Student[];
  monitoringDoc: MonitoringDoc | null;
  files: { [id: string]: string };
}

export interface ReportOptions {
  profileDetails: boolean;
  wellbeingPlans: boolean;
  wellbeingNotes: boolean;
  academicNaplan: boolean;
  academicGrades: boolean;
  academicNotes: boolean;
  hpgeProfile: boolean;
  hpgeNotes: boolean;
  workSamples: boolean;
  evidenceLog: boolean;
}

export interface BackupFile {
  dataType: 'fullBackup';
  appData: AppData;
  files: { [id: string]: string };
}

// ================================================
// --- TYPES COPIED FROM EXAM ANALYSIS APP ---
// ================================================

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
// *** RENAMED from 'Student' to 'ExamStudent' to avoid conflict ***
export interface ExamStudent {
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
  studentId: string; // Links to ExamStudent.id
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
  results: RapidTestResult[]; // Array of results;
  tags?: string[];
}

// --- App Mode ---
export type AppMode = 'exam' | 'rapidTest';

// --- Exam Type ---
export interface Exam {
  id: string;
  name: string;
  questions: Question[];
  students: ExamStudent[]; // *** UPDATED to use ExamStudent ***
  selectedSyllabus: string;
  structureLocked: boolean;
}