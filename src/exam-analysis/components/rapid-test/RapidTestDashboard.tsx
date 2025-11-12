import React, { useState, Suspense, lazy } from 'react';
import { produce } from 'immer';
import { useAppContext } from '../../../../contexts/AppContext';
// Import all necessary types from the root types.ts
import { RapidTest, RapidQuestion, RapidQuestionType, ExamStudent } from '../../../../types'; 
import RapidTestEditor from './RapidTestEditor';
import RapidEntryView from './RapidEntryView';
import StudentList from '../entry/StudentList';
const RapidTestAnalysis = lazy(() => import('./RapidTestAnalysis'));

// --- Helper Function to create a question based on type ---
const createRapidQuestion = (type: RapidQuestionType, defaultMarks: number): RapidQuestion => ({
  id: crypto.randomUUID(),
  prompt: '',
  type: type,
  maxMarks: defaultMarks,
  options: type === 'MCQ' ? ['A', 'B', 'C', 'D'] : undefined,
  correctAnswer: '',
  matchPairs: type === 'Matching' ? [] : undefined,
});

// --- Helper Function to generate the diagnostic template structure ---
const createDiagnosticTemplate = (): RapidTest => {
  const questions: RapidQuestion[] = [
    ...Array(5).fill(null).map(() => createRapidQuestion('Spelling', 1)),
    ...Array(3).fill(null).map(() => createRapidQuestion('Matching', 1)), 
    ...Array(2).fill(null).map(() => createRapidQuestion('Written', 2)),
    ...Array(10).fill(null).map(() => createRapidQuestion('MCQ', 1)),
    createRapidQuestion('Marks', 3),
  ];
  questions.forEach((q, index) => {
    if (q.type === 'Spelling') q.prompt = `Spelling Word ${index + 1}`;
    else if (q.type === 'Matching') {
      const matchingIndex = questions.filter(qs => qs.type === 'Matching').indexOf(q);
      q.prompt = `Matching Item ${matchingIndex + 1}`;
    } else if (q.type === 'Written') q.prompt = `Define Term for Q${index + 1}`;
    else if (q.type === 'MCQ') q.prompt = `Multiple Choice Q${index + 1}`;
    else if (q.type === 'Marks' && questions.length - 1 === index) q.prompt = `Diagram Label Score Q${index + 1}`;
    else q.prompt = `Q${index + 1} (${q.type})`;
  });
  return { id: crypto.randomUUID(), name: 'New Diagnostic Test (Template)', questions: questions, results: [], tags: [] };
};

// --- [NEW] HELPER FUNCTIONS TO SANITIZE IMPORTED DATA ---

// This sanitizes a single question from an imported file
const sanitizeRapidQuestion = (q: any): RapidQuestion => ({
  id: q.id || crypto.randomUUID(),
  prompt: q.prompt || "Untitled Question",
  type: q.type || "Marks",
  maxMarks: typeof q.maxMarks === 'number' ? q.maxMarks : 0,
  matchPairs: Array.isArray(q.matchPairs) ? q.matchPairs : (q.type === 'Matching' ? [] : undefined),
  options: Array.isArray(q.options) ? q.options : (q.type === 'MCQ' ? [] : undefined),
  correctAnswer: q.correctAnswer || (q.type === 'MCQ' ? '' : undefined),
});

// This sanitizes the entire RapidTest object from an imported file
// *** IT NOW KEEPS THE RESULTS ***
const sanitizeImportedRapidTest = (testData: any): RapidTest => {
  const sanitizedQuestions = Array.isArray(testData.questions)
    ? testData.questions.map(sanitizeRapidQuestion)
    : [];

  // This function now preserves the results array
  return {
    id: testData.id || crypto.randomUUID(),
    name: testData.name || "Imported Test",
    questions: sanitizedQuestions,
    results: Array.isArray(testData.results) ? testData.results : [], // <-- THIS IS THE FIX
    tags: Array.isArray(testData.tags) ? testData.tags : [],
  };
};

