import type { AppData, MonitoringDoc, Student, TermBased, LiteracyTag, NumeracyTag, NewmansTag } from './types';

export const DEFAULT_APP_DATA: AppData = {
  students: [],
  classes: [],
  monitoringDocs: [],
  teacherProfile: null,
  examAnalysis: {
    appMode: 'exam',
    rapidTests: [],
    exams: [],
    activeExamId: null,
    rapidTestStudents: [],
    deleteMode: false,
    selectedStudentId: null,
    activeTags: [],
    rankingSort: { key: 'rank', direction: 'asc' }
  }
};

// A complete, blank student profile for creating new students.
export const BLANK_STUDENT: Omit<Student, 'studentId'> = {
    firstName: '',
    lastName: '',
    profile: {
        dob: '',
        atsiStatus: 'Not Stated',
        gender: '',
        pronouns: '',
        currentYearGroup: 7,
        status: 'Active',
    },
    academic: {
        naplan: {
            year7: { reading: 'Not Assessed', writing: 'Not Assessed', spelling: 'Not Assessed', grammar: 'Not Assessed', numeracy: 'Not Assessed' },
            year9: { reading: 'Not Assessed', writing: 'Not Assessed', spelling: 'Not Assessed', grammar: 'Not Assessed', numeracy: 'Not Assessed' },
        },
        reportGrades: [],
        notes: [],
        learningSupport: {
            isSwan: false,
            requiresLearningCentreBooking: false,
            differentiation: [],
            numeracyEvidence: [],
            literacyEvidence: [],
        },
    },
    wellbeing: {
        hasBehaviourPlan: false,
        behaviourPlanLink: '',
        hasLearningPlan: false,
        learningPlanLink: '',
        strengths: [],
        triggers: [],
        proactiveStrategies: [],
        deescalationStrategies: [],
        medicalNeeds: [],
        attendancePercent: 100,
        sentralBehaviourSummary: '',
        notes: [],
    },
    hpge: {
        status: 'Not Identified',
        domain: 'Not Applicable',
        identificationEvidence: [],
        talentDevelopmentPlan: '',
        notes: [],
    },
    evidenceLog: [],
    workSamples: [],
    
    // --- [NEW] ADDED THIS PROPERTY ---
    analysisResults: {
      examResponses: {},
      rapidTestResults: {}
    }
    // --- END OF NEW PROPERTY ---
};


// Based on AddEvidenceModal
export const NCCD_LEVELS = [
    "Quality Differentiated Teaching Practice",
    "Supplementary Adjustment",
    "Substantial Adjustment",
    "Extensive Adjustment"
];

export const ASSIST_CHECKLIST = {
    "Curriculum": ["Adjusted questioning", "Individualised instruction", "Visual aids/scaffolds"],
    "Environment": ["Preferential seating", "Quiet space access", "Sensory tools"],
    "Assessment": ["Extra time", "Scribe/reader", "Alternative format"]
};
export const EXTEND_CHECKLIST = {
    "Curriculum": ["Higher-order questioning", "Complex problem-solving tasks", "Advanced concepts"],
    "Process": ["Independent research projects", "Mentorship opportunities", "Accelerated pacing"],
    "Product": ["Sophisticated presentation formats", "Real-world audience", "Originality/innovation emphasis"]
};
export const CULTURAL_CHECKLIST = {
    "Story Sharing": ["Use of narrative", "Connecting learning to local stories"],
    "Learning Maps": ["Visualising processes", "Concept mapping"],
    "Non-verbal": ["Hands-on tasks", "Kinaesthetic learning"],
    "Symbols and Images": ["Using visuals to convey concepts", "Art-based expression"],
    "Land Links": ["Place-based learning", "Connecting to Country"],
    "Non-linear": ["Holistic learning approach", "Student-led inquiry"],
    "Deconstruct/Reconstruct": ["Scaffolding complex tasks", "Modelling and practice"],
    "Community Links": ["Involving community members", "Local context integration"]
};

// Based on EditStudentModal
export const NAPLAN_BANDS = ["Needs additional support", "Developing", "Strong", "Exceeding", "Not Assessed"];
export const ATSI_STATUSES: Array<Student['profile']['atsiStatus']> = ["No", "Yes", "Not Stated"];
export const HPGE_STATUSES = ["Not Identified", "Nominated", "Identified"];
export const HPGE_DOMAINS = ["Not Applicable", "Intellectual", "Creative", "Social-Emotional", "Physical"];
export const LITERACY_DOMAINS: LiteracyTag[] = ['Reading', 'Writing', 'Spelling', 'Grammar'];
export const NUMERACY_DOMAINS: NumeracyTag[] = ['Number', 'Algebra', 'Measurement', 'Geometry', 'Statistics', 'ProblemSolving', 'Reasoning', 'Calculating'];

export const NEWMANS_ANALYSIS_TAGS: { name: NewmansTag; color: string; hoverColor: string, textColor: string }[] = [
    { name: 'Read it', color: 'bg-blue-200', hoverColor: 'hover:bg-blue-300', textColor: 'text-blue-800' },
    { name: 'What', color: 'bg-green-200', hoverColor: 'hover:bg-green-300', textColor: 'text-green-800' },
    { name: 'How', color: 'bg-orange-200', hoverColor: 'hover:bg-orange-300', textColor: 'text-orange-800' },
    { name: 'Have a Go', color: 'bg-red-200', hoverColor: 'hover:bg-red-300', textColor: 'text-red-800' },
    { name: 'Answer it', color: 'bg-yellow-200', hoverColor: 'hover:bg-yellow-300', textColor: 'text-yellow-800' }
];



// Based on ClassView
const createEmptyTermObject = <T>(defaultValue: T): TermBased<T> => ({ '1': defaultValue, '2': defaultValue, '3': defaultValue, '4': defaultValue });

export const BLANK_MONITORING_DOC_SKELETON: Omit<MonitoringDoc, 'id' | 'classId' | 'year'> = {
    certifySyllabus: false,
    scopeAndSequence: null,
    teachingPrograms: createEmptyTermObject([]),
    semesterReports: createEmptyTermObject(null),
    assessmentSchedule: null,
    assessmentTask1: [],
    assessmentTask2: [],
    assessmentTask3: [],
    prePostDiagnostic: [],
    marksAndRanks: createEmptyTermObject(null),
    scannedWorkSamples: {
        task1: { top: null, middle: null, low: null },
        task2: { top: null, middle: null, low: null },
        task3: { top: null, middle: null, low: null },
    },
    specificLearningNeeds: createEmptyTermObject(false),
    studentsCausingConcern: createEmptyTermObject([]),
    illnessMisadventure: createEmptyTermObject([]),
    malpractice: createEmptyTermObject([]),
    teacherSignOff: createEmptyTermObject({ teacherName: '', date: null }),
    headTeacherSignOff: createEmptyTermObject({ teacherName: '', date: null }),
};
export const BLANK_SEATING_CHART = {
    rows: 5,
    seatsPerRow: 6,
    arrangement: Array(5).fill(null).map(() => Array(6).fill(null)),
};

export const DEFAULT_SEATING_PLAN_NAME = 'Default Plan';