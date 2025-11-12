import React, { useEffect, useRef } from 'react';
import type { Student, NoteEntry, WorkSample, EvidenceLogEntry } from '../types';

interface ReportOptions {
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

interface ReportViewProps {
    students: Student[];
    options: ReportOptions;
    onClose: () => void;
}

const ReportSection: React.FC<{ title: string; children: React.ReactNode; condition?: boolean }> = ({ title, children, condition = true }) => {
    if (!condition) return null;
    return (
        <div className="mt-4">
            <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-600 pb-1 mb-2">{title}</h4>
            {children}
        </div>
    );
};

const ReportView: React.FC<ReportViewProps> = ({ students, options, onClose }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    const handleClose = () => {
        dialogRef.current?.close();
        onClose();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <dialog ref={dialogRef} onClose={onClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-5xl backdrop:bg-black backdrop:opacity-50 border border-gray-300 dark:border-gray-700">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 10px; }
                    .no-print { display: none; }
                    @page { size: A4; margin: 1.5cm; }
                    .page-break { page-break-before: always; }
                    h1, h2, h3, h4, table, ul { page-break-after: avoid; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                }
            `}</style>
             <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 no-print">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">Generated Student Report</h2>
                <div className="flex items-center gap-4">
                    <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold">Print Report</button>
                    <button onClick={handleClose} className="text-2xl font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 leading-none">&times;</button>
                </div>
            </div>
            <div className="p-2 md:p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 print-area" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                {students.map((student, index) => (
                    <div key={student.studentId} className={index > 0 ? 'page-break' : ''}>
                         <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
                            <h2 className="text-2xl font-bold dark:text-white">{student.firstName} {student.lastName}</h2>
                            <p className="text-gray-600 dark:text-gray-400">Report generated on {new Date().toLocaleDateString()}</p>
                            
                            <ReportSection title="Profile Details & Plans" condition={options.profileDetails}>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                    <p><strong>Year Group:</strong> {student.profile.currentYearGroup}</p>
                                    <p><strong>ATSI Status:</strong> {student.profile.atsiStatus}</p>
                                    <p><strong>Behaviour Plan:</strong> {student.wellbeing.hasBehaviourPlan ? 'Yes' : 'No'}</p>
                                    <p><strong>Learning Plan:</strong> {student.wellbeing.hasLearningPlan ? 'Yes' : 'No'}</p>
                                    <p><strong>HPGE Status:</strong> {student.hpge.status}</p>
                                </div>
                            </ReportSection>
                            
                            <ReportSection title="At-a-Glance Wellbeing Profile" condition={options.wellbeingPlans}>
                                <div className="text-sm space-y-1 dark:text-gray-300">
                                    <p><strong>Strengths:</strong> {student.wellbeing.strengths.join(', ') || 'N/A'}</p>
                                    <p><strong>Triggers:</strong> {student.wellbeing.triggers.join(', ') || 'N/A'}</p>
                                    <p><strong>Proactive Strategies:</strong> {student.wellbeing.proactiveStrategies.join(', ') || 'N/A'}</p>
                                    <p><strong>De-escalation Strategies:</strong> {student.wellbeing.deescalationStrategies.join(', ') || 'N/A'}</p>
                                    <p><strong>Medical Needs:</strong> {student.wellbeing.medicalNeeds.join(', ') || 'N/A'}</p>
                                </div>
                            </ReportSection>
                            
                            <ReportSection title="NAPLAN Results" condition={options.academicNaplan}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="dark:text-gray-300">
                                        <h5 className="font-semibold dark:text-gray-200">Year 7</h5>
                                        <ul className="list-disc list-inside">
                                            <li>Reading: {student.academic.naplan.year7.reading}</li>
                                            <li>Writing: {student.academic.naplan.year7.writing}</li>
                                            <li>Numeracy: {student.academic.naplan.year7.numeracy}</li>
                                        </ul>
                                    </div>
                                    {student.profile.currentYearGroup >= 9 && (
                                        <div className="dark:text-gray-300">
                                            <h5 className="font-semibold dark:text-gray-200">Year 9</h5>
                                            <ul className="list-disc list-inside">
                                                <li>Reading: {student.academic.naplan.year9.reading}</li>
                                                <li>Writing: {student.academic.naplan.year9.writing}</li>
                                                <li>Numeracy: {student.academic.naplan.year9.numeracy}</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </ReportSection>
                            
                            <ReportSection title="Evidence Log" condition={options.evidenceLog}>
                                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-xs">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="border dark:border-gray-600 p-1 text-left">Date</th>
                                            <th className="border dark:border-gray-600 p-1 text-left">Note</th>
                                            <th className="border dark:border-gray-600 p-1 text-left">Adjustments</th>
                                            <th className="border dark:border-gray-600 p-1 text-left">Level</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {student.evidenceLog?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                                        <tr key={log.logId}>
                                            <td className="border dark:border-gray-600 p-1 align-top w-1/12">{new Date(log.date).toLocaleDateString('en-AU')}</td>
                                            <td className="border dark:border-gray-600 p-1 align-top w-6/12 whitespace-pre-wrap">{log.note}</td>
                                            <td className="border dark:border-gray-600 p-1 align-top w-3/12">{log.adjustments_used.join(', ')}</td>
                                            <td className="border dark:border-gray-600 p-1 align-top w-2/12">{log.adjustment_level}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {(!student.evidenceLog || student.evidenceLog.length === 0) && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No entries.</p>}
                            </ReportSection>
                             
                             {/* Note Sections */}
                             <ReportSection title="Wellbeing Notes" condition={options.wellbeingNotes && student.wellbeing.notes?.length > 0}>
                                <ul className="list-disc list-inside text-sm space-y-1 dark:text-gray-300">
                                    {student.wellbeing.notes.map(note => <li key={note.id}>{note.content} ({new Date(note.date).toLocaleDateString()})</li>)}
                                </ul>
                             </ReportSection>
                             <ReportSection title="Academic Notes" condition={options.academicNotes && student.academic.notes?.length > 0}>
                                <ul className="list-disc list-inside text-sm space-y-1 dark:text-gray-300">
                                    {student.academic.notes.map(note => <li key={note.id}>{note.content} ({new Date(note.date).toLocaleDateString()})</li>)}
                                </ul>
                             </ReportSection>
                             <ReportSection title="HPGE Notes" condition={options.hpgeNotes && student.hpge.notes?.length > 0}>
                                <ul className="list-disc list-inside text-sm space-y-1 dark:text-gray-300">
                                    {student.hpge.notes.map(note => <li key={note.id}>{note.content} ({new Date(note.date).toLocaleDateString()})</li>)}
                                </ul>
                             </ReportSection>
                         </div>
                    </div>
                ))}
            </div>
             <div className="p-4 bg-gray-100 dark:bg-gray-800 border-t dark:border-gray-700 flex justify-end no-print">
                 <button onClick={handleClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 font-semibold transition-colors">Close</button>
            </div>
        </dialog>
    );
};

export default ReportView;