// This function cleans the old student data to match the new 'ExamStudent' type
const sanitizeImportedStudents = (students: any[]): ExamStudent[] => {
  if (!Array.isArray(students)) {
    return [];
  }
  return students.map((student: any) => {
    return {
      id: student.id || crypto.randomUUID(),
      firstName: student.firstName || "Unknown",
      lastName: student.lastName || "Student",
      className: student.className || "",
      tags: Array.isArray(student.tags) ? student.tags : [],
      responses: typeof student.responses === "object" ? student.responses : {},
      mcqResponses:
        typeof student.mcqResponses === "object" ? student.mcqResponses : {},
    };
  });
};

// --- END OF NEW HELPER FUNCTIONS ---


// --- Main Component ---
const RapidTestDashboard: React.FC = () => {
  const { data, saveData } = useAppContext();
  
  if (!data) {
    return <div>Loading...</div>;
  }
  // Ensure rapidTests exists on state, default to empty array if not
  const { rapidTests = [], rapidTestStudents = [] } = data.examAnalysis;

  const [editingTest, setEditingTest] = useState<RapidTest | null>(null);
  const [markingTestId, setMarkingTestId] = useState<string | null>(null);
  const [analysingTestId, setAnalysingTestId] = useState<string | null>(null); 

  const handleCreateNew = () => {
    const newTest: RapidTest = {
      id: crypto.randomUUID(),
      name: 'New Blank Test',
      questions: [],
      results: [],
      tags: [],
    };
    setEditingTest(newTest);
  };

  const handleCreateFromTemplate = () => {
    const templateTest = createDiagnosticTemplate();
    setEditingTest(templateTest);
  };

  const handleExportTest = (testToExport: RapidTest) => {
    const testTemplate = {
      ...testToExport,
      results: [],
    };
    const defaultFileName = `rapid-test-${testToExport.name.replace(/ /g, '_')}.json`;
    const fileName = window.prompt('Enter a filename for the test template:', defaultFileName);

    if (!fileName) {
      return;
    }

    const jsonString = JSON.stringify(testTemplate, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEdit = (test: RapidTest) => { setMarkingTestId(null); setAnalysingTestId(null); setEditingTest(test); };
  const handleDelete = (testId: string) => { 
    if (window.confirm('Delete test?')) { 
      const nextData = produce(data, draft => {
        const index = draft.examAnalysis.rapidTests.findIndex(t => t.id === testId);
        if (index > -1) {
          draft.examAnalysis.rapidTests.splice(index, 1);
        }
      });
      saveData(nextData);
      if (editingTest?.id === testId) setEditingTest(null); if (markingTestId === testId) setMarkingTestId(null); if (analysingTestId === testId) setAnalysingTestId(null); 
    } 
  };
  const handleSave = (updatedTest: RapidTest) => { 
    const nextData = produce(data, draft => {
      const index = draft.examAnalysis.rapidTests.findIndex(t => t.id === updatedTest.id);
      if (index > -1) draft.examAnalysis.rapidTests[index] = updatedTest;
      else draft.examAnalysis.rapidTests.push(updatedTest);
    });
    saveData(nextData);
    setEditingTest(null); };
  const handleCancel = () => { setEditingTest(null); }; 
  const handleStartMarking = (testId: string) => { setEditingTest(null); setAnalysingTestId(null); setMarkingTestId(testId); };
  const handleStartAnalysis = (testId: string) => { setEditingTest(null); setMarkingTestId(null); setAnalysingTestId(testId); };
  const handleBackToDashboard = () => { setMarkingTestId(null); setEditingTest(null); setAnalysingTestId(null); }; 

  // --- [MODIFIED] THIS FUNCTION IS NOW SMARTER ---
  const handleLoadTestFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text !== 'string') throw new Error('File could not be read.');
          
          const importedData = JSON.parse(text);

          // --- [NEW] Smart Import Logic ---
          // Check if this is an OLD BACKUP FILE (like fractal-edu-backup-2025-11-10.json)
          if (importedData.appMode && importedData.rapidTests && importedData.rapidTestStudents) {
            
            const sanitizedTests = importedData.rapidTests.map(sanitizeImportedRapidTest);
            const sanitizedStudents = sanitizeImportedStudents(importedData.rapidTestStudents);

            // Merge the imported data with existing data
            const nextData = produce(data, draft => {
              // Add students, avoiding duplicates
              for (const sStudent of sanitizedStudents) {
                if (!draft.examAnalysis.rapidTestStudents.find(s => s.id === sStudent.id)) {
                  draft.examAnalysis.rapidTestStudents.push(sStudent);
                }
              }
              // Add tests, avoiding duplicates
              for (const sTest of sanitizedTests) {
                if (!draft.examAnalysis.rapidTests.find(t => t.id === sTest.id)) {
                  draft.examAnalysis.rapidTests.push(sTest);
                }
              }
            });
            saveData(nextData);
            alert(`Imported ${sanitizedTests.length} tests and ${sanitizedStudents.length} students from old backup.`);

          } 
          // Check if this is a SINGLE TEST TEMPLATE
          else if (importedData.id && importedData.name && Array.isArray(importedData.questions)) {
            
            const testData = sanitizeImportedRapidTest(importedData);

            if (!rapidTests.find((t: RapidTest) => t.id === testData.id)) {
              const nextData = produce(data, draft => {
                if (!Array.isArray(draft.examAnalysis.rapidTests)) {
                    draft.examAnalysis.rapidTests = [];
                }
                draft.examAnalysis.rapidTests.push(testData);
              });
              saveData(nextData);
              alert(`Test "${testData.name}" loaded successfully!`);
            } else {
              alert(`Test "${testData.name}" (ID: ${testData.id}) is already loaded.`);
            }
          } 
          // Otherwise, it's an invalid file
          else {
            throw new Error('Invalid file structure. Not a backup or a test template.');
          }
          // --- [END] Smart Import Logic ---

        } catch (error: any) {
          console.error("Failed to load test from file:", error);
          alert(`Failed to load test file. ${error.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  // --- END OF MODIFICATION ---

  // --- Conditional Rendering Logic ---
  if (markingTestId) {
    const testToMark = rapidTests.find((t: RapidTest) => t.id === markingTestId); 
    if (!testToMark) { return ( <div className="text-red-400 p-4">Error: Test not found. <button onClick={handleBackToDashboard}>Back</button></div> ); }
    return <RapidEntryView testId={markingTestId} onBack={handleBackToDashboard} />;
  }
  if (analysingTestId) { 
    const testToAnalyse = rapidTests.find((t: RapidTest) => t.id === analysingTestId); 
    if (!testToAnalyse) { return ( <div className="text-red-400 p-4">Error: Test not. <button onClick={handleBackToDashboard}>Back</button></div> ); }
    return (
      <Suspense fallback={<div className="text-center p-8">Loading Analysis...</div>}>
        <RapidTestAnalysis test={testToAnalyse} onBack={handleBackToDashboard} />
      </Suspense>
    );
  }
  if (editingTest) {
    return ( <RapidTestEditor test={editingTest} onSave={handleSave} onCancel={handleBackToDashboard} /> );
  }

  // Render Dashboard with Student List
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-md h-fit">
            <StudentList studentList={rapidTestStudents} mode="rapidTest" isSelectable={false} />
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-md space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white"> Pre/Post Test Dashboard </h2>
                <div className="flex gap-2">
                    <button onClick={handleLoadTestFromFile} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700" > + Load Test/Backup </button>
                    <button onClick={handleCreateFromTemplate} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700" > + New Diagnostic Template </button>
                    <button onClick={handleCreateNew} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700" > + New Blank Test </button>
                </div>
            </div>

            <div className="space-y-3">
                {rapidTests.length === 0 ? ( <p className="text-gray-600 dark:text-gray-400 text-center py-4"> No Pre/Post tests created yet. </p> )
                : ( rapidTests.map((test: RapidTest) => ( 
                    <div key={test.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-wrap justify-between items-center gap-2" >
                    <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{test.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400"> {test.questions.length} Questions </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleStartMarking(test.id)} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700" title="Enter Results" > Mark </button>
                        <button onClick={() => handleStartAnalysis(test.id)} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700" title="View Growth Analysis" > Analyse </button>
                        <button onClick={() => handleExportTest(test)} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500" title="Export Test Structure">Export</button>
                        <button onClick={() => handleEdit(test)} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500" title="Edit Structure" > Edit </button>
                        <button onClick={() => handleDelete(test.id)} className="px-3 py-1.5 text-sm font-medium rounded-md text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800" title="Delete Test" > Delete </button>
                    </div>
                    </div>
                ))
                )}
            </div>
        </div>
    </div>
  );
};

export default RapidTestDashboard;