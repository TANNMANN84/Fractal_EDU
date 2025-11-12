import React, { useState, useRef, useEffect } from 'react';
import type { ClassData, SeatingChart } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { BLANK_SEATING_CHART, DEFAULT_SEATING_PLAN_NAME } from '../constants';
import ConfirmationModal from './ConfirmationModal';

interface ManageSeatingPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData;
  activeSeatingChartName: string;
  setActiveSeatingChartName: (name: string) => void;
}

const ManageSeatingPlansModal: React.FC<ManageSeatingPlansModalProps> = ({
  isOpen,
  onClose,
  classData,
  activeSeatingChartName,
  setActiveSeatingChartName,
}) => {
  const { data, saveData } = useAppContext();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [editingPlanName, setEditingPlanName] = useState<string | null>(null);
  const [editedNameValue, setEditedNameValue] = useState('');
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    setNewPlanName('');
    setEditingPlanName(null);
    setEditedNameValue('');
    onClose();
  };

  const handleAddPlan = () => {
    if (!newPlanName.trim()) return;
    if (classData.seatingCharts?.[newPlanName.trim()]) {
      alert('A seating plan with this name already exists.');
      return;
    }

    const newChart: SeatingChart = { ...BLANK_SEATING_CHART, rows: 5, seatsPerRow: 5, arrangement: Array(5).fill(null).map(() => Array(5).fill(null)) };
    const updatedSeatingCharts = { ...classData.seatingCharts, [newPlanName.trim()]: newChart };
    const updatedClass = { ...classData, seatingCharts: updatedSeatingCharts, activeSeatingChartName: newPlanName.trim() };
    const updatedClasses = data!.classes.map(c => c.classId === classData.classId ? updatedClass : c);
    saveData({ ...data!, classes: updatedClasses });
    setActiveSeatingChartName(newPlanName.trim());
    setNewPlanName('');
  };

  const handleRenamePlan = (oldName: string) => {
    if (!editedNameValue.trim() || editedNameValue.trim() === oldName) {
      setEditingPlanName(null);
      return;
    }
    if (classData.seatingCharts?.[editedNameValue.trim()]) {
      alert('A seating plan with this name already exists.');
      return;
    }

    const updatedSeatingCharts = { ...classData.seatingCharts };
    const chartToRename = updatedSeatingCharts[oldName];
    delete updatedSeatingCharts[oldName];
    updatedSeatingCharts[editedNameValue.trim()] = chartToRename;

    const newActiveName = activeSeatingChartName === oldName ? editedNameValue.trim() : activeSeatingChartName;
    const updatedClass = { ...classData, seatingCharts: updatedSeatingCharts, activeSeatingChartName: newActiveName };
    const updatedClasses = data!.classes.map(c => c.classId === classData.classId ? updatedClass : c);
    saveData({ ...data!, classes: updatedClasses });
    setActiveSeatingChartName(newActiveName);
    setEditingPlanName(null);
  };

  const handleDeletePlan = (name: string) => {
    setConfirmation({
      title: 'Confirm Delete Seating Plan',
      message: `Are you sure you want to delete the seating plan "${name}"? This cannot be undone.`,
      onConfirm: () => {
        const updatedSeatingCharts = { ...classData.seatingCharts };
        delete updatedSeatingCharts[name];

        let newActiveName = activeSeatingChartName;
        if (newActiveName === name) {
          newActiveName = Object.keys(updatedSeatingCharts)[0] || DEFAULT_SEATING_PLAN_NAME;
        }

        const updatedClass = { ...classData, seatingCharts: updatedSeatingCharts, activeSeatingChartName: newActiveName };
        const updatedClasses = data!.classes.map(c => c.classId === classData.classId ? updatedClass : c);
        saveData({ ...data!, classes: updatedClasses });
        setActiveSeatingChartName(newActiveName);
        setConfirmation(null);
      },
    });
  };

  const handleSetActive = (name: string) => {
    const updatedClass = { ...classData, activeSeatingChartName: name };
    const updatedClasses = data!.classes.map(c => c.classId === classData.classId ? updatedClass : c);
    saveData({ ...data!, classes: updatedClasses });
    setActiveSeatingChartName(name);
  };

  return (
    <>
      <dialog ref={dialogRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-md backdrop:bg-black backdrop:opacity-50 border border-gray-300 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">Manage Seating Plans for {classData.className}</h2>
          <button onClick={handleClose} className="text-2xl font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 leading-none">&times;</button>
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Current Plans</h3>
            {Object.keys(classData.seatingCharts || {}).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No seating plans created yet.</p>
            )}
            <ul className="space-y-2">
              {Object.keys(classData.seatingCharts || {}).map(name => (
                <li key={name} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md border dark:border-gray-700">
                  {editingPlanName === name ? (
                    <input
                      type="text"
                      value={editedNameValue}
                      onChange={(e) => setEditedNameValue(e.target.value)}
                      onBlur={() => handleRenamePlan(name)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenamePlan(name); }}
                      className="flex-grow p-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className={`font-medium ${name === activeSeatingChartName ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                      {name} {name === activeSeatingChartName && '(Active)'}
                    </span>
                  )}
                  <div className="flex gap-2 ml-4">
                    {editingPlanName !== name && (
                      <>
                        <button
                          onClick={() => { setEditingPlanName(name); setEditedNameValue(name); }}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => handleSetActive(name)}
                          disabled={name === activeSeatingChartName}
                          className="text-green-600 dark:text-green-400 hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Set Active
                        </button>
                        <button
                          onClick={() => handleDeletePlan(name)}
                          disabled={Object.keys(classData.seatingCharts || {}).length <= 1}
                          className="text-red-600 dark:text-red-400 hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t dark:border-gray-700 pt-4 mt-4">
            <h3 className="font-semibold text-lg mb-2">Add New Plan</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New plan name"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="flex-grow p-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm text-sm"
              />
              <button onClick={handleAddPlan} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-semibold text-sm">
                Add Plan
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end sticky bottom-0">
          <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 font-semibold transition-colors">Close</button>
        </div>
      </dialog>

      {confirmation && (
        <ConfirmationModal
          isOpen={!!confirmation}
          onClose={() => setConfirmation(null)}
          onConfirm={() => confirmation?.onConfirm()}
          title={confirmation.title}
          message={confirmation.message}
        />
      )}
    </>
  );
};

export default ManageSeatingPlansModal;