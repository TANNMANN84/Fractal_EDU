import React, { useRef, useState } from 'react';
import { produce } from 'immer';
import { useAppContext } from '../../../contexts/AppContext';
// Import both Exam and ExamStudent types
import { Exam, ExamStudent } from '../../../types'; 
// Import the default state from your main constants file
import { DEFAULT_APP_DATA } from '../../../constants';

// --- THIS IS THE NEW HELPER FUNCTION TO FIX THE IMPORT ---
// This function cleans the old student data to match the new 'ExamStudent' type
const sanitizeImportedStudents = (students: any[]): ExamStudent[] => {
  if (!Array.isArray(students)) {
    return [];
  }
  return students.map((student: any) => {
    // Ensure all properties of ExamStudent exist
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
// --- END OF NEW HELPER FUNCTION ---

const SessionManager: React.FC = () => {
    const { data, saveData } = useAppContext();
    const templateImportRef = useRef<HTMLInputElement>(null);
    const sharedAnalysisImportRef = useRef<HTMLInputElement>(null);
    const [confirmReset, setConfirmReset] = useState(false);

    // handleSaveToCloud and handleLoadFromCloud have been removed
    // as this is now handled by the main ManagementConsole

    const handleExportExamTemplate = () => {
        const activeExam = data?.examAnalysis.activeExamId ? data.examAnalysis.exams.find(e => e.id === data.examAnalysis.activeExamId) : null;
        if (!activeExam) { alert("Please select an exam first."); return; }
        const examTemplate = {
            questions: activeExam.questions,
            selectedSyllabus: activeExam.selectedSyllabus,
        };
        const defaultFileName = `exam-template-${new Date().toISOString().slice(0, 10)}.json`;
        const fileName = window.prompt('Enter a filename for the exam template:', defaultFileName);

        if (!fileName) {
            return;
        }

        const jsonString = JSON.stringify(examTemplate, null, 2);
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

    const handleImportExamTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedState = JSON.parse(e.target?.result as string);
                if ('questions' in importedState && 'selectedSyllabus' in importedState) {
                    const newExam: Exam = {
                        id: crypto.randomUUID(),
                        name: file.name.replace(/\.json$/i, '') || 'Imported Template',
                        questions: importedState.questions,
                        selectedSyllabus: importedState.selectedSyllabus,
                        students: [],
                        structureLocked: false,
                    };
                    if (data) {
                        const nextData = produce(data, draft => {
                            draft.examAnalysis.exams.push(newExam);
                            draft.examAnalysis.activeExamId = newExam.id;
                            draft.examAnalysis.appMode = 'exam';
                        });
                        saveData(nextData);
                    }
                    alert("Exam structure imported successfully.");
                } else {
                    throw new Error("Invalid exam template file format.");
                }
            } catch (error) {
                console.error('Error importing file:', error);
                alert("Failed to import exam template. Make sure it's a valid template file.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    const handleExportSharedAnalysis = () => {
        const activeExam = data?.examAnalysis.activeExamId ? data.examAnalysis.exams.find(e => e.id === data.examAnalysis.activeExamId) : null;
        if (!activeExam) { alert("Please select an exam to share."); return; }
        const sharedData = {
            name: activeExam.name,
            questions: activeExam.questions,
            selectedSyllabus: activeExam.selectedSyllabus,
            students: activeExam.students,
        };
        const defaultFileName = `shared-analysis-${new Date().toISOString().slice(0, 10)}.json`;
        const fileName = window.prompt('Enter a filename for the shared analysis:', defaultFileName);

        if (!fileName) {
            return;
        }

        const jsonString = JSON.stringify(sharedData, null, 2);
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
    
    // --- THIS FUNCTION HAS BEEN UPDATED ---
    const handleImportSharedAnalysis = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target?.result as string);
                if ('questions' in importedData && 'selectedSyllabus' in importedData && 'students' in importedData) {
                    
                    // --- APPLYING THE FIX ---
                    const sanitizedStudents = sanitizeImportedStudents(importedData.students);

                    const newExam: Exam = {
                        id: crypto.randomUUID(),
                        name: importedData.name || file.name.replace(/\.json$/i, '') || 'Imported Analysis',
                        questions: importedData.questions,
                        selectedSyllabus: importedData.selectedSyllabus,
                        students: sanitizedStudents, // Use the sanitized students
                        structureLocked: true, // Shared analysis is always locked
                    };
                    if (data) {
                        const nextData = produce(data, draft => {
                            draft.examAnalysis.exams.push(newExam);
                            draft.examAnalysis.activeExamId = newExam.id;
                            draft.examAnalysis.appMode = 'exam';
                        });
                        saveData(nextData);
                    }
                    alert("Shared analysis imported successfully.");
                } else {
                    throw new Error("Invalid shared analysis file format.");
                }
            } catch (error) { alert("Failed to import shared analysis file."); }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleReset = () => {
        if (confirmReset) {
            if (data) {
                const nextData = produce(data, draft => {
                    // This now correctly resets *only* the examAnalysis slice of your state
                    draft.examAnalysis = DEFAULT_APP_DATA.examAnalysis;
                });
                saveData(nextData);
                setConfirmReset(false);
            }
        } else {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 3000);
        }
    };

    return (
        <details className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md mb-8 open:ring-1 open:ring-indigo-500/50 dark:open:ring-white/10 open:shadow-lg transition-all print:hidden">
            <summary className="p-4 cursor-pointer text-lg font-semibold text-gray-900 dark:text-white">
                Exam/Test Management
            </summary>
            <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    
                    {/* Save/Load buttons removed - they are now in the main profiler */}

                    {data?.examAnalysis.appMode === 'exam' && (
                        <>
                            <button onClick={handleExportExamTemplate} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600" title="Export the current exam structure (questions and syllabus) to a shareable file.">Export Exam Template</button>
                            <button onClick={() => templateImportRef.current?.click()} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer" title="Import an exam structure from a file. This will not affect your student data.">
                                Import Exam Template
                            </button>
                            <input type="file" ref={templateImportRef} className="hidden" accept=".json" onChange={handleImportExamTemplate} />

                            <button onClick={handleExportSharedAnalysis} className="px-3 py-1.5 text-sm font-medium rounded-md text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-800 hover:bg-teal-200 dark:hover:bg-teal-700" title="Export the current exam and all its student results to a single file for sharing.">Share Analysis</button>
                            <button onClick={() => sharedAnalysisImportRef.current?.click()} className="px-3 py-1.5 text-sm font-medium rounded-md text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-800 hover:bg-teal-200 dark:hover:bg-teal-700 cursor-pointer" title="Load a shared analysis file. This will replace the current exam and its students.">
                                Load Shared Analysis
                            </button>
                            <input type="file" ref={sharedAnalysisImportRef} className="hidden" accept=".json" onChange={handleImportSharedAnalysis} />
                        </>
                    )}
                    <button onClick={handleReset} className={`px-3 py-1.5 text-sm font-medium rounded-md text-white transition-colors ${confirmReset ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-600 hover:bg-red-700'}`} title="Clear all data for this module and start over">
                        {confirmReset ? 'Confirm Reset?' : `Reset ${data?.examAnalysis.appMode === 'exam' ? 'Exam' : 'Test'} Data`}
                    </button>
                </div>
            </div>
        </details>
    );
};

export default SessionManager;