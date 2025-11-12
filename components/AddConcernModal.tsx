import React, { useState, useEffect, useRef } from 'react';
import type { FileUpload, ConcernEntry, Student } from '../types';
import InlineFileUpload from './InlineFileUpload';

interface AddConcernModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newConcern: Omit<ConcernEntry, 'id'>) => void;
    students: Student[];
}

const AddConcernModal: React.FC<AddConcernModalProps> = ({ isOpen, onClose, onSave, students }) => {
    const [file, setFile] = useState<FileUpload | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
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
        onClose();
    };

    const handleSave = () => {
        if (!file) {
            alert('Please upload a file for the concern.');
            return;
        }
        onSave({
            file,
            studentIds: selectedStudentIds,
        });
        setFile(null);
        setSelectedStudentIds([]);
        handleClose();
    };

    const handleToggleStudent = (studentId: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    return (
        <dialog ref={dialogRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-lg backdrop:bg-black backdrop:opacity-50 border border-gray-300">
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-900">Log Student Causing Concern</h2>
                <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
            </div>
            <div className="p-6 bg-white space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Concern Document</label>
                    <InlineFileUpload file={file} onUpload={setFile} onRemove={() => setFile(null)} />
                    <p className="text-xs text-gray-500 mt-1">Upload the parent communication log or other relevant document.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Associated Students (optional)</label>
                    <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                        {students.sort((a,b) => a.lastName.localeCompare(b.lastName)).map(student => (
                            <label key={student.studentId} className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedStudentIds.includes(student.studentId)}
                                    onChange={() => handleToggleStudent(student.studentId)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-3 text-gray-800 text-sm">{student.lastName}, {student.firstName}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0">
                <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={!file} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-semibold transition-colors">Save Concern</button>
            </div>
        </dialog>
    );
};

export default AddConcernModal;
