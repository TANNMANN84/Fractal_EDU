
import React, { useState, useMemo, useEffect, useRef } from 'react';
// FIX: Corrected import paths to be relative.
import type { ClassData, Student } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface AddStudentToClassModalProps {
    classData: ClassData;
    onClose: () => void;
}

const AddStudentToClassModal: React.FC<AddStudentToClassModalProps> = ({ classData, onClose }) => {
    const { data, saveData } = useAppContext();
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [yearFilter, setYearFilter] = useState<string>('all');
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    const yearGroupOptions = useMemo(() => {
        if (!data) return [];
        // Base list of students who could be added, regardless of current filter
        const potentialStudents = data.students.filter(s => !classData.studentIds.includes(s.studentId) && s.profile.status === 'Active');
        const years = new Set(potentialStudents.map(s => s.profile.currentYearGroup));
        // FIX: Use spread syntax `[...years]` for better type inference than `Array.from`.
        // FIX: Explicitly type sort callback parameters to resolve arithmetic operation error.
        return [...years].sort((a: number, b: number) => a - b);
    }, [data, classData.studentIds]);

    const availableStudents = useMemo(() => {
        if (!data) return [];
        
        let students = data.students
            .filter(s => !classData.studentIds.includes(s.studentId) && s.profile.status === 'Active');

        if (yearFilter !== 'all') {
            students = students.filter(s => s.profile.currentYearGroup === parseInt(yearFilter, 10));
        }

        return students.sort((a, b) => a.lastName.localeCompare(b.lastName));

    }, [data, classData.studentIds, yearFilter]);

    const handleToggleStudent = (studentId: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSave = () => {
        if (!data) return;
        const updatedClass = {
            ...classData,
            studentIds: [...classData.studentIds, ...selectedStudentIds],
        };
        const updatedClasses = data.classes.map(c => c.classId === classData.classId ? updatedClass : c);
        saveData({ ...data, classes: updatedClasses });
        onClose();
    };
    
    const handleClose = () => {
        dialogRef.current?.close();
        onClose();
    }

    return (
        <dialog ref={dialogRef} onClose={onClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-md backdrop:bg-black backdrop:opacity-50 border border-gray-300">
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Add Students to {classData.className}</h2>
                <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
            </div>

            <div className="p-6 bg-white">
                {yearGroupOptions.length > 0 && (
                     <div className="mb-4">
                        <label htmlFor="year-group-filter" className="block text-sm font-medium text-gray-700">Filter by Year Group</label>
                        <select
                            id="year-group-filter"
                            value={yearFilter}
                            onChange={e => setYearFilter(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-white text-gray-900"
                        >
                            <option value="all">All Years</option>
                            {yearGroupOptions.map(year => (
                                <option key={year} value={year}>Year {year}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div style={{ maxHeight: '45vh', overflowY: 'auto' }}>
                    {availableStudents.length > 0 ? (
                        <ul className="space-y-2">
                            {availableStudents.map(student => (
                                <li key={student.studentId}>
                                    <label className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudentIds.includes(student.studentId)}
                                            onChange={() => handleToggleStudent(student.studentId)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-3 text-gray-800">
                                            {student.lastName}, {student.firstName}
                                            <span className="text-xs text-gray-500 ml-2">(Year {student.profile.currentYearGroup})</span>
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600 text-center py-4">No available students match the current filter.</p>
                    )}
                </div>
            </div>
            
            <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end gap-2">
                <button onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold transition-colors">Cancel</button>
                <button 
                    onClick={handleSave} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed font-semibold transition-colors"
                    disabled={selectedStudentIds.length === 0}
                >
                    Add Selected ({selectedStudentIds.length})
                </button>
            </div>
        </dialog>
    );
};

export default AddStudentToClassModal;