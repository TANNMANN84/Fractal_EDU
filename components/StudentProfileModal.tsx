import React, { useState, useEffect, useRef } from 'react';
// FIX: Corrected import paths to be relative.
import type { Student, EvidenceLogEntry } from '../types';
import { useAppContext } from '../contexts/AppContext';
import EditStudentModal from './EditStudentModal';
import AddEvidenceModal from './AddEvidenceModal';
// --- [NEW] ---
// We will create this component in the next step
import LinkAnalysisDataModal from './LinkAnalysisDataModal'; 
// --- [END NEW] ---

interface StudentProfileModalProps {
  student: Student;
  onClose: () => void;
}

const DetailItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{value || 'N/A'}</dd>
    </div>
);

const NaplanBandBadge: React.FC<{ band: string }> = ({ band }) => {
    let colorClasses = 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'; // Default for "Not Assessed"
    switch (band) {
        case 'Exceeding':
            colorClasses = 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
            break;
        case 'Strong':
            colorClasses = 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300';
            break;
        case 'Developing':
            colorClasses = 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
            break;
        case 'Needs additional support':
            colorClasses = 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300';
            break;
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
            {band}
        </span>
    );
};


const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose }) => {
  const { data, saveData } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  // --- [NEW] ---
  const [isLinkingData, setIsLinkingData] = useState(false);
  // --- [END NEW] ---
  const dialogRef = useRef<HTMLDialogElement>(null);

  const currentStudentState = data?.students.find(s => s.studentId === student.studentId) || student;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleSaveStudent = (updatedStudent: Student) => {
    if (!data) return;
    const updatedStudents = data.students.map(s => s.studentId === student.studentId ? updatedStudent : s);
    saveData({ ...data, students: updatedStudents });
    setIsEditing(false); // Close edit modal if it was open
  }

  const handleSaveLog = (newLog: EvidenceLogEntry) => {
    if (!data) return;
    const updatedStudents = data.students.map(s => 
        s.studentId === student.studentId 
            ? { ...s, evidenceLog: [newLog, ...(s.evidenceLog || [])] } 
            : s
    );
    saveData({ ...data, students: updatedStudents });
    setIsAddingEvidence(false);
  };
  
  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  }

  // --- [NEW] Helper variables to make rendering linked data easier ---
  const linkedExams = currentStudentState.analysisResults?.examResponses || {};
  const linkedExamCount = Object.keys(linkedExams).length;

  const linkedTests = currentStudentState.analysisResults?.rapidTestResults || {};
  const linkedTestCount = Object.keys(linkedTests).length;
  // --- [END NEW] ---

  return (
    <>
      <dialog ref={dialogRef} onClose={onClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-4xl backdrop:bg-black backdrop:opacity-50 border border-gray-300 dark:border-gray-700">
        <div className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">{currentStudentState.firstName} {currentStudentState.lastName}</h2>
                    <button onClick={() => setIsEditing(true)} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-semibold">
                        Edit Profile
                    </button>
                    <button onClick={() => setIsAddingEvidence(true)} className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 text-sm font-semibold">
                        Quick Add Evidence
                    </button>
                </div>
                <button onClick={handleClose} className="text-2xl font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 leading-none">&times;</button>
            </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200" style={{maxHeight: '75vh', overflowY: 'auto'}}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
                        <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">Profile Details</h3>
                        <dl className="space-y-2">
                            <DetailItem label="Current Year Group" value={currentStudentState.profile.currentYearGroup} />
                            <DetailItem label="Status" value={currentStudentState.profile.status} />
                            <DetailItem label="ATSI Status" value={currentStudentState.profile.atsiStatus} />
                            <DetailItem label="Has Behaviour Plan" value={currentStudentState.wellbeing.hasBehaviourPlan ? 'Yes' : 'No'} />
                            <DetailItem label="Has Learning Plan" value={currentStudentState.wellbeing.hasLearningPlan ? 'Yes' : 'No'} />
                            <DetailItem label="HPGE Status" value={currentStudentState.hpge.status} />
                            {currentStudentState.hpge.status !== 'Not Identified' && <DetailItem label="HPGE Domain" value={currentStudentState.hpge.domain} />}
                        </dl>
                    </div>
                </div>
                <div className="space-y-4">
                     <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
                        <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">Academic Snapshot</h3>
                        {currentStudentState.academic.naplan && (
                            <>
                                <h4 className="font-medium text-md text-gray-700 dark:text-gray-300 mt-1">Year 7 NAPLAN</h4>
                                <dl className="space-y-1 pl-2 border-l mt-1">
                                    <DetailItem label="Reading" value={<NaplanBandBadge band={currentStudentState.academic.naplan.year7.reading} />} />
                                    <DetailItem label="Writing" value={<NaplanBandBadge band={currentStudentState.academic.naplan.year7.writing} />} />
                                    <DetailItem label="Numeracy" value={<NaplanBandBadge band={currentStudentState.academic.naplan.year7.numeracy} />} />
                                </dl>
                                {currentStudentState.profile.currentYearGroup >= 9 && (
                                    <>
                                        <h4 className="font-medium text-md text-gray-700 dark:text-gray-300 mt-3">Year 9 NAPLAN</h4>
                                        <dl className="space-y-1 pl-2 border-l mt-1">
                                        <DetailItem label="Reading" value={<NaplanBandBadge band={currentStudentState.academic.naplan.year9.reading} />} />
                                        <DetailItem label="Writing" value={<NaplanBandBadge band={currentStudentState.academic.naplan.year9.writing} />} />
                                        <DetailItem label="Numeracy" value={<NaplanBandBadge band={currentStudentState.academic.naplan.year9.numeracy} />} />
                                        </dl>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* --- [NEW] ANALYSIS RESULTS BLOCK --- */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Linked Analysis Results</h3>
                            <button 
                                onClick={() => setIsLinkingData(true)} 
                                className="bg-green-600 dark:bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-700 dark:hover:bg-green-600 text-sm font-semibold">
                                Link Data
                            </button>
                        </div>
                        
                        {/* List of linked exams */}
                        <h4 className="font-medium text-md text-gray-700 dark:text-gray-300 mt-1">Exams ({linkedExamCount})</h4>
                        <dl className="space-y-1 pl-2 border-l mt-1">
                            {linkedExamCount > 0 ? (
                                Object.entries(linkedExams).map(([examId, examResult]) => (
                                    <DetailItem key={examId} label={examResult.examName} value="Data Linked" />
                                ))
                            ) : (
                                <dd className="mt-1 text-sm text-gray-500 dark:text-gray-400">No exam data linked.</dd>
                            )}
                        </dl>
                        
                        {/* List of linked rapid tests */}
                        <h4 className="font-medium text-md text-gray-700 dark:text-gray-300 mt-3">Rapid Tests ({linkedTestCount})</h4>
                        <dl className="space-y-1 pl-2 border-l mt-1">
                            {linkedTestCount > 0 ? (
                                Object.entries(linkedTests).map(([testId, testResult]) => (
                                    <DetailItem key={testId} label={testResult.testName} value="Data Linked" />
                                ))
                            ) : (
                                <dd className="mt-1 text-sm text-gray-500 dark:text-gray-400">No test data linked.</dd>
                            )}
                        </dl>
                    </div>
                    {/* --- [END NEW] --- */}

                </div>
            </div>
        </div>
      </dialog>
      {isEditing && <EditStudentModal student={currentStudentState} onClose={() => setIsEditing(false)} onSave={handleSaveStudent} />}
      {isAddingEvidence && <AddEvidenceModal onClose={() => setIsAddingEvidence(false)} onSaveLog={handleSaveLog} />}
      
      {/* --- [NEW] Render the new modal --- */}
      {isLinkingData && (
        <LinkAnalysisDataModal 
            student={currentStudentState} 
            onClose={() => setIsLinkingData(false)} 
        />
      )}
      {/* --- [END NEW] --- */}
    </>
  );
};

export default StudentProfileModal;