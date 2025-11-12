import React, { useState, useRef, useEffect } from 'react';
import type { Student, ReviewPackage } from '../types';
import { BLANK_STUDENT } from '../constants';
import { useAppContext } from '../contexts/AppContext';

interface ImportChoiceModalProps {
  packageData: any; // Could be ReviewPackage or array of student data
  importType: 'review' | 'students';
  onClose: () => void;
  onReview: (pkg: ReviewPackage) => void;
  onMerge: (pkg: ReviewPackage) => void;
  onMergeStudents: (studentsToImport: any[]) => void;
}

const ImportChoiceModal: React.FC<ImportChoiceModalProps> = ({
  packageData,
  importType,
  onClose,
  onReview,
  onMerge,
  onMergeStudents,
}) => {
  const { data } = useAppContext();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [studentPreview, setStudentPreview] = useState<any[]>([]);

  useEffect(() => {
    modalRef.current?.showModal();
    if (importType === 'students' && data) {
      const existingStudentMap = new Map<string, Student>(data.students.map(s => [`${s.firstName.toLowerCase()}-${s.lastName.toLowerCase()}-${s.profile.dob}`, s]));
      const preview = packageData.map((csvStudent: any) => {
        const key = `${csvStudent.firstName?.toLowerCase()}-${csvStudent.lastName?.toLowerCase()}-${csvStudent.dob?.trim()}`;
        const existing = existingStudentMap.get(key);
        return {
          ...csvStudent,
          isDuplicate: !!existing,
          existingStudentId: existing?.studentId,
          selected: !existing, // Default to selecting new students, not duplicates
        };
      });
      setStudentPreview(preview);
      setSelectedStudents(new Set(preview.filter(s => s.selected).map(s => s.existingStudentId || `${s.firstName}-${s.lastName}-${s.dob}`)));
    }
  }, [packageData, importType, data]);

  const handleToggleStudent = (studentId: string | undefined, isSelected: boolean) => {
    if (!studentId) return;
    const newSelection = new Set(selectedStudents);
    if (isSelected) {
      newSelection.add(studentId);
    } else {
      newSelection.delete(studentId);
    }
    setSelectedStudents(newSelection);
    setStudentPreview(prev => prev.map(s =>
      (s.studentId || `${s.firstName}-${s.lastName}-${s.dob}`) === studentId
        ? { ...s, selected: isSelected }
        : s
    ));
  };

  const handleConfirmStudents = () => {
    const studentsToProcess = studentPreview.filter(s => s.selected);
    onMergeStudents(studentsToProcess);
    onClose();
  };

  const handleClose = () => {
    modalRef.current?.close();
    onClose();
  };

  if (importType === 'review') {
    const pkg = packageData as ReviewPackage;
    return (
      <dialog ref={modalRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-lg backdrop:bg-black backdrop:opacity-50 border border-gray-300">
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900">Review Package Detected</h2>
          <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">×</button>
        </div>
        <div className="p-6 bg-white space-y-4">
          <p className="text-gray-700">
            The file you imported is a review package for the class: <strong className="text-indigo-700">{pkg.classData.className}</strong>.
          </p>
          <p className="text-gray-600">Please choose how you would like to proceed:</p>
          <div className="mt-4 space-y-3">
            <button onClick={() => onReview(pkg)} type="button" className="w-full text-left p-4 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
              <h3 className="font-bold text-blue-800">Open in Review Mode</h3>
              <p className="text-sm text-blue-700">Choose this if you are a <strong>Head Teacher</strong> or reviewer. This will open the document in a safe, read-only mode for you to sign.</p>
            </button>
            <button onClick={() => onMerge(pkg)} type="button" className="w-full text-left p-4 border border-green-300 rounded-lg hover:bg-green-50 transition-colors">
              <h3 className="font-bold text-green-800">Merge Signatures</h3>
              <p className="text-sm text-green-700">Choose this if you are the <strong>original teacher</strong> and have received the signed document back. This will merge the Head Teacher's signature into your data.</p>
            </button>
          </div>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t sticky bottom-0">
          <button onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold transition-colors">Cancel</button>
        </div>
      </dialog>
    );
  }

  if (importType === 'students') {
    const newStudentsCount = studentPreview.filter(s => !s.isDuplicate && s.selected).length;
    const updatedStudentsCount = studentPreview.filter(s => s.isDuplicate && s.selected).length;
    const totalSelected = newStudentsCount + updatedStudentsCount;

    return (
      <dialog ref={modalRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-2xl backdrop:bg-black backdrop:opacity-50 border border-gray-300">
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900">Confirm Student Import</h2>
          <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">×</button>
        </div>
        <div className="p-6 bg-white space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-gray-700">
            The CSV file contains <strong className="text-indigo-700">{packageData.length}</strong> student entries.
            Please review and select which students to import or update.
          </p>
          <div className="border rounded-lg overflow-hidden">
            <div className="flex bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              <div className="w-1/12 p-3"></div>
              <div className="w-5/12 p-3">Student Name</div>
              <div className="w-3/12 p-3">DOB</div>
              <div className="w-3/12 p-3">Status</div>
            </div>
            <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
              {studentPreview.map((s, index) => (
                <li key={index} className="flex items-center hover:bg-gray-50">
                  <div className="w-1/12 p-3">
                    <input
                      type="checkbox"
                      checked={s.selected}
                      onChange={(e) => handleToggleStudent(s.studentId || `${s.firstName}-${s.lastName}-${s.dob}`, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="w-5/12 p-3 text-sm text-gray-900">{s.firstName} {s.lastName}</div>
                  <div className="w-3/12 p-3 text-sm text-gray-500">{s.dob}</div>
                  <div className="w-3/12 p-3 text-sm">
                    {s.isDuplicate ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Update
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        New
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-4 bg-gray-100 border-t flex justify-end gap-2 sticky bottom-0">
          <button onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold transition-colors">Cancel</button>
          <button
            onClick={handleConfirmStudents}
            disabled={totalSelected === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            Confirm Import ({totalSelected})
          </button>
        </div>
      </dialog>
    );
  }

  return null;
};

export default ImportChoiceModal;