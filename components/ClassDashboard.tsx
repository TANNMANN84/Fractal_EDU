import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import ClassView from './ClassView';
import { BLANK_SEATING_CHART, DEFAULT_SEATING_PLAN_NAME } from '../constants';

const ClassDashboard: React.FC = () => {
  const { data } = useAppContext();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const activeClasses = useMemo(() => {
    return data?.classes.filter(c => c.status === 'Active') ?? [];
  }, [data?.classes]);

  const selectedClass = useMemo(() => {
    const foundClass = activeClasses.find(c => c.classId === selectedClassId);
    if (foundClass && (!foundClass.seatingCharts || Object.keys(foundClass.seatingCharts).length === 0)) {
      return {
        ...foundClass,
        seatingCharts: { [DEFAULT_SEATING_PLAN_NAME]: BLANK_SEATING_CHART },
        activeSeatingChartName: DEFAULT_SEATING_PLAN_NAME,
      };
    }
    if (foundClass && !foundClass.activeSeatingChartName) {
      return {
        ...foundClass,
        activeSeatingChartName: Object.keys(foundClass.seatingCharts!)[0] || DEFAULT_SEATING_PLAN_NAME,
      }
    }
    return foundClass;
  }, [activeClasses, selectedClassId]);

  // Effect to handle selection logic
  useEffect(() => {
    // If there are active classes but none is selected, select the first one.
    if (!selectedClassId && activeClasses.length > 0) {
      setSelectedClassId(activeClasses[0].classId);
    }
    // If the currently selected class is no longer in the active list (e.g., archived),
    // reset selection to the first active class or null.
    if (selectedClassId && !activeClasses.some(c => c.classId === selectedClassId)) {
      setSelectedClassId(activeClasses.length > 0 ? activeClasses[0].classId : null);
    }
  }, [activeClasses, selectedClassId]);


  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">My Classes</h2>
          <p className="text-gray-600 dark:text-gray-400">Select a class to view student profiles and monitoring tools.</p>
        </div>
      </div>

      {activeClasses.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {activeClasses.map(c => (
              <button
                key={c.classId}
                onClick={() => setSelectedClassId(c.classId)}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  selectedClassId === c.classId
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border dark:border-gray-600'
                }`}
              >
                {c.className}
              </button>
            ))}
          </div>
          {selectedClass ? (
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
                <ClassView classData={selectedClass} />
            </div>
          ) : (
            <p>Select a class to begin.</p>
          )}
        </>
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No active classes found.</p>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new class or reactivate an archived one in the Management Console.</p>
        </div>
      )}
    </div>
  );
};

export default ClassDashboard;
