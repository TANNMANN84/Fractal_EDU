
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { AppData, Student, ClassData } from '../types';
import JSZip from 'jszip'; // Import JSZip

interface RolloverModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RolloverModal: React.FC<RolloverModalProps> = ({ isOpen, onClose }) => {
    const { data, saveData } = useAppContext();
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    const handleClose = () => {
        if (isProcessing) return;
        setStep(1);
        onClose();
    };

    const startRollover = async () => {
        if (!data) return;
        setIsProcessing(true);

        // 1. Promote or Archive Students
        setProcessingMessage('Promoting students and archiving graduates...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const processedStudents = data.students.map(s => {
            if (s.profile.status === 'Active') {
                if (s.profile.currentYearGroup === 12) {
                    // Archive graduating Year 12 students
                    return { ...s, profile: { ...s.profile, status: 'Archived' as 'Archived' } };
                } else {
                    // Promote all other active students
                    return { ...s, profile: { ...s.profile, currentYearGroup: s.profile.currentYearGroup + 1 } };
                }
            }
            return s; // Return unchanged if not active
        });


        // 2. Export Profiles as ZIP, organized into folders
        setProcessingMessage('Packaging student profiles into year-group folders...');
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            const zip = new JSZip();
            processedStudents.forEach((student: Student) => {
                const safeName = `${student.lastName}_${student.firstName}_${student.studentId}`.replace(/[^a-z0-9_]/gi, '-');
                let folderName = `Year_${student.profile.currentYearGroup}`;
                
                // Check if the student was a Year 12 graduate in this rollover
                const originalStudent = data.students.find(os => os.studentId === student.studentId)!;
                if (student.profile.status === 'Archived' && originalStudent.profile.currentYearGroup === 12) {
                    folderName = 'Archived_Graduates';
                } else if (student.profile.status === 'Archived') {
                    folderName = 'Archived_Other';
                }

                const folder = zip.folder(folderName);
                if (folder) {
                    folder.file(`${safeName}.json`, JSON.stringify(student, null, 2));
                }
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `fractal_edu_student_profiles_${new Date().getFullYear()}.zip`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Failed to create ZIP file", error);
            alert("Error: Could not create the student profile archive. Please check the console for details.");
            setIsProcessing(false);
            setStep(1);
            return;
        }

        // 3. Archive Classes
        setProcessingMessage('Archiving current classes...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const archivedClasses = data.classes.map(c => ({ ...c, status: 'Archived' as 'Archived' }));

        // 4. Save all data
        setProcessingMessage('Finalizing and saving data...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const finalData: AppData = {
            ...data,
            students: processedStudents,
            classes: archivedClasses,
        };
        saveData(finalData);

        setProcessingMessage('Roll-over complete!');
        setIsProcessing(false);
        setStep(3);
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Prepare for New School Year</h3>
                        <p className="mt-2 text-sm text-gray-600">This process will prepare the application for the next school year. It involves three irreversible steps:</p>
                        <ul className="list-decimal list-inside space-y-2 mt-4 text-sm text-gray-700 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <li><strong>Promote & Archive Students:</strong> All 'Active' students will have their year group incremented. <strong>Year 12 students will be automatically archived.</strong></li>
                            <li><strong>Export All Profiles:</strong> A `.zip` file containing an individual JSON profile for every student will be downloaded, <strong>organized into folders by their new year group.</strong></li>
                            <li><strong>Archive Classes:</strong> All current classes will be marked as 'Archived' and hidden from the dashboard to provide a clean slate.</li>
                        </ul>
                        <p className="mt-4 font-semibold text-red-600">This action cannot be undone. It is highly recommended to take a full backup before proceeding.</p>
                    </div>
                );
            case 2:
                return (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                            <svg className="h-6 w-6 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mt-4">Processing Roll-over...</h3>
                        <p className="mt-2 text-sm text-gray-600">{processingMessage}</p>
                    </div>
                );
            case 3:
                 return (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                             <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mt-4">Roll-over Complete!</h3>
                        <p className="mt-2 text-sm text-gray-600">The application is ready for the new school year. The student profile archive has been downloaded to your computer.</p>
                    </div>
                );
            default: return null;
        }
    };
    
    const renderFooter = () => {
         switch (step) {
            case 1:
                return (
                    <>
                        <button onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold">Cancel</button>
                        <button onClick={() => { setStep(2); startRollover(); }} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">Confirm and Begin Roll-over</button>
                    </>
                );
            case 2: return null; // No buttons during processing
            case 3:
                return (
                    <button onClick={handleClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">Finish</button>
                );
            default: return null;
        }
    }

    if (!isOpen) return null;

    return (
        <dialog ref={dialogRef} onClose={onClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-lg backdrop:bg-black backdrop:opacity-50 border border-gray-300">
            <div className="p-6 bg-white">
                {renderStepContent()}
            </div>
            {step !== 2 && (
                <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t">
                    {renderFooter()}
                </div>
            )}
        </dialog>
    );
};

export default RolloverModal;
