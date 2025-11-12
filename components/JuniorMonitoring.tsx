import React, { useState, useEffect } from 'react';
import type { MonitoringDoc, Term, FileUpload, ConcernEntry, Student, ClassData, TermSignOff } from '../types';
import MonitoringFileUpload from './MonitoringFileUpload';
import SignOffModal from './SignOffModal';
import { useAppContext } from '../contexts/AppContext';
import AddConcernModal from './AddConcernModal';
import ExportReviewModal from './ExportReviewModal';
import { storageService } from '../services/storageService';


interface JuniorMonitoringProps {
    monitoringDoc: MonitoringDoc;
    onSave: (updatedDoc: MonitoringDoc, silent?: boolean) => void;
    students: Student[];
    className: string;
    classData: ClassData;
}

type AssessmentField = 'assessmentTask1' | 'assessmentTask2' | 'assessmentTask3' | 'prePostDiagnostic';

const TermPill: React.FC<{ term: Term; activeTerm: Term; onClick: (term: Term) => void }> = ({ term, activeTerm, onClick }) => (
    <button
        onClick={() => onClick(term)}
        className={`px-4 py-2 font-semibold text-sm rounded-md transition-all duration-200 ${ 
            activeTerm === term ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300/70 dark:hover:bg-gray-600/70'
        }`}
    >
        Term {term}
    </button>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2 mb-4">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const JuniorMonitoring: React.FC<JuniorMonitoringProps> = ({ monitoringDoc, onSave, students, className, classData }) => {
    const { data } = useAppContext();
    const [doc, setDoc] = useState<MonitoringDoc>(monitoringDoc);
    const [activeTerm, setActiveTerm] = useState<Term>('1');
    const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
    const [signerRole, setSignerRole] = useState<'teacher' | 'headTeacher' | null>(null);
    const [isAddConcernModalOpen, setIsAddConcernModalOpen] = useState(false);
    const [isExportReviewModalOpen, setIsExportReviewModalOpen] = useState(false);

    useEffect(() => {
        setDoc(monitoringDoc);
    }, [monitoringDoc]);

    const handleDocChange = (path: string, value: any) => {
        setDoc(prev => {
            const keys = path.split('.');
            let currentLevel = { ...prev } as any;
            let finalLevel: any = currentLevel;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (Array.isArray(finalLevel[key])) {
                    finalLevel = finalLevel[key] = [...finalLevel[key]];
                } else {
                    finalLevel = finalLevel[key] = { ...finalLevel[key] };
                }
            }
            finalLevel[keys[keys.length - 1]] = value;
            return currentLevel;
        });
    };

    const handleFileUpload = (path: string, file: FileUpload) => handleDocChange(path, file);
    const handleFileRemove = (path: string) => handleDocChange(path, null);
    
    const handleMultiFileUpload = (path: string, file: FileUpload) => {
        const pathParts = path.split('.');
        const section = pathParts[0] as 'teachingPrograms' | 'illnessMisadventure' | 'malpractice';
        const term = pathParts[1] as Term;
        const currentFiles = doc[section][term] || [];
        handleDocChange(path, [...currentFiles, file]);
    };
    
    const handleMultiFileRemove = (path: string, index: number) => {
        const pathParts = path.split('.');
        const section = pathParts[0] as 'teachingPrograms' | 'illnessMisadventure' | 'malpractice';
        const term = pathParts[1] as Term;

        const currentFiles = (doc[section] as any)[term] || [];
        const updatedFiles = currentFiles.filter((_: any, i: number) => i !== index);
        handleDocChange(path, updatedFiles);
    };
    
    const handleAssessmentFileUpload = (field: AssessmentField, file: FileUpload) => {
        const currentFiles = doc[field] || [];
        handleDocChange(field, [...currentFiles, file]);
    };

    const handleAssessmentFileRemove = (field: AssessmentField, index: number) => {
        const currentFiles = doc[field] || [];
        const updatedFiles = currentFiles.filter((_, i) => i !== index);
        handleDocChange(field, updatedFiles);
    };


    const handleAddConcern = (newConcern: Omit<ConcernEntry, 'id'>) => {
        const newEntry = { ...newConcern, id: `concern-${crypto.randomUUID()}`};
        const currentConcerns = doc.studentsCausingConcern[activeTerm] || [];
        handleDocChange(`studentsCausingConcern.${activeTerm}`, [...currentConcerns, newEntry]);
    };
    
    const handleRemoveConcern = (concernId: string) => {
        const currentConcerns = doc.studentsCausingConcern[activeTerm] || [];
        const updatedConcerns = currentConcerns.filter(c => c.id !== concernId);
        handleDocChange(`studentsCausingConcern.${activeTerm}`, updatedConcerns);
    };

    const handleSignOff = (signerName: string, signatureImage?: string) => {
        if (!signerRole) return;
        
        const newSignOff: TermSignOff = {
            teacherName: signerName,
            date: new Date().toISOString(),
            signatureImage: signatureImage,
        };

        const path = signerRole === 'teacher' ? `teacherSignOff.${activeTerm}` : `headTeacherSignOff.${activeTerm}`;
        handleDocChange(path, newSignOff);
        setIsSignOffModalOpen(false);
        setSignerRole(null);
    };

    const handleExportForReview = () => {
        onSave(doc, true); // Silently save before exporting
        setIsExportReviewModalOpen(true);
    };

    const teacherSignOff = doc.teacherSignOff[activeTerm];
    const headTeacherSignOff = doc.headTeacherSignOff[activeTerm];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex-wrap gap-4">
                <div>
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Junior Monitoring: {className}</h2>
                     <p className="text-gray-600 dark:text-gray-400">Complete all required monitoring tasks for this class.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onSave(doc)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold transition-colors">Save Changes</button>
                    <button onClick={handleExportForReview} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 font-semibold transition-colors">Export for Review</button>
                </div>
            </div>

            <Section title="1. Syllabus Implementation & Reporting">
                 <MonitoringFileUpload label="Scope and Sequence" file={doc.scopeAndSequence} onUpload={(file) => handleFileUpload('scopeAndSequence', file)} onRemove={() => handleFileRemove('scopeAndSequence')} />
                 <div className="flex items-center">
                    <input type="checkbox" id="certifySyllabus" checked={doc.certifySyllabus} onChange={e => handleDocChange('certifySyllabus', e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:bg-gray-900 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="certifySyllabus" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">I certify that all syllabus outcomes have been taught.</label>
                </div>
                 <div className="border-t dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Term-based Documents</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {(['1', '2', '3', '4'] as Term[]).map(t => <TermPill key={t} term={t} activeTerm={activeTerm} onClick={setActiveTerm} />)}
                    </div>
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-md">
                        <MonitoringFileUpload label={`Term ${activeTerm} Teaching Program(s)`} file={null} onUpload={(file) => handleMultiFileUpload(`teachingPrograms.${activeTerm}`, file)} onRemove={() => {}} />
                        {doc.teachingPrograms[activeTerm]?.map((f, i) => <div key={i} className="flex items-center justify-between text-sm ml-4"><button onClick={() => storageService.triggerDownload(f)} className="text-blue-600 dark:text-blue-400 hover:underline">{f.name}</button><button onClick={() => handleMultiFileRemove(`teachingPrograms.${activeTerm}`, i)} className="text-red-500 hover:text-red-700 font-bold">&times;</button></div>)}
                        
                        {(activeTerm === '2' || activeTerm === '4') && (
                            <MonitoringFileUpload label={`Term ${activeTerm} Semester Report`} file={doc.semesterReports[activeTerm]} onUpload={(file) => handleFileUpload(`semesterReports.${activeTerm}`, file)} onRemove={() => handleFileRemove(`semesterReports.${activeTerm}`)} />
                        )}
                    </div>
                 </div>
            </Section>

            <Section title="2. Assessment Documents">
                <MonitoringFileUpload label="Assessment Schedule" file={doc.assessmentSchedule} onUpload={(file) => handleFileUpload('assessmentSchedule', file)} onRemove={() => handleFileRemove('assessmentSchedule')} />
                
                <div>
                    <MonitoringFileUpload label="Assessment Task 1" file={null} onUpload={(file) => handleAssessmentFileUpload('assessmentTask1', file)} onRemove={() => {}} />
                    {doc.assessmentTask1?.map((f, i) => <div key={i} className="flex items-center justify-between text-sm ml-4 mt-1 bg-gray-50 dark:bg-gray-700/50 p-1 rounded"><button onClick={() => storageService.triggerDownload(f)} className="text-blue-600 dark:text-blue-400 hover:underline">{f.name}</button><button onClick={() => handleAssessmentFileRemove('assessmentTask1', i)} className="text-red-500 hover:text-red-700 font-bold">&times;</button></div>)}
                </div>
                <div>
                    <MonitoringFileUpload label="Assessment Task 2" file={null} onUpload={(file) => handleAssessmentFileUpload('assessmentTask2', file)} onRemove={() => {}} />
                    {doc.assessmentTask2?.map((f, i) => <div key={i} className="flex items-center justify-between text-sm ml-4 mt-1 bg-gray-50 dark:bg-gray-700/50 p-1 rounded"><button onClick={() => storageService.triggerDownload(f)} className="text-blue-600 dark:text-blue-400 hover:underline">{f.name}</button><button onClick={() => handleAssessmentFileRemove('assessmentTask2', i)} className="text-red-500 hover:text-red-700 font-bold">&times;</button></div>)}
                </div>
                 <div>
                    <MonitoringFileUpload label="Assessment Task 3" file={null} onUpload={(file) => handleAssessmentFileUpload('assessmentTask3', file)} onRemove={() => {}} />
                    {doc.assessmentTask3?.map((f, i) => <div key={i} className="flex items-center justify-between text-sm ml-4 mt-1 bg-gray-50 dark:bg-gray-700/50 p-1 rounded"><button onClick={() => storageService.triggerDownload(f)} className="text-blue-600 dark:text-blue-400 hover:underline">{f.name}</button><button onClick={() => handleAssessmentFileRemove('assessmentTask3', i)} className="text-red-500 hover:text-red-700 font-bold">&times;</button></div>)}
                </div>
                 <div>
                    <MonitoringFileUpload label="Pre/Post-Diagnostic Task Evidence" file={null} onUpload={(file) => handleAssessmentFileUpload('prePostDiagnostic', file)} onRemove={() => {}} />
                    {doc.prePostDiagnostic?.map((f, i) => <div key={i} className="flex items-center justify-between text-sm ml-4 mt-1 bg-gray-50 dark:bg-gray-700/50 p-1 rounded"><button onClick={() => storageService.triggerDownload(f)} className="text-blue-600 dark:text-blue-400 hover:underline">{f.name}</button><button onClick={() => handleAssessmentFileRemove('prePostDiagnostic', i)} className="text-red-500 hover:text-red-700 font-bold">&times;</button></div>)}
                </div>
            </Section>

            <Section title="3. Student Performance & Achievement">
                 <div className="border-t dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Term-based Documents</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {(['1', '2', '3', '4'] as Term[]).map(t => <TermPill key={t} term={t} activeTerm={activeTerm} onClick={setActiveTerm} />)}
                    </div>
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-md">
                         <MonitoringFileUpload label={`Term ${activeTerm} Marks and Ranks`} file={doc.marksAndRanks[activeTerm]} onUpload={(file) => handleFileUpload(`marksAndRanks.${activeTerm}`, file)} onRemove={() => handleFileRemove(`marksAndRanks.${activeTerm}`)} />
                         <div className="flex items-center">
                            <input type="checkbox" id="specificLearningNeeds" checked={doc.specificLearningNeeds[activeTerm]} onChange={e => handleDocChange(`specificLearningNeeds.${activeTerm}`, e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:bg-gray-900 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                            <label htmlFor="specificLearningNeeds" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Specific learning needs of students have been addressed this term.</label>
                        </div>
                    </div>
                 </div>
            </Section>

            <Section title="4. Records of Communication">
                 <div className="border-t dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Term-based Documents</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {(['1', '2', '3', '4'] as Term[]).map(t => <TermPill key={t} term={t} activeTerm={activeTerm} onClick={setActiveTerm} />)}
                    </div>
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-md">
                         <div>
                            <h5 className="font-medium text-gray-800 dark:text-gray-300">Parent/Carer Communication</h5>
                            <button onClick={() => setIsAddConcernModalOpen(true)} className="text-sm bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 mt-1">Log Communication</button>
                            <div className="mt-2 space-y-1">
                                {doc.studentsCausingConcern[activeTerm].map(concern => (
                                    <div key={concern.id} className="flex justify-between items-center text-sm p-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded">
                                        <button onClick={() => storageService.triggerDownload(concern.file)} className="text-blue-600 dark:text-blue-400 hover:underline">{concern.file.name}</button>
                                        <button onClick={() => handleRemoveConcern(concern.id)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h5 className="font-medium text-gray-800 dark:text-gray-300">Illness/Misadventure</h5>
                             <MonitoringFileUpload label="" file={null} onUpload={(file) => handleMultiFileUpload(`illnessMisadventure.${activeTerm}`, file)} onRemove={() => {}} />
                             {doc.illnessMisadventure[activeTerm]?.map((f, i) => <div key={i} className="flex items-center justify-between text-sm ml-4"><button onClick={() => storageService.triggerDownload(f)} className="text-blue-600 dark:text-blue-400 hover:underline">{f.name}</button><button onClick={() => handleMultiFileRemove(`illnessMisadventure.${activeTerm}`, i)} className="text-red-500 hover:text-red-700 font-bold">&times;</button></div>)}
                        </div>
                         <div>
                            <h5 className="font-medium text-gray-800 dark:text-gray-300">Malpractice</h5>
                            <MonitoringFileUpload label="" file={null} onUpload={(file) => handleMultiFileUpload(`malpractice.${activeTerm}`, file)} onRemove={() => {}} />
                            {doc.malpractice[activeTerm]?.map((f, i) => <div key={i} className="flex items-center justify-between text-sm ml-4"><button onClick={() => storageService.triggerDownload(f)} className="text-blue-600 dark:text-blue-400 hover:underline">{f.name}</button><button onClick={() => handleMultiFileRemove(`malpractice.${activeTerm}`, i)} className="text-red-500 hover:text-red-700 font-bold">&times;</button></div>)}
                        </div>
                    </div>
                 </div>
            </Section>
            
            <Section title="5. Sign Off">
                <p className="text-sm text-gray-600 dark:text-gray-400">Please complete and sign off for the relevant term.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {(['1', '2', '3', '4'] as Term[]).map(t => <TermPill key={t} term={t} activeTerm={activeTerm} onClick={setActiveTerm} />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-md">
                    <div className="text-center">
                        <h4 className="font-semibold dark:text-gray-300">Teacher Sign Off</h4>
                        {teacherSignOff?.date ? (
                             <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 rounded text-sm text-center">
                                {'signatureImage' in teacherSignOff && teacherSignOff.signatureImage ? (
                                    <img src={teacherSignOff.signatureImage} alt="Signature" className="mx-auto h-16 w-auto" />
                                ) : (
                                    <p className="font-caveat text-3xl text-gray-800 dark:text-gray-200">{teacherSignOff.teacherName}</p>
                                )}
                                <p className="text-xs text-gray-600 dark:text-gray-400">Signed by {teacherSignOff.teacherName} on {new Date(teacherSignOff.date).toLocaleDateString()}</p>
                            </div>
                        ) : (
                            <button onClick={() => { setSignerRole('teacher'); setIsSignOffModalOpen(true); }} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold">Sign as Teacher</button>
                        )}
                    </div>
                    <div className="text-center">
                        <h4 className="font-semibold dark:text-gray-300">Head Teacher Sign Off</h4>
                        {headTeacherSignOff?.date ? (
                             <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 rounded text-sm text-center">
                                {'signatureImage' in headTeacherSignOff && headTeacherSignOff.signatureImage ? (
                                    <img src={headTeacherSignOff.signatureImage} alt="Signature" className="mx-auto h-16 w-auto" />
                                ) : (
                                    <p className="font-caveat text-3xl text-gray-800 dark:text-gray-200">{headTeacherSignOff.teacherName}</p>
                                )}
                                <p className="text-xs text-gray-600 dark:text-gray-400">Signed by {headTeacherSignOff.teacherName} on {new Date(headTeacherSignOff.date).toLocaleDateString()}</p>
                            </div>
                        ) : (
                            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-300">Awaiting Signature</div>
                        )}
                    </div>
                </div>
                 <div className="flex justify-center mt-4">
                    <button onClick={handleExportForReview} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 font-semibold transition-colors">Export for Review</button>
                </div>
            </Section>

            {isSignOffModalOpen && (
                <SignOffModal 
                    isOpen={isSignOffModalOpen}
                    onClose={() => setIsSignOffModalOpen(false)}
                    onConfirm={handleSignOff}
                    signerName={signerRole === 'teacher' ? (data?.teacherProfile?.name || 'Teacher') : 'Head Teacher'}
                    existingSignOff={signerRole === 'teacher' ? teacherSignOff : headTeacherSignOff}
                />
            )}
            
            {isAddConcernModalOpen && (
                <AddConcernModal 
                    isOpen={isAddConcernModalOpen}
                    onClose={() => setIsAddConcernModalOpen(false)}
                    onSave={handleAddConcern}
                    students={students}
                />
            )}
            {isExportReviewModalOpen && (
                <ExportReviewModal
                    isOpen={isExportReviewModalOpen}
                    onClose={() => setIsExportReviewModalOpen(false)}
                    monitoringDoc={doc}
                    classData={classData}
                    students={students}
                />
            )}

        </div>
    );
};

export default JuniorMonitoring;
