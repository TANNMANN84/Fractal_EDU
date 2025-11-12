import React, { useState, useMemo, useEffect, useRef } from 'react'; // Import useEffect and useRef
import { produce } from 'immer';
import { useAppContext } from '../contexts/AppContext';
import { Student, Exam, ExamStudent, RapidTest, RapidTestResult } from '../types';

interface LinkAnalysisDataModalProps {
  student: Student; // The main profiler student
  onClose: () => void;
}

const LinkAnalysisDataModal: React.FC<LinkAnalysisDataModalProps> = ({ student, onClose }) => {
  const { data, saveData } = useAppContext();
  const [linkType, setLinkType] = useState<'exam' | 'test'>('exam');
  
  // --- [NEW] ---
  const dialogRef = useRef<HTMLDialogElement>(null);
  // --- [END NEW] ---

  // State for exam linking
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExamStudentId, setSelectedExamStudentId] = useState('');

  // State for rapid test linking
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedTestStudentId, setSelectedTestStudentId] = useState('');

  // --- [NEW] Use useEffect to open/close the modal correctly ---
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.showModal(); // This opens it in the "top layer"
      
      // Handle closing via the 'Escape' key
      const handleClose = () => {
        onClose();
      };
      dialog.addEventListener('close', handleClose);
      
      // Cleanup
      return () => {
        dialog.removeEventListener('close', handleClose);
        if (dialog.open) {
          dialog.close();
        }
      };
    }
  }, [onClose]);

  const handleClose = () => {
    dialogRef.current?.close(); // This will trigger the 'close' event listener
  };
  // --- [END NEW] ---


  // --- Memoized calculations to find unlinked data ---
  
  const unlinkedExams = useMemo(() => {
    if (!data) return [];
    const linkedExamIds = Object.keys(student.analysisResults?.examResponses || {});
    return data.examAnalysis.exams.filter(exam => !linkedExamIds.includes(exam.id));
  }, [data, student]);

  const studentsInSelectedExam = useMemo(() => {
    if (!data || !selectedExamId) return [];
    const exam = data.examAnalysis.exams.find(e => e.id === selectedExamId);
    return exam?.students || [];
  }, [data, selectedExamId]);

  const unlinkedTests = useMemo(() => {
    if (!data) return [];
    const linkedTestIds = Object.keys(student.analysisResults?.rapidTestResults || {});
    return data.examAnalysis.rapidTests.filter(test => !linkedTestIds.includes(test.id));
  }, [data, student]);

  const studentsInSelectedTest = useMemo(() => {
    if (!data || !selectedTestId) return [];
    const test = data.examAnalysis.rapidTests.find(t => t.id === selectedTestId);
    if (!test) return [];
    
    const studentIdsInResults = new Set(test.results.map(r => r.studentId));
    
    return data.examAnalysis.rapidTestStudents.filter(s => studentIdsInResults.has(s.id));
  }, [data, selectedTestId]);

  // --- Logic to handle the data "pull" ---

  const handleLinkExamData = () => {
    if (!data || !selectedExamId || !selectedExamStudentId) return;

    const selectedExam = data.examAnalysis.exams.find(e => e.id === selectedExamId);
    const selectedExamStudent = selectedExam?.students.find(s => s.id === selectedExamStudentId);

    if (!selectedExam || !selectedExamStudent) {
      alert("Error: Could not find selected exam or student.");
      return;
    }

    const nextData = produce(data, draft => {
      const masterStudent = draft.students.find(s => s.studentId === student.studentId);
      if (masterStudent) {
        if (!masterStudent.analysisResults) {
          masterStudent.analysisResults = { examResponses: {}, rapidTestResults: {} };
        }
        masterStudent.analysisResults.examResponses[selectedExam.id] = {
          examName: selectedExam.name,
          responses: selectedExamStudent.responses,
          mcqResponses: selectedExamStudent.mcqResponses
        };
      }
    });

    saveData(nextData);
    alert(`Linked ${selectedExam.name} data for ${selectedExamStudent.firstName} to ${student.firstName}.`);
    handleClose(); // Use the new close handler
  };

  const handleLinkTestData = () => {
    if (!data || !selectedTestId || !selectedTestStudentId) return;

    const selectedTest = data.examAnalysis.rapidTests.find(t => t.id === selectedTestId);
    if (!selectedTest) {
      alert("Error: Could not find selected test.");
      return;
    }

    const studentResults = selectedTest.results.filter(r => r.studentId === selectedTestStudentId);
    const preTestResult = studentResults.find(r => r.type === 'pre');
    const postTestResult = studentResults.find(r => r.type === 'post');

    const nextData = produce(data, draft => {
      const masterStudent = draft.students.find(s => s.studentId === student.studentId);
      if (masterStudent) {
        if (!masterStudent.analysisResults) {
          masterStudent.analysisResults = { examResponses: {}, rapidTestResults: {} };
        }
        masterStudent.analysisResults.rapidTestResults[selectedTest.id] = {
          testName: selectedTest.name,
          pre: preTestResult?.responses,
          post: postTestResult?.responses,
        };
      }
    });

    saveData(nextData);
    alert(`Linked ${selectedTest.name} data to ${student.firstName}.`);
    handleClose(); // Use the new close handler
  };

  return (
    // --- [MODIFIED] Swapped 'open' for 'ref' and removed 'onClose' ---
    <dialog ref={dialogRef} className="p-0 rounded-lg shadow-xl w-11/12 max-w-lg backdrop:bg-black backdrop:opacity-50 border border-gray-300 dark:border-gray-700">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">
            Link Analysis Data to {student.firstName}
          </h2>
          {/* --- [MODIFIED] This button now calls handleClose --- */}
          <button onClick={handleClose} className="text-2xl font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 leading-none">&times;</button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select data type to link:</label>
          <select 
            value={linkType} 
            onChange={(e) => setLinkType(e.target.value as 'exam' | 'test')}
            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm"
          >
            <option value="exam">Exam Analysis</option>
            <option value="test">Rapid Pre/Post Test</option>
          </select>
        </div>

        {linkType === 'exam' ? (
          /* --- Exam Linker --- */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">1. Select Unlinked Exam</label>
              <select 
                value={selectedExamId} 
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  setSelectedExamStudentId(''); // Reset student choice
                }}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm"
              >
                <option value="">-- Choose an exam --</option>
                {unlinkedExams.map(exam => (
                  <option key={exam.id} value={exam.id}>{exam.name}</option>
                ))}
              </select>
            </div>

            {selectedExamId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  2. Match Student from "{unlinkedExams.find(e=>e.id === selectedExamId)?.name}"
                </label>
                <select 
                  value={selectedExamStudentId} 
                  onChange={(e) => setSelectedExamStudentId(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm"
                >
                  <option value="">-- Choose a student to link --</option>
                  {studentsInSelectedExam.map(examStudent => (
                    <option key={examStudent.id} value={examStudent.id}>
                      {examStudent.firstName} {examStudent.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <button 
              onClick={handleLinkExamData}
              disabled={!selectedExamId || !selectedExamStudentId}
              className="w-full bg-green-600 text-white p-2 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Link
            </button>
          </div>
        ) : (
          /* --- Rapid Test Linker --- */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">1. Select Unlinked Test</label>
              <select 
                value={selectedTestId} 
                onChange={(e) => {
                  setSelectedTestId(e.target.value);
                  setSelectedTestStudentId(''); // Reset student choice
                }}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm"
              >
                <option value="">-- Choose a test --</option>
                {unlinkedTests.map(test => (
                  <option key={test.id} value={test.id}>{test.name}</option>
                ))}
              </select>
            </div>

            {selectedTestId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  2. Match Student from "{unlinkedTests.find(t=>t.id === selectedTestId)?.name}"
                </label>
                <select 
                  value={selectedTestStudentId} 
                  onChange={(e) => setSelectedTestStudentId(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm"
                >
                  <option value="">-- Choose a student to link --</option>
                  {studentsInSelectedTest.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <button 
              onClick={handleLinkTestData}
              disabled={!selectedTestId || !selectedTestStudentId}
              className="w-full bg-green-600 text-white p-2 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Link
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
};

export default LinkAnalysisDataModal;