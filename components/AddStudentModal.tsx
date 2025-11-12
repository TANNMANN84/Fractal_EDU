import React, { useState, useEffect, useRef } from 'react';
// FIX: Corrected import paths to be relative.
import type { Student } from '../types';
import { ATSI_STATUSES, BLANK_STUDENT } from '../constants';

interface AddStudentModalProps {
  onClose: () => void;
  onSave: (newStudent: Student) => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState(BLANK_STUDENT);
    const [genderSelection, setGenderSelection] = useState<'M' | 'F' | 'Other' | ''>('');
    const [genderOther, setGenderOther] = useState('');
    const dialogRef = useRef<HTMLDialogElement>(null);
  
    useEffect(() => {
      dialogRef.current?.showModal();
    }, []);

    const handleClose = () => {
        dialogRef.current?.close();
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const [section, key] = name.split('.');

        if (section === 'profile') {
             setFormData(prev => ({
                ...prev,
                profile: { ...prev.profile, [key]: value }
            }));
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = () => {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            alert('First Name and Last Name are required.');
            return;
        }
        
        const finalGender = genderSelection === 'Other' ? genderOther.trim() : genderSelection;
        if (!finalGender) {
            alert('Please select a gender.');
            return;
        }

        const newStudent: Student = {
            ...formData,
            studentId: `student-${crypto.randomUUID()}`,
            profile: {
                ...formData.profile,
                gender: finalGender,
                currentYearGroup: Number(formData.profile.currentYearGroup)
            }
        };

        onSave(newStudent);
        handleClose();
    };

    const labelClass = "block text-sm font-medium text-gray-700";
    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-white text-gray-900";
    const selectClass = inputClass;

    return (
        <dialog ref={dialogRef} onClose={onClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-lg backdrop:bg-black backdrop:opacity-50 border border-gray-300">
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
                <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
            </div>

            <div className="p-6 bg-white text-gray-900 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>First Name</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} required />
                    </div>
                    <div>
                        <label className={labelClass}>Last Name</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} required />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Date of Birth</label>
                        <input type="date" name="profile.dob" value={formData.profile.dob} onChange={handleChange} className={inputClass} />
                    </div>
                     <div>
                        <label className={labelClass}>Current Year Group</label>
                        <input type="number" name="profile.currentYearGroup" value={formData.profile.currentYearGroup} onChange={handleChange} className={inputClass} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>ATSI Status</label>
                        <select name="profile.atsiStatus" value={formData.profile.atsiStatus} onChange={handleChange} className={selectClass}>
                             {ATSI_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Gender</label>
                        <select
                            value={genderSelection}
                            onChange={(e) => setGenderSelection(e.target.value as 'M'|'F'|'Other'|'')}
                            className={selectClass}
                            required
                        >
                            <option value="" disabled>Select...</option>
                            <option value="M">M</option>
                            <option value="F">F</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                 </div>
                {genderSelection === 'Other' && (
                     <div>
                        <label className={labelClass}>Specify Gender</label>
                        <input
                            type="text"
                            value={genderOther}
                            onChange={(e) => setGenderOther(e.target.value)}
                            className={inputClass}
                            placeholder="Please specify"
                        />
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0">
                <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition-colors">Save Student</button>
            </div>
        </dialog>
    );
};

export default AddStudentModal;