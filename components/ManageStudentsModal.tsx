import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Student, StudentTransferPackage } from '../types';
import { useAppContext } from '../contexts/AppContext';
import ConfirmationModal from './ConfirmationModal';
import { storageService } from '../services/storageService';

interface ManageStudentsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SortableKeys = 'lastName' | 'currentYearGroup' | 'dob' | 'status';

// Helper to find all file IDs within a student object
const collectFileIds = (obj: any): string[] => {
    const ids = new Set<string>();
    const recurse = (current: any) => {
        if (!current || typeof current !== 'object') return;
        if (Array.isArray(current)) {
            current.forEach(recurse);
        } else {
            // Heuristic to identify a FileUpload object
            if (current.id && current.name && typeof current.id === 'string' && Object.keys(current).length === 2) {
                ids.add(current.id);
            }
            Object.values(current).forEach(recurse);
        }
    };
    recurse(obj);
    return Array.from(ids);
};


const ManageStudentsModal: React.FC<ManageStudentsModalProps> = ({ isOpen, onClose }) => {
    const { data, saveData } = useAppContext();
    const [filter, setFilter] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'lastName', direction: 'ascending' });
    const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

    const dialogRef = useRef<HTMLDialogElement>(null);
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
            // Reset state on close
            setFilter('');
            setSelectedStudentIds([]);
            setSortConfig({ key: 'lastName', direction: 'ascending' });
        }
    }, [isOpen]);

    const sortedAndFilteredStudents = useMemo(() => {
        if (!data?.students) return [];
        
        let filtered = data.students.filter(student => {
            const searchTerm = filter.toLowerCase();
            return `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm);
        });

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                const key = sortConfig.key;
                let aValue: any;
                let bValue: any;
                
                if (key === 'lastName') {
                    aValue = a.lastName;
                    bValue = b.lastName;
                } else { // 'currentYearGroup', 'dob', 'status' are all in profile
                     aValue = a.profile[key];
                     bValue = b.profile[key];
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [data?.students, filter, sortConfig]);
    
    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            const isIndeterminate = selectedStudentIds.length > 0 && selectedStudentIds.length < sortedAndFilteredStudents.length;
            selectAllCheckboxRef.current.indeterminate = isIndeterminate;
        }
    }, [selectedStudentIds, sortedAndFilteredStudents]);

    const handleClose = () => {
        dialogRef.current?.close();
        onClose();
    }

    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudentIds(sortedAndFilteredStudents.map(s => s.studentId));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectOne = (studentId: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const performBulkAction = (action: 'delete' | 'archive' | 'activate') => {
        if (!data || selectedStudentIds.length === 0) return;
        
        let updatedStudents: Student[] = [];
        let updatedClasses = data.classes;

        if (action === 'delete') {
            updatedStudents = data.students.filter(s => !selectedStudentIds.includes(s.studentId));
            updatedClasses = data.classes.map(c => ({
                ...c,
                studentIds: c.studentIds.filter(id => !selectedStudentIds.includes(id)),
            }));
        } else {
            const newStatus = action === 'archive' ? 'Archived' : 'Active';
            updatedStudents = data.students.map(s => 
                selectedStudentIds.includes(s.studentId) ? { ...s, profile: { ...s.profile, status: newStatus } } : s
            );
        }

        saveData({ ...data, students: updatedStudents, classes: updatedClasses });
        setSelectedStudentIds([]);
        setConfirmation(null);
    };
    
    const handleBulkActionClick = (action: 'delete' | 'archive' | 'activate') => {
        const title = `Confirm Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}`;
        const message = `Are you sure you want to ${action} ${selectedStudentIds.length} selected student(s)? ${action === 'delete' ? 'This action is permanent and cannot be undone.' : ''}`;
        setConfirmation({ title, message, onConfirm: () => performBulkAction(action) });
    };
    
    const handleExportStudent = async (studentId: string) => {
        if (!data) return;
        const student = data.students.find(s => s.studentId === studentId);
        if (!student) return;

        try {
            const fileIds = collectFileIds(student);
            const files: { [id: string]: string } = {};
            for (const id of fileIds) {
                const content = await storageService.getFileContent(id);
                if (content) files[id] = content;
            }

            const transferPackage: StudentTransferPackage = { dataType: 'studentTransfer', student, files };

            const jsonString = JSON.stringify(transferPackage, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${student.lastName}_${student.firstName}_transfer.json`;
            link.click();
            URL.revokeObjectURL(link.href);

            setConfirmation({
                title: 'Confirm Student Deletion',
                message: `Successfully exported ${student.firstName} ${student.lastName}. Do you want to permanently delete this student from your records? This is recommended for transfers.`,
                onConfirm: () => handleConfirmDeleteAfterExport(studentId)
            });

        } catch (error) {
            console.error("Failed to export student", error);
            alert("An error occurred during export.");
        }
    };

    const handleConfirmDeleteAfterExport = async (studentId: string) => {
        if (!data) return;
        const studentToDelete = data.students.find(s => s.studentId === studentId);
        if (!studentToDelete) return;

        const fileIdsToDelete = collectFileIds(studentToDelete);
        if (fileIdsToDelete.length > 0) {
            await storageService.deleteFiles(fileIdsToDelete);
        }

        const updatedStudents = data.students.filter(s => s.studentId !== studentId);
        const updatedClasses = data.classes.map(c => ({
            ...c,
            studentIds: c.studentIds.filter(id => id !== studentId)
        }));

        saveData({ ...data, students: updatedStudents, classes: updatedClasses });
        setConfirmation(null);
        setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
    };

    const SortableHeader: React.FC<{ sortKey: SortableKeys; children: React.ReactNode }> = ({ sortKey, children }) => (
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                {children}
                {sortConfig?.key === sortKey && (
                    <span className="ml-2">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                )}
            </div>
        </th>
    );

    return (
        <>
            <dialog ref={dialogRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-5xl backdrop:bg-black backdrop:opacity-50 border border-gray-300">
                <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-900">Manage Students</h2>
                    <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
                </div>

                <div className="p-6 bg-white text-gray-900">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {selectedStudentIds.length > 0 && (
                            <div className="bg-indigo-50 p-2 rounded-md flex items-center gap-2">
                                <span className="text-sm font-semibold text-indigo-800">{selectedStudentIds.length} selected</span>
                                <button onClick={() => handleBulkActionClick('archive')} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs font-bold">Archive</button>
                                <button onClick={() => handleBulkActionClick('activate')} className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-bold">Activate</button>
                                <button onClick={() => handleBulkActionClick('delete')} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-bold">Delete</button>
                            </div>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">
                                        <input
                                            ref={selectAllCheckboxRef}
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedStudentIds.length > 0 && selectedStudentIds.length === sortedAndFilteredStudents.length}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <SortableHeader sortKey="lastName">Name</SortableHeader>
                                    <SortableHeader sortKey="currentYearGroup">Year</SortableHeader>
                                    <SortableHeader sortKey="dob">Date of Birth</SortableHeader>
                                    <SortableHeader sortKey="status">Status</SortableHeader>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedAndFilteredStudents.map(student => (
                                    <tr key={student.studentId} className={`hover:bg-gray-50 ${selectedStudentIds.includes(student.studentId) ? 'bg-indigo-50' : ''}`}>
                                        <td className="px-4 py-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.includes(student.studentId)}
                                                onChange={() => handleSelectOne(student.studentId)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{student.lastName}, {student.firstName}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{student.profile.currentYearGroup}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{student.profile.dob}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.profile.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {student.profile.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                            <button onClick={() => handleExportStudent(student.studentId)} className="text-indigo-600 hover:text-indigo-900 font-semibold">Export</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {sortedAndFilteredStudents.length === 0 && (
                            <p className="p-4 text-center text-gray-500">No students found.</p>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0">
                    <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold transition-colors">Close</button>
                </div>
            </dialog>

            <ConfirmationModal
                isOpen={!!confirmation}
                onClose={() => setConfirmation(null)}
                onConfirm={() => confirmation?.onConfirm()}
                title={confirmation?.title || ''}
                message={confirmation?.message || ''}
            />
        </>
    );
};

export default ManageStudentsModal;