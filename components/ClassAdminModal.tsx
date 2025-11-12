import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ClassData, Student, MonitoringDoc, ClassTransferPackage } from '../types';
import { useAppContext } from '../contexts/AppContext';
import ConfirmationModal from './ConfirmationModal';
import { storageService } from '../services/storageService';

interface ClassAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Helper to find all file IDs within any object or array of objects
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

const ClassAdminModal: React.FC<ClassAdminModalProps> = ({ isOpen, onClose }) => {
    const { data, saveData } = useAppContext();
    const [editingClassId, setEditingClassId] = useState<string | null>(null);
    const [editedName, setEditedName] = useState('');
    const [editedTeacher, setEditedTeacher] = useState('');
    const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

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
        setEditingClassId(null);
        onClose();
    };
    
    const startEditing = (classData: ClassData) => {
        setEditingClassId(classData.classId);
        setEditedName(classData.className);
        setEditedTeacher(classData.teacher);
    };
    
    const cancelEditing = () => {
        setEditingClassId(null);
        setEditedName('');
        setEditedTeacher('');
    };

    const handleSaveEdit = () => {
        if (!data || !editingClassId) return;
        const updatedClasses = data.classes.map(c => 
            c.classId === editingClassId 
                ? { ...c, className: editedName, teacher: editedTeacher } 
                : c
        );
        saveData({ ...data, classes: updatedClasses });
        cancelEditing();
    };
    
    const handleToggleArchive = (classId: string, currentStatus: 'Active' | 'Archived') => {
        if (!data) return;
        const newStatus: 'Active' | 'Archived' = currentStatus === 'Active' ? 'Archived' : 'Active';
        const updatedClasses = data.classes.map(c =>
            c.classId === classId ? { ...c, status: newStatus } : c
        );
        saveData({ ...data, classes: updatedClasses });
    };

    const handleDeleteClass = (classId: string) => {
        if (!data) return;
        setConfirmation({
            title: "Confirm Class Deletion",
            message: "Are you sure you want to permanently delete this class? This action cannot be undone.",
            onConfirm: () => {
                const updatedClasses = data.classes.filter(c => c.classId !== classId);
                saveData({ ...data, classes: updatedClasses });
                setConfirmation(null);
            }
        });
    };
    
    const handleExportClass = async (classId: string) => {
        if (!data) return;
        const classData = data.classes.find(c => c.classId === classId);
        if (!classData) return;

        try {
            const studentsInClass = data.students.filter(s => classData.studentIds.includes(s.studentId));
            const monitoringDoc = data.monitoringDocs.find(d => d.classId === classId) || null; // Simplified: finds any doc for the class

            const allDataToScan: (Student | MonitoringDoc)[] = [...studentsInClass];
            if (monitoringDoc) allDataToScan.push(monitoringDoc);

            const fileIds = allDataToScan.flatMap(collectFileIds);
            const uniqueFileIds = [...new Set(fileIds)];
            
            const files: { [id: string]: string } = {};
            for (const id of uniqueFileIds) {
                const content = await storageService.getFileContent(id);
                if (content) files[id] = content;
            }

            const transferPackage: ClassTransferPackage = {
                dataType: 'classTransfer',
                classData,
                students: studentsInClass,
                monitoringDoc,
                files
            };

            const jsonString = JSON.stringify(transferPackage, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${classData.className.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_handover.json`;
            link.click();
            URL.revokeObjectURL(link.href);
            alert(`Class package for "${classData.className}" has been exported.`);

        } catch (error) {
            console.error("Failed to export class", error);
            alert("An error occurred during class export.");
        }
    };

    const classes = useMemo(() => data?.classes.sort((a,b) => a.className.localeCompare(b.className)) || [], [data?.classes]);

    if (!isOpen) return null;

    return (
        <>
            <dialog ref={dialogRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-4xl backdrop:bg-black backdrop:opacity-50 border border-gray-300">
                <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-900">Manage Classes</h2>
                    <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
                </div>
                <div className="p-6 bg-white max-h-[70vh] overflow-y-auto">
                    <ul className="space-y-3">
                        {classes.map(c => (
                            <li key={c.classId} className="p-3 border rounded-lg bg-gray-50">
                                {editingClassId === c.classId ? (
                                    <div className="space-y-3">
                                        <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="w-full p-2 border rounded" placeholder="Class Name"/>
                                        <input type="text" value={editedTeacher} onChange={e => setEditedTeacher(e.target.value)} className="w-full p-2 border rounded" placeholder="Teacher"/>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={cancelEditing} className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm font-semibold">Cancel</button>
                                            <button onClick={handleSaveEdit} className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-semibold">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                        <div>
                                            <p className="font-bold text-gray-800">{c.className} <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{c.status}</span></p>
                                            <p className="text-sm text-gray-600">{c.teacher} &bull; {c.studentIds.length} student(s)</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button onClick={() => handleExportClass(c.classId)} className="px-3 py-1 bg-teal-600 text-white rounded text-sm font-semibold">Export</button>
                                            <button onClick={() => startEditing(c)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm font-semibold">Edit</button>
                                            <button onClick={() => handleToggleArchive(c.classId, c.status)} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm font-semibold">{c.status === 'Active' ? 'Archive' : 'Activate'}</button>
                                            <button onClick={() => handleDeleteClass(c.classId)} className="px-3 py-1 bg-red-600 text-white rounded text-sm font-semibold">Delete</button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-4 bg-gray-100 border-t flex justify-end">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold">Close</button>
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

export default ClassAdminModal;