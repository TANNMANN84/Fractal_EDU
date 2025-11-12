import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ReviewPackage, MonitoringDoc, Term, TermSignOff, FileUpload, ConcernEntry, StudentProfilerSnapshotEntry } from '../types';
import SignOffModal from './SignOffModal';
import { storageService } from '../services/storageService';


interface ReviewModalProps {
    packageData: ReviewPackage;
    onClose: () => void;
}

const NAPLAN_BAND_COLORS: { [key: string]: string } = {
    'Exceeding': 'bg-blue-500',
    'Strong': 'bg-green-500',
    'Developing': 'bg-yellow-500',
    'Needs additional support': 'bg-red-500',
    'Not Assessed': 'bg-gray-400',
};

const NaplanDot: React.FC<{ band: string }> = ({ band }) => (
    <div className="flex justify-center items-center">
        <span
            className={`h-3 w-3 rounded-full ${NAPLAN_BAND_COLORS[band] || 'bg-gray-400'}`}
            title={band}
        ></span>
    </div>
);

const Checkmark: React.FC<{ value: boolean }> = ({ value }) => (
    <div className="flex justify-center items-center">
        {value ? (
            <span className="text-green-600 font-bold" title="Data present">✓</span>
        ) : (
            <span className="text-gray-400" title="No data">-</span>
        )}
    </div>
);


// A helper to display file uploads in a read-only way
const FileDisplay: React.FC<{ file: FileUpload | null; label: string }> = ({ file, label }) => (
    <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {file ? (
            <button onClick={() => storageService.triggerDownload(file)} className="text-sm text-blue-600 hover:underline">{file.name}</button>
        ) : (
            <p className="text-sm text-gray-500 italic">Not provided</p>
        )}
    </div>
);

// A helper for multi-file displays
const MultiFileDisplay: React.FC<{ files: FileUpload[]; label: string }> = ({ files, label }) => (
     <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {files && files.length > 0 ? (
            <ul className="list-disc list-inside text-sm">
                {files.map((file, index) => (
                    <li key={index}><button onClick={() => storageService.triggerDownload(file)} className="text-blue-600 hover:underline">{file.name}</button></li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-gray-500 italic">Not provided</p>
        )}
    </div>
);


const ReviewModal: React.FC<ReviewModalProps> = ({ packageData, onClose }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [doc, setDoc] = useState<MonitoringDoc>(packageData.monitoringDoc);
    const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    const reviewedTerm = useMemo((): Term | null => {
        for (const term of ['1', '2', '3', '4'] as Term[]) {
            if (doc.teacherSignOff[term]?.date || doc.teachingPrograms[term]?.length > 0 || doc.marksAndRanks[term]) {
                return term;
            }
        }
        for (const term of ['1', '2', '3', '4'] as Term[]) {
            if (doc.teachingPrograms[term]?.length > 0) return term;
        }
        return null;
    }, [doc]);

    const handleClose = () => {
        dialogRef.current?.close();
        onClose();
    };
    
    const handlePrint = () => {
        window.print();
    };

    const handleSignOff = (signerName: string, signatureImage?: string) => {
        if (!reviewedTerm) return;
        
        const newSignOff: TermSignOff = {
            teacherName: signerName,
            date: new Date().toISOString(),
            signatureImage: signatureImage,
        };
        
        setDoc(prevDoc => {
            const newDoc = { ...prevDoc };
            newDoc.headTeacherSignOff = { ...prevDoc.headTeacherSignOff, [reviewedTerm]: newSignOff };
            return newDoc;
        });

        setIsSignOffModalOpen(false);
    };

    const handleDownloadSignedPackage = () => {
        const updatedPackage: ReviewPackage = {
            ...packageData,
            monitoringDoc: doc,
        };

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(updatedPackage, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        const safeClassName = packageData.classData.className.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${safeClassName}_review_term_${reviewedTerm}_SIGNED_${new Date().toISOString().split('T')[0]}.profiler-review`;
        link.click();
        handleClose();
    };

    if (!reviewedTerm) {
        return (
             <dialog ref={dialogRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-lg backdrop:bg-black backdrop:opacity-50 border border-gray-300">
                <div className="p-6 bg-white">
                    <h3 className="text-lg font-bold text-red-700">Invalid Review Package</h3>
                    <p className="mt-2 text-sm text-gray-600">This review package does not seem to contain a valid term sign-off from the teacher. It cannot be reviewed.</p>
                </div>
                 <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold">Close</button>
                </div>
            </dialog>
        );
    }
    
    const teacherSignOff = doc.teacherSignOff[reviewedTerm];
    const headTeacherSignOff = doc.headTeacherSignOff[reviewedTerm];

    const checklistItems = [
        { label: 'Syllabus Certified', value: doc.certifySyllabus ? 'Yes' : 'No' },
        { label: 'Scope and Sequence', value: doc.scopeAndSequence?.name },
        { label: 'Assessment Schedule', value: doc.assessmentSchedule?.name },
        { label: 'Assessment Task 1', value: doc.assessmentTask1?.map(f => f.name).join(', ') },
        { label: 'Assessment Task 2', value: doc.assessmentTask2?.map(f => f.name).join(', ') },
        { label: 'Assessment Task 3', value: doc.assessmentTask3?.map(f => f.name).join(', ') },
        { label: 'Pre/Post Diagnostic', value: doc.prePostDiagnostic?.map(f => f.name).join(', ') },
        { label: `Term ${reviewedTerm} Teaching Program(s)`, value: doc.teachingPrograms[reviewedTerm]?.map(f => f.name).join(', ') },
        { label: `Term ${reviewedTerm} Semester Report`, value: doc.semesterReports[reviewedTerm]?.name, condition: reviewedTerm === '2' || reviewedTerm === '4' },
        { label: `Term ${reviewedTerm} Marks and Ranks`, value: doc.marksAndRanks[reviewedTerm]?.name },
        { label: `Term ${reviewedTerm} Learning Needs Addressed`, value: doc.specificLearningNeeds[reviewedTerm] ? 'Yes' : 'No' },
        { label: `Term ${reviewedTerm} Students Causing Concern`, value: doc.studentsCausingConcern[reviewedTerm]?.map(c => c.file.name).join(', ') },
        { label: `Term ${reviewedTerm} Illness/Misadventure`, value: doc.illnessMisadventure[reviewedTerm]?.map(f => f.name).join(', ') },
        { label: `Term ${reviewedTerm} Malpractice`, value: doc.malpractice[reviewedTerm]?.map(f => f.name).join(', ') },
    ];
    
    const year9Applicable = packageData.students.some(s => s.profile.currentYearGroup >= 9);


    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                    @page { size: A4; margin: 1.5cm; }
                }
            `}</style>
            <div className="print-area">
                <h1 style={{fontSize: '24px', marginBottom: '20px'}}>Monitoring Review Snapshot</h1>
                <div style={{fontSize: '12px', marginBottom: '20px'}}>
                    <p><strong>Class Name:</strong> {packageData.classData.className}</p>
                    <p><strong>Teacher:</strong> {packageData.classData.teacher}</p>
                    <p><strong>Year:</strong> {doc.year}</p>
                    <p><strong>Reviewed Term:</strong> {reviewedTerm}</p>
                </div>
                 <h2 style={{fontSize: '18px', marginTop: '20px', marginBottom: '10px'}}>Signatures</h2>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
                    <div style={{border: '1px solid #ddd', padding: '10px', textAlign: 'center'}}>
                        <h3 style={{fontSize: '14px', fontWeight: 'bold'}}>Teacher</h3>
                        {teacherSignOff?.date ? (
                            <>
                                {'signatureImage' in teacherSignOff && teacherSignOff.signatureImage ? <img src={teacherSignOff.signatureImage} alt="Signature" style={{height: '60px', margin: '10px auto'}} /> : <p style={{fontFamily: 'Caveat, cursive', fontSize: '36px', margin: '10px 0'}}>{teacherSignOff.teacherName}</p>}
                                <p style={{fontSize: '12px'}}>Signed by {teacherSignOff.teacherName} on {new Date(teacherSignOff.date).toLocaleDateString()}</p>
                            </>
                        ) : <p style={{fontSize: '12px'}}>Not Signed</p>}
                    </div>
                    <div style={{border: '1px solid #ddd', padding: '10px', textAlign: 'center'}}>
                        <h3 style={{fontSize: '14px', fontWeight: 'bold'}}>Head Teacher</h3>
                         {headTeacherSignOff?.date ? (
                            <>
                                {'signatureImage' in headTeacherSignOff && headTeacherSignOff.signatureImage ? <img src={headTeacherSignOff.signatureImage} alt="Signature" style={{height: '60px', margin: '10px auto'}} /> : <p style={{fontFamily: 'Caveat, cursive', fontSize: '36px', margin: '10px 0'}}>{headTeacherSignOff.teacherName}</p>}
                                <p style={{fontSize: '12px'}}>Signed by {headTeacherSignOff.teacherName} on {new Date(headTeacherSignOff.date).toLocaleDateString()}</p>
                            </>
                        ) : <p style={{fontSize: '12px'}}>Not Signed</p>}
                    </div>
                </div>
                 <h2 style={{fontSize: '18px', marginTop: '20px', marginBottom: '10px'}}>Documentation Checklist</h2>
                 <ul style={{fontSize: '12px', listStyleType: 'disc', paddingLeft: '20px'}}>
                     {checklistItems.filter(item => typeof item.condition === 'undefined' || item.condition).map(item => (
                         <li key={item.label}><strong>{item.label}:</strong> {item.value || 'N/A'}</li>
                     ))}
                 </ul>
                 <h2 style={{fontSize: '18px', marginTop: '20px', marginBottom: '10px', pageBreakBefore: 'always'}}>Student Profiler Snapshot</h2>
                 <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '10px'}}>
                    <thead style={{backgroundColor: '#eee'}}>
                        <tr>
                            <th style={{border: '1px solid #ddd', padding: '4px', textAlign: 'left'}}>Student Name</th>
                            <th style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}} title="Wellbeing Notes">Wellbeing</th>
                            <th style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}} title="Evidence Logs">Evidence</th>
                            <th style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}} title="Work Samples">Samples</th>
                            <th style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}} title="Differentiation Records">Diff.</th>
                            <th style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}} title="Year 7 Reading">Y7 Read</th>
                            <th style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}} title="Year 7 Writing">Y7 Write</th>
                            <th style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}} title="Year 7 Numeracy">Y7 Num</th>
                            {year9Applicable && <>
                                <th style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}} title="Year 9 Reading">Y9 Read</th>
                                <th style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}} title="Year 9 Writing">Y9 Write</th>
                                <th style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}} title="Year 9 Numeracy">Y9 Num</th>
                            </>}
                        </tr>
                    </thead>
                    <tbody>
                        {packageData.profilerSnapshot.map(s => (
                            <tr key={s.studentId}>
                                <td style={{border: '1px solid #ddd', padding: '4px'}}>{s.lastName}, {s.firstName}</td>
                                <td style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}}>{s.hasWellbeingNotes ? '✓' : '-'}</td>
                                <td style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}}>{s.hasEvidenceLogs ? '✓' : '-'}</td>
                                <td style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}}>{s.hasWorkSamples ? '✓' : '-'}</td>
                                <td style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}}>{s.hasDifferentiation ? '✓' : '-'}</td>
                                <td style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}}>{s.naplan.year7.reading.charAt(0)}</td>
                                <td style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}}>{s.naplan.year7.writing.charAt(0)}</td>
                                <td style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}}>{s.naplan.year7.numeracy.charAt(0)}</td>
                                {year9Applicable && <>
                                    <td style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}}>{s.naplan.year9.reading.charAt(0)}</td>
                                    <td style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}}>{s.naplan.year9.writing.charAt(0)}</td>
                                    <td style={{border: '1px solid #ddd', padding: '4px', textAlign: 'center'}}>{s.naplan.year9.numeracy.charAt(0)}</td>
                                </>}
                            </tr>
                        ))}
                    </tbody>
 </table>

            </div>

            <dialog ref={dialogRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-6xl backdrop:bg-black backdrop:opacity-50 border border-gray-300 no-print">
                <div className="flex justify-between items-center p-4 bg-yellow-100 border-b-2 border-yellow-300 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-yellow-900">Review Mode: {packageData.classData.className}</h2>
                        <p className="text-sm text-yellow-800">You are viewing a read-only review package for Term {reviewedTerm}.</p>
                    </div>
                    <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
                </div>

                <div className="p-6 bg-white space-y-4 max-h-[70vh] overflow-y-auto">
                    {packageData.profilerSnapshot && (
                        <div className="p-4 bg-gray-50 border rounded-lg">
                            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4 text-gray-900">Student Profiler Snapshot</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="p-2 font-semibold text-gray-600 uppercase tracking-wider">Student Name</th>
                                            <th className="p-2 font-semibold text-gray-600 uppercase tracking-wider text-center" title="Wellbeing Notes">Wellbeing</th>
                                            <th className="p-2 font-semibold text-gray-600 uppercase tracking-wider text-center" title="Evidence Logs">Evidence</th>
                                            <th className="p-2 font-semibold text-gray-600 uppercase tracking-wider text-center" title="Work Samples">Samples</th>
                                            <th className="p-2 font-semibold text-gray-600 uppercase tracking-wider text-center" title="Differentiation Records">Diff.</th>
                                            <th className="p-2 font-semibold text-gray-600 uppercase tracking-wider text-center" title="Year 7 Reading">Y7 Read</th>
                                            <th className="p-2 font-semibold text-gray-600 uppercase tracking-wider text-center" title="Year 7 Writing">Y7 Write</th>
                                            <th className="p-2 font-semibold text-gray-600 uppercase tracking-wider text-center" title="Year 7 Numeracy">Y7 Num</th>
                                            {year9Applicable && <>
                                                <th className="p-2 font-semibold text-gray-600 uppercase tracking-wider text-center" title="Year 9 Reading">Y9 Read</th>
                                                <th className="p-2 font-semibold text-gray-600 uppercase tracking-wider text-center" title="Year 9 Writing">Y9 Write</th>
                                                <th className="p-2 font-semibold text-gray-600 uppercase tracking-wider text-center" title="Year 9 Numeracy">Y9 Num</th>
                                            </>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {packageData.profilerSnapshot.map(s => (
                                            <tr key={s.studentId} className="hover:bg-gray-100">
                                                <td className="p-2 text-gray-900 font-medium">{s.lastName}, {s.firstName}</td>
                                                <td className="p-2"><Checkmark value={s.hasWellbeingNotes} /></td>
                                                <td className="p-2"><Checkmark value={s.hasEvidenceLogs} /></td>
                                                <td className="p-2"><Checkmark value={s.hasWorkSamples} /></td>
                                                <td className="p-2"><Checkmark value={s.hasDifferentiation} /></td>
                                                <td className="p-2"><NaplanDot band={s.naplan.year7.reading} /></td>
                                                <td className="p-2"><NaplanDot band={s.naplan.year7.writing} /></td>
                                                <td className="p-2"><NaplanDot band={s.naplan.year7.numeracy} /></td>
                                                {year9Applicable && <>
                                                    <td className="p-2"><NaplanDot band={s.naplan.year9.reading} /></td>
                                                    <td className="p-2"><NaplanDot band={s.naplan.year9.writing} /></td>
                                                    <td className="p-2"><NaplanDot band={s.naplan.year9.numeracy} /></td>
                                                </>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3 p-4 bg-gray-50 border rounded-lg">
                             <h3 className="font-bold text-gray-800 border-b pb-1 mb-2 text-gray-900">Syllabus & Reporting</h3>
                             <FileDisplay label="Scope and Sequence" file={doc.scopeAndSequence} />
                             <p className="text-sm font-medium text-gray-700">Syllabus Certification: <span className="font-normal">{doc.certifySyllabus ? 'Certified' : 'Not Certified'}</span></p>
                             <MultiFileDisplay label={`Term ${reviewedTerm} Teaching Program(s)`} files={doc.teachingPrograms[reviewedTerm]} />
                             {(reviewedTerm === '2' || reviewedTerm === '4') && <FileDisplay label={`Term ${reviewedTerm} Semester Report`} file={doc.semesterReports[reviewedTerm]} />}
                        </div>
                        <div className="space-y-3 p-4 bg-gray-50 border rounded-lg">
                             <h3 className="font-bold text-gray-800 border-b pb-1 mb-2 text-gray-900">Assessment Documents</h3>
                             <FileDisplay label="Assessment Schedule" file={doc.assessmentSchedule} />
                             <MultiFileDisplay label="Assessment Task 1" files={doc.assessmentTask1} />
                             <MultiFileDisplay label="Assessment Task 2" files={doc.assessmentTask2} />
                             <MultiFileDisplay label="Assessment Task 3" files={doc.assessmentTask3} />
                             <MultiFileDisplay label="Pre/Post-Diagnostic Task Evidence" files={doc.prePostDiagnostic} />
                        </div>
                        <div className="space-y-3 p-4 bg-gray-50 border rounded-lg">
                            <h3 className="font-bold text-gray-800 border-b pb-1 mb-2 text-gray-900">Student Performance (Term {reviewedTerm})</h3>
                            <FileDisplay label="Marks and Ranks" file={doc.marksAndRanks[reviewedTerm]} />
                            <p className="text-sm font-medium text-gray-700">Specific learning needs addressed: <span className="font-normal">{doc.specificLearningNeeds[reviewedTerm] ? 'Yes' : 'No'}</span></p>
                        </div>
                        <div className="space-y-3 p-4 bg-gray-50 border rounded-lg">
                            <h3 className="font-bold text-gray-800 border-b pb-1 mb-2 text-gray-900">Communication (Term {reviewedTerm})</h3>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Students Causing Concern:</p>
                                {doc.studentsCausingConcern[reviewedTerm]?.length > 0 ? (
                                    <ul className="list-disc list-inside text-sm">
                                        {doc.studentsCausingConcern[reviewedTerm].map((c: ConcernEntry) => (
                                            <li key={c.id}><button onClick={() => storageService.triggerDownload(c.file)} className="text-blue-600 hover:underline">{c.file.name}</button></li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-gray-500 italic">None logged for this term.</p>}
                            </div>
                            <MultiFileDisplay label="Illness/Misadventure" files={doc.illnessMisadventure[reviewedTerm]} />
                            <MultiFileDisplay label="Malpractice" files={doc.malpractice[reviewedTerm]} />
                        </div>
                    </div>

                    <div className="mt-6 p-4 border-t-2 border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 text-center mb-4 text-gray-900">Sign Off for Term {reviewedTerm}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-center">
                                <h4 className="font-semibold text-gray-800 text-gray-900">Teacher Sign Off</h4>
                                {teacherSignOff?.date ? (
                                    <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-sm text-center">
                                        {'signatureImage' in teacherSignOff && teacherSignOff.signatureImage ? (
                                            <img src={teacherSignOff.signatureImage} alt="Signature" className="mx-auto h-16 w-auto" />
                                        ) : (
                                            <p className="font-caveat text-3xl text-gray-800">{teacherSignOff.teacherName}</p>
                                        )}
                                        <p className="text-xs text-gray-600">Signed by {teacherSignOff.teacherName} on {new Date(teacherSignOff.date).toLocaleDateString()}</p>
                                    </div>
                                ) : <p className="text-sm text-red-600 mt-2">Not signed by teacher.</p>}
                            </div>
                            <div className="text-center">
                                <h4 className="font-semibold text-gray-800 text-gray-900">Head Teacher Sign Off</h4>
                                {headTeacherSignOff?.date ? (
                                     <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-sm text-center">
                                        {'signatureImage' in headTeacherSignOff && headTeacherSignOff.signatureImage ? (
                                            <img src={headTeacherSignOff.signatureImage} alt="Signature" className="mx-auto h-16 w-auto" />
                                        ) : (
                                            <p className="font-caveat text-3xl text-gray-800">{headTeacherSignOff.teacherName}</p>
                                        )}
                                        <p className="text-xs text-gray-600">Signed by {headTeacherSignOff.teacherName} on {new Date(headTeacherSignOff.date).toLocaleDateString()}</p>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsSignOffModalOpen(true)} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">Sign as Head Teacher</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 no-print">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold">Cancel</button>
                    {headTeacherSignOff?.date && (
                        <>
                             <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">Print Snapshot for Filing</button>
                            <button onClick={handleDownloadSignedPackage} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold">Download Signed Package</button>
                        </>
                    )}
                </div>
            </dialog>

            {isSignOffModalOpen && (
                <SignOffModal
                    isOpen={isSignOffModalOpen}
                    onClose={() => setIsSignOffModalOpen(false)}
                    onConfirm={handleSignOff}
                    signerName={'Head Teacher'}
                    existingSignOff={null}
                />
            )}
        </>
    );
};

export default ReviewModal;
