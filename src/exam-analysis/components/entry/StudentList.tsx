import React, { useState, useEffect, useMemo } from 'react';
import { produce } from 'immer';
import { useAppContext } from '../../../../contexts/AppContext';
import Modal from '../../components/Modal';
import { createStudentObject } from '../../utils/helpers';
import { ExamStudent, AppMode } from '../../../../types';

interface StudentListProps {
    studentList: ExamStudent[];
    mode: AppMode;
    isSelectable?: boolean; // Is the list for selecting a student (exam mode) or just display (rapid test mode)
}

const StudentList: React.FC<StudentListProps> = ({ studentList, mode, isSelectable = true }) => {
    const { data, saveData } = useAppContext();
    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [editingStudent, setEditingStudent] = useState<Partial<ExamStudent> | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

    if (!data) return null;
    const { selectedStudentId, deleteMode } = data.examAnalysis;

    const handleSelectStudent = (id: string) => {
        if (isSelectable && editingStudentId !== id) {
            const nextData = produce(data, draft => {
                draft.examAnalysis.selectedStudentId = id;
            });
            saveData(nextData);
        }
    };

    const handleAddStudent = () => {
        const newStudent = createStudentObject() as ExamStudent;
        const nextData = produce(data, draft => {
            const activeExam = draft.examAnalysis.exams.find(e => e.id === draft.examAnalysis.activeExamId);
            if (activeExam) {
                activeExam.students.push(newStudent);
            }
            // Also select the new student for immediate editing
            draft.examAnalysis.selectedStudentId = newStudent.id;
        });
        saveData(nextData);

        // Enter edit mode for the new student
        setEditingStudentId(newStudent.id);
        setEditingStudent({ lastName: '', firstName: '', className: '' });
        setTimeout(() => {
            // Focus the new input field's first input
            (document.querySelector(`#student-edit-input-${newStudent.id} input`) as HTMLInputElement)?.focus();
        }, 100);
    };

    const handleRemoveStudent = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const nextData = produce(data, draft => {
            const activeExam = draft.examAnalysis.exams.find(e => e.id === draft.examAnalysis.activeExamId);
            if (activeExam) {
                const studentIndex = activeExam.students.findIndex(s => s.id === id);
                if (studentIndex > -1) {
                    activeExam.students.splice(studentIndex, 1);
                }
            }
        });
        saveData(nextData);
    };
    
    const handleToggleDeleteMode = () => {
        const nextData = produce(data, draft => {
            draft.examAnalysis.deleteMode = !draft.examAnalysis.deleteMode;
        });
        saveData(nextData);
    };

    const processBulkAdd = () => {
        const names = bulkText.split('\n').filter(name => name.trim() !== '');
        const newStudents: ExamStudent[] = names.map(name => {
            const newStudent = createStudentObject() as ExamStudent;
            if (name.includes(',')) {
                const parts = name.split(',');
                newStudent.lastName = parts[0].trim();
                newStudent.firstName = parts.slice(1).join(' ').trim();
            } else {
                const parts = name.split(' ');
                newStudent.firstName = parts[0].trim();
                newStudent.lastName = parts.slice(1).join(' ').trim();
            }
            return newStudent;
        });

        if (newStudents.length > 0) {
            const nextData = produce(data, draft => {
                const activeExam = draft.examAnalysis.exams.find(e => e.id === draft.examAnalysis.activeExamId);
                if (activeExam) {
                    activeExam.students.push(...newStudents);
                }
            });
            saveData(nextData);
        }
        setBulkText('');
        setIsBulkAddOpen(false);
    };

    const handleEditClick = (e: React.MouseEvent, student: ExamStudent) => {
        e.stopPropagation();
        setSelectedStudents(new Set()); // Clear multi-selection
        setEditingStudentId(student.id);
        setEditingStudent({ ...student });
    };

    const handleCancelEdit = () => {
        setEditingStudentId(null);
        setEditingStudent(null);
    };

    const handleSaveEdit = (studentId: string) => {
        const student = studentList.find(s => s.id === studentId);
        if (!student || !editingStudent) return;

        const updatedStudent: ExamStudent = {
            ...student,
            lastName: editingStudent.lastName || '',
            firstName: editingStudent.firstName || '',
            className: editingStudent.className?.trim() || '',
        };

        const nextData = produce(data, draft => {
            const activeExam = draft.examAnalysis.exams.find(e => e.id === draft.examAnalysis.activeExamId);
            const studentToUpdate = activeExam?.students.find(s => s.id === studentId);
            if (studentToUpdate) {
                Object.assign(studentToUpdate, updatedStudent);
            }
        });
        saveData(nextData);
        handleCancelEdit();
    };

    const handleMultiSelectToggle = (studentId: string) => {
        const newSelection = new Set(selectedStudents);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        setSelectedStudents(newSelection);
    };

    const handleMoveSelected = () => {
        if (selectedStudents.size === 0) {
            alert('Please select students to move.');
            return;
        }
        const newClassName = prompt('Enter the new class name for the selected students:');
        if (newClassName !== null) { // Allow empty string to unassign
            studentList.forEach(student => {
                if (selectedStudents.has(student.id)) {
                    const nextData = produce(data, draft => {
                        const activeExam = draft.examAnalysis.exams.find(e => e.id === draft.examAnalysis.activeExamId);
                        const studentToUpdate = activeExam?.students.find(s => s.id === student.id);
                        if (studentToUpdate) {
                            studentToUpdate.className = newClassName.trim();
                        }
                    });
                    saveData(nextData);
                }
            });
            setSelectedStudents(new Set());
        }
    };

    const studentsByClass = useMemo(() => {
        const grouped: { [className: string]: ExamStudent[] } = {};
        studentList.forEach(student => {
            const className = student.className || 'Unassigned';
            if (!grouped[className]) {
                grouped[className] = [];
            }
            grouped[className].push(student);
        });
        // Sort class names, putting "Unassigned" last
        const sortedClassNames = Object.keys(grouped).sort((a, b) => {
            if (a === 'Unassigned') return 1;
            if (b === 'Unassigned') return -1;
            return a.localeCompare(b);
        });

        const result: Array<[string, ExamStudent[]]> = [];
        sortedClassNames.forEach(className => {
            result.push([className, grouped[className].sort((a,b) => a.lastName.localeCompare(b.lastName))]);
        });
        return result;

    }, [studentList]);

    // Focus input when editing starts
    useEffect(() => {
        if (editingStudentId) {
            document.getElementById(`student-edit-input-${editingStudentId}`)?.focus();
        }
    }, [editingStudentId]);

    return (
        <>
            <h3 className="text-lg font-semibold mb-3 text-white">Class List</h3>
            <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {studentsByClass.map(([className, students]) => (
                    <div key={className}>
                        <h4 className="text-sm font-bold text-indigo-300 bg-gray-700/50 px-2 py-1 rounded-t-md">{className}</h4>
                        {students.map(s => (
                             <div key={s.id} onClick={() => handleSelectStudent(s.id)} className={`flex items-center justify-between p-2 rounded-b-md transition-colors border-l border-r border-b border-gray-700 ${ editingStudentId === s.id ? 'bg-gray-700' : (s.id === selectedStudentId && isSelectable) ? 'bg-indigo-600 text-white cursor-pointer' : 'hover:bg-gray-700 cursor-pointer' }`} >
                                <div className="flex items-center gap-2 flex-grow">
                                    <input type="checkbox" checked={selectedStudents.has(s.id)} onChange={() => handleMultiSelectToggle(s.id)} className="form-checkbox h-4 w-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500" />
                                    {editingStudentId === s.id ? (
                                        <div id={`student-edit-input-${s.id}`} className="flex gap-2 w-full">
                                            <input type="text" value={editingStudent?.lastName || ''} onChange={e => setEditingStudent(p => ({...p, lastName: e.target.value}))} className="w-full bg-gray-600 text-white p-1 rounded-md text-sm" placeholder="Last Name" autoFocus />
                                            <input type="text" value={editingStudent?.firstName || ''} onChange={e => setEditingStudent(p => ({...p, firstName: e.target.value}))} className="w-full bg-gray-600 text-white p-1 rounded-md text-sm" placeholder="First Name" />
                                            <input type="text" value={editingStudent?.className || ''} onChange={e => setEditingStudent(p => ({...p, className: e.target.value}))} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(s.id)} onBlur={() => handleSaveEdit(s.id)} className="w-full bg-gray-600 text-white p-1 rounded-md text-sm" placeholder="Class Name" />
                                        </div>
                                    ) : (
                                        <span>{s.lastName || s.firstName ? `${s.lastName || ''}, ${s.firstName || ''}`.trim() : 'Unnamed Student'}</span>
                                    )}
                                </div>
                                {editingStudentId !== s.id && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {!deleteMode && <button onClick={(e) => handleEditClick(e, s)} className="text-gray-400 hover:text-white text-xs opacity-50 hover:opacity-100 transition-opacity" title="Edit Student">✏️</button>}
                                        {deleteMode && <button onClick={(e) => handleRemoveStudent(e, s.id)} className="text-red-400 hover:text-red-300" title="Remove Student">✕</button>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div className="space-y-2 pt-4 border-t border-gray-700">
                <div className="flex gap-2">
                    <button onClick={handleAddStudent} className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Add Student</button>
                    <button onClick={() => setIsBulkAddOpen(true)} className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Bulk Add</button>
                </div>
                {selectedStudents.size > 0 && (
                    <button onClick={handleMoveSelected} className="w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        Move {selectedStudents.size} Selected to Class...
                    </button>
                )}
                <div className="flex items-center justify-center gap-2 pt-2">
                    <label className="text-sm font-medium text-red-400">Delete Mode:</label>
                    <button onClick={handleToggleDeleteMode} type="button" role="switch" aria-checked={deleteMode} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${deleteMode ? 'bg-red-600' : 'bg-gray-600'} transition-colors duration-200 ease-in-out`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${deleteMode ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                </div>
            </div>

            <Modal isOpen={isBulkAddOpen} onClose={() => setIsBulkAddOpen(false)} title="Bulk Add Students">
                <p className="text-sm text-gray-400 mb-2">Paste a list of names, one per line. Supported formats: "LastName, FirstName" or "FirstName LastName".</p>
                <textarea 
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full h-40 p-2 rounded-md bg-gray-600 text-white border border-gray-500"
                    placeholder="Doe, John&#10;Jane Smith"
                ></textarea>
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setIsBulkAddOpen(false)} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Cancel</button>
                    <button onClick={processBulkAdd} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Add Students</button>
                </div>
            </Modal>
        </>
    );
};

export default StudentList;