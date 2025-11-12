import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { BLANK_SEATING_CHART, DEFAULT_SEATING_PLAN_NAME } from '../constants';

interface CreateClassModalProps {
  onClose: () => void;
  onSave: (newClass: { className: string; teacher: string }) => void;
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({ onClose, onSave }) => {
    const { data } = useAppContext();
    const [className, setClassName] = useState('');
    const [teacher, setTeacher] = useState(data?.teacherProfile?.name || '');
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => { dialogRef.current?.showModal(); }, []);

    const handleSave = () => {
        if (!className.trim() || !teacher.trim()) {
            alert("Class Name and Teacher Name are required.");
            return;
        }
        onSave({
            className: className.trim(),
            teacher: teacher.trim(),
        });
        onClose();
    };
  
    const handleClose = () => {
        dialogRef.current?.close();
        onClose();
    };
    
    const labelClass = "block text-sm font-medium text-gray-700";
    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-white";

    return (
        <dialog ref={dialogRef} onClose={onClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-md backdrop:bg-black backdrop:opacity-50 border border-gray-300">
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-900">Create New Class Shell</h2>
                <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
            </div>

            <div className="p-6 bg-white text-gray-900 space-y-4">
                <div>
                    <label htmlFor="className" className={labelClass}>Class Name</label>
                    <input type="text" id="className" value={className} onChange={e => setClassName(e.target.value)} className={inputClass} placeholder="e.g., 7A English"/>
                </div>
                <div>
                    <label htmlFor="teacher" className={labelClass}>Teacher Name</label>
                    <input type="text" id="teacher" value={teacher} onChange={e => setTeacher(e.target.value)} className={inputClass} placeholder="e.g., Ms. Jones"/>
                </div>
            </div>

            <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0">
                <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={!className.trim() || !teacher.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-semibold transition-colors">
                    Save Class
                </button>
            </div>
        </dialog>
    );
};

export default CreateClassModal;