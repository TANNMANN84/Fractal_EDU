import React, { useState, useEffect, useRef } from 'react';
import type { ReviewPackage, MonitoringDoc, ClassData, Student, Term, StudentProfilerSnapshotEntry } from '../types';
import { BLANK_MONITORING_DOC_SKELETON } from '../constants';

interface ExportReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    monitoringDoc: MonitoringDoc;
    classData: ClassData;
    students: Student[];
}

const generateProfilerSnapshot = (students: Student[]): StudentProfilerSnapshotEntry[] => {
    return students.map(student => ({
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        hasWellbeingNotes: (student.wellbeing.notes || []).length > 0,
        hasAcademicNotes: (student.academic.notes || []).length > 0,
        hasHpgeNotes: (student.hpge.notes || []).length > 0,
        hasDifferentiation: (student.academic.learningSupport.differentiation || []).length > 0,
        hasEvidenceLogs: (student.evidenceLog || []).length > 0,
        hasWorkSamples: (student.workSamples || []).length > 0,
        naplan: {
            year7: {
                reading: student.academic.naplan.year7.reading,
                writing: student.academic.naplan.year7.writing,
                numeracy: student.academic.naplan.year7.numeracy,
            },
            year9: {
                reading: student.academic.naplan.year9.reading,
                writing: student.academic.naplan.year9.writing,
                numeracy: student.academic.naplan.year9.numeracy,
            },
        },
    }));
};


const ExportReviewModal: React.FC<ExportReviewModalProps> = ({ isOpen, onClose, monitoringDoc, classData, students }) => {
    const [step, setStep] = useState(1);
    const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    const handleClose = () => {
        dialogRef.current?.close();
        setStep(1);
        setSelectedTerm(null);
        onClose();
    };

    const handleExport = () => {
        if (!selectedTerm) return;

        // Create a new, lean monitoring doc containing only the relevant term's data
        const monitoringDocForExport: MonitoringDoc = {
            ...BLANK_MONITORING_DOC_SKELETON,
            // Carry over essential IDs and annual data
            id: monitoringDoc.id,
            classId: monitoringDoc.classId,
            year: monitoringDoc.year,
            certifySyllabus: monitoringDoc.certifySyllabus,
            scopeAndSequence: monitoringDoc.scopeAndSequence,
            assessmentSchedule: monitoringDoc.assessmentSchedule,
            assessmentTask1: monitoringDoc.assessmentTask1,
            assessmentTask2: monitoringDoc.assessmentTask2,
            assessmentTask3: monitoringDoc.assessmentTask3,
            prePostDiagnostic: monitoringDoc.prePostDiagnostic,
            scannedWorkSamples: monitoringDoc.scannedWorkSamples, // Include all work samples for context
        };
        
        // Copy ONLY the selected term's data for term-based fields
        monitoringDocForExport.teachingPrograms[selectedTerm] = monitoringDoc.teachingPrograms[selectedTerm];
        monitoringDocForExport.semesterReports[selectedTerm] = monitoringDoc.semesterReports[selectedTerm];
        monitoringDocForExport.marksAndRanks[selectedTerm] = monitoringDoc.marksAndRanks[selectedTerm];
        monitoringDocForExport.specificLearningNeeds[selectedTerm] = monitoringDoc.specificLearningNeeds[selectedTerm];
        monitoringDocForExport.studentsCausingConcern[selectedTerm] = monitoringDoc.studentsCausingConcern[selectedTerm];
        monitoringDocForExport.illnessMisadventure[selectedTerm] = monitoringDoc.illnessMisadventure[selectedTerm];
        monitoringDocForExport.malpractice[selectedTerm] = monitoringDoc.malpractice[selectedTerm];
        monitoringDocForExport.teacherSignOff[selectedTerm] = monitoringDoc.teacherSignOff[selectedTerm];
        monitoringDocForExport.headTeacherSignOff[selectedTerm] = monitoringDoc.headTeacherSignOff[selectedTerm];

        // Generate the new profiler snapshot
        const profilerSnapshot = generateProfilerSnapshot(students);

        const reviewPackage: ReviewPackage = {
            dataType: 'reviewPackage',
            classData,
            monitoringDoc: monitoringDocForExport,
            students,
            profilerSnapshot, // Add the snapshot to the package
        };
        
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reviewPackage, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        const safeClassName = classData.className.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${safeClassName}_review_term_${selectedTerm}_${new Date().toISOString().split('T')[0]}.profiler-review`;
        link.click();
        handleClose();
    };
    
    const isTermSignedByTeacher = selectedTerm ? !!monitoringDoc.teacherSignOff[selectedTerm]?.date : false;

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Step 1: Select Term to Export</h3>
                        <p className="mt-2 text-sm text-gray-600">Choose the term you wish to package for head teacher review.</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {(['1', '2', '3', '4'] as Term[]).map(term => (
                                <button
                                    key={term}
                                    onClick={() => {
                                        setSelectedTerm(term);
                                        setStep(2);
                                    }}
                                    className="px-4 py-2 text-sm font-semibold rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                                >
                                    Term {term}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                     <div>
                        <h3 className="text-lg font-bold text-gray-900">Step 2: Pre-flight Check for Term {selectedTerm}</h3>
                        {!isTermSignedByTeacher && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg">
                                <h4 className="font-bold">Warning: Not Signed</h4>
                                <p className="text-sm">You have not yet signed off on this term's monitoring document. It is recommended to sign it before exporting for review.</p>
                            </div>
                        )}
                        {isTermSignedByTeacher && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-300 text-green-800 rounded-lg">
                                <h4 className="font-bold">Ready to Go!</h4>
                                <p className="text-sm">You have signed off on this term. The document is ready for export.</p>
                            </div>
                        )}
                        <p className="mt-4 text-sm text-gray-600">
                            Clicking "Export" will create a `.profiler-review` file containing monitoring data for Term {selectedTerm} and a snapshot of the class's student profiles. Send this file to your head teacher for them to review and sign.
                        </p>
                    </div>
                );
        }
    };
    
    const renderFooter = () => {
         switch (step) {
            case 1:
                return (
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold">Cancel</button>
                );
            case 2:
                 return (
                    <>
                        <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold">Back</button>
                        <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold">
                            Export Term {selectedTerm} for Review
                        </button>
                    </>
                );
        }
    }


    if (!isOpen) return null;

    return (
        <dialog ref={dialogRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-lg backdrop:bg-black backdrop:opacity-50 border border-gray-300">
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Export for Review</h2>
                <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
            </div>
            <div className="p-6 bg-white">
                {renderStepContent()}
            </div>
            <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t">
                {renderFooter()}
            </div>
        </dialog>
    );
};

export default ExportReviewModal;