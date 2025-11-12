import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import type { Student, ClassData, SeatingChart } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { BLANK_SEATING_CHART, DEFAULT_SEATING_PLAN_NAME } from '../constants';
import ManageSeatingPlansModal from './ManageSeatingPlansModal';

interface SeatingPlanViewProps {
  students: Student[];
  classData: ClassData;
}

const Badge: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
    <span className={`text-xs font-semibold mr-1 px-2 py-0.5 rounded-full ${color}`}>
        {children}
    </span>
);

const StudentSeatCard: React.FC<{ student: Student; showGenderColors?: boolean }> = ({ student, showGenderColors = false }) => {
  const getGenderColor = () => {
    if (!showGenderColors) {
      return 'bg-white dark:bg-gray-700';
    }
    switch (student.profile.gender) {
      case 'M':
        return 'bg-blue-100 dark:bg-blue-900/50';
      case 'F':
        return 'bg-pink-100 dark:bg-pink-900/50';
      default:
        return 'bg-green-100 dark:bg-green-900/50';
    }
  };
  return (
    <div className={`p-2 w-full ${getGenderColor()} border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-center cursor-grabbing touch-none transition-colors`}>
      <p className="font-semibold truncate">{student.firstName} {student.lastName}</p>
      <div className="mt-1 flex flex-wrap justify-center gap-1">
        {student.wellbeing.hasBehaviourPlan && <Badge color="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">B</Badge>}
        {student.wellbeing.hasLearningPlan && <Badge color="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300">L</Badge>}
        {student.hpge.status !== 'Not Identified' && <Badge color="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">H</Badge>}
      </div>
    </div>
  );
};
const DraggableStudent: React.FC<{ student: Student; id: string; showGenderColors: boolean; }> = ({ student, id, showGenderColors }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
    data: { studentId: student.studentId },
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 10,
  } : undefined;

  return <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <StudentSeatCard student={student} showGenderColors={showGenderColors} />
    </div>
};

const Seat: React.FC<{ student: Student | undefined; row: number; col: number; showGenderColors: boolean; }> = ({ student, row, col, showGenderColors }) => {
    const droppableId = `seat-${row}-${col}`;
    const { isOver, setNodeRef } = useDroppable({ id: droppableId });

    return (
      <div
        ref={setNodeRef}
        className={`w-36 h-20 border-2 border-dashed rounded-lg flex items-center justify-center p-1
          ${isOver ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'}
        `}
      >
        {student ? (
          <DraggableStudent student={student} id={droppableId} showGenderColors={showGenderColors} />
        ) : (
          <span className="text-gray-400 text-xs">Empty Seat</span>
        )}
      </div>
    );
}

const SeatingPlanView: React.FC<SeatingPlanViewProps> = ({ students, classData }) => {
  const { data, saveData, theme } = useAppContext();
  const [activeSeatingChartName, setActiveSeatingChartName] = useState(classData.activeSeatingChartName || Object.keys(classData.seatingCharts || {})[0] || DEFAULT_SEATING_PLAN_NAME);
  const currentSeatingChart = useMemo(() => {
    return classData.seatingCharts?.[activeSeatingChartName] || BLANK_SEATING_CHART;
  }, [classData.seatingCharts, activeSeatingChartName]);

  const [showGenderColors, setShowGenderColors] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [frontOfRoomOrientation, setFrontOfRoomOrientation] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [isManagePlansModalOpen, setIsManagePlansModalOpen] = useState(false);

  useEffect(() => {
    if (classData.activeSeatingChartName && classData.activeSeatingChartName !== activeSeatingChartName) {
      setActiveSeatingChartName(classData.activeSeatingChartName);
    } else if (!classData.activeSeatingChartName && Object.keys(classData.seatingCharts || {}).length > 0 && activeSeatingChartName === DEFAULT_SEATING_PLAN_NAME) {
      setActiveSeatingChartName(Object.keys(classData.seatingCharts)[0]);
    }
  }, [classData.activeSeatingChartName, classData.seatingCharts]);

  const saveChart = (newChart: SeatingChart) => {
    if (!data) return;
    const updatedClass = {
      ...classData,
      seatingCharts: {
        ...classData.seatingCharts,
        [activeSeatingChartName]: newChart,
      },
    };
    const updatedClasses = data.classes.map(c => c.classId === classData.classId ? updatedClass : c);
    saveData({ ...data, classes: updatedClasses });
  };

  const handleClearCurrentPlan = () => {
    const newChart = { ...currentSeatingChart, arrangement: Array(currentSeatingChart.rows).fill(null).map(() => Array(currentSeatingChart.seatsPerRow).fill(null)) };
    const updatedClass = { ...classData, seatingCharts: { ...classData.seatingCharts, [activeSeatingChartName]: newChart } };
    const updatedClasses = data.classes.map(c => c.classId === classData.classId ? updatedClass : c);
    saveData({ ...data, classes: updatedClasses });
  }

  const handleRandomAssign = () => {
    const emptySeats: { row: number; col: number }[] = [];
    currentSeatingChart.arrangement.forEach((row, r) => {
      row.forEach((seat, c) => {
        if (seat === null) {
          emptySeats.push({ row: r, col: c });
        }
      });
    });

    // Shuffle both lists to ensure randomness
    const shuffledStudents = [...unseatedStudents].sort(() => Math.random() - 0.5);
    const shuffledSeats = [...emptySeats].sort(() => Math.random() - 0.5);

    const newArrangement = currentSeatingChart.arrangement.map(row => [...row]);
    const numToAssign = Math.min(shuffledStudents.length, shuffledSeats.length);

    for (let i = 0; i < numToAssign; i++) {
      const { row, col } = shuffledSeats[i];
      newArrangement[row][col] = shuffledStudents[i].studentId;
    }

    const updatedClass = { ...classData, seatingCharts: { ...classData.seatingCharts, [activeSeatingChartName]: { ...currentSeatingChart, arrangement: newArrangement } } };
    const updatedClasses = data.classes.map(c => c.classId === classData.classId ? updatedClass : c);
    saveData({ ...data, classes: updatedClasses });
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || !active.data.current) return;

    const draggedStudentId = active.data.current.studentId;

    const newArrangement = currentSeatingChart.arrangement.map(row => [...row]);

    // Find and clear the student's original position if they were in a seat
    let sourceCoords: [number, number] | null = null;
    if (active.id.toString().startsWith('seat-')) {
        const [r, c] = active.id.toString().split('-').slice(1).map(Number);
        sourceCoords = [r, c];
    }

    // Handle the drop
    const overId = over.id.toString();

    if (overId.startsWith('seat-')) {
        const [r, c] = overId.split('-').slice(1).map(Number);
        const destRow = r;
        const destCol = c;
        const studentInDestination = newArrangement[r]?.[c];

        // Clear original spot
        if (sourceCoords) {
            newArrangement[sourceCoords[0]][sourceCoords[1]] = studentInDestination || null;
        }

        // Place dragged student
        newArrangement[destRow][destCol] = draggedStudentId;

        // If a student was in the destination, swap them to the source seat if it exists
        if (studentInDestination && sourceCoords) {
            newArrangement[sourceCoords[0]][sourceCoords[1]] = studentInDestination; // This line is redundant, fixed above
        }
    } else if (overId === 'unseated' && sourceCoords) {
        // Dragged from a seat to the unseated list
        newArrangement[sourceCoords[0]][sourceCoords[1]] = null;
    }

    const updatedClass = {
      ...classData,
      seatingCharts: { ...classData.seatingCharts, [activeSeatingChartName]: { ...currentSeatingChart, arrangement: newArrangement } },
    };
    const updatedClasses = data.classes.map(c => c.classId === classData.classId ? updatedClass : c);
    saveData({ ...data, classes: updatedClasses });
  };

  const studentMap = useMemo(() => new Map(students.map(s => [s.studentId, s])), [students]);

  const unseatedStudents = useMemo(() => {
    const seatedIds = new Set(currentSeatingChart.arrangement.flat().filter(Boolean));
    return students.filter(s => !seatedIds.has(s.studentId));
  }, [students, currentSeatingChart.arrangement]);

  const activeStudent = useMemo(() => {
    if (!activeDragId) return null;
    const studentId = activeDragId.split('-').pop();
    return studentMap.get(studentId!) || null;
  }, [activeDragId, studentMap]);
  
  const handleSetActive = (name: string) => {
    if (!data) return;
    const updatedClass = { ...classData, activeSeatingChartName: name };
    const updatedClasses = data.classes.map(c => c.classId === classData.classId ? updatedClass : c);
    saveData({ ...data, classes: updatedClasses });
    setActiveSeatingChartName(name);
  };

  const handleApplyGridSize = () => {
    const currentArrangement = currentSeatingChart.arrangement || [];
    const newArrangement = Array(currentSeatingChart.rows)
      .fill(null)
      .map((_, r) =>
        Array(currentSeatingChart.seatsPerRow)
          .fill(null)
          .map((_, c) => {
            return currentArrangement[r]?.[c] || null;
          })
      );

    const newChart = { ...currentSeatingChart, arrangement: newArrangement };
    saveChart(newChart);
  };

  // Render the seating grid based on orientation
  const renderSeatingGrid = () => {
    const { rows, seatsPerRow, arrangement } = currentSeatingChart;
    const gridElements: React.JSX.Element[] = [];

    // Helper to convert visual (row, col) to internal (row, col) based on orientation
    const getInternalCoordsForRender = (visualRow: number, visualCol: number) => {
      let internalRow: number, internalCol: number;
      if (frontOfRoomOrientation === 'top') {
        internalRow = visualRow;
        internalCol = visualCol;
      } else if (frontOfRoomOrientation === 'bottom') {
        internalRow = rows - 1 - visualRow;
        internalCol = visualCol;
      } else if (frontOfRoomOrientation === 'left') {
        internalRow = visualCol; // Visual column becomes internal row
        internalCol = visualRow; // Visual row becomes internal column
      } else { // 'right'
        internalRow = visualCol; // Visual column becomes internal row
        internalCol = seatsPerRow - 1 - visualRow; // Visual row becomes reversed internal column
      }
      return { internalRow, internalCol };
    };

    if (frontOfRoomOrientation === 'top' || frontOfRoomOrientation === 'bottom') { // Standard row-major display
      for (let visualRow = 0; visualRow < rows; visualRow++) {
        const rowElements = [];
        for (let visualCol = 0; visualCol < seatsPerRow; visualCol++) {
          const { internalRow, internalCol } = getInternalCoordsForRender(visualRow, visualCol);
          const studentId = arrangement[internalRow]?.[internalCol] ?? null;
          rowElements.push(
            <Seat key={`${visualRow}-${visualCol}`} student={studentId ? studentMap.get(studentId) : undefined} row={visualRow} col={visualCol} showGenderColors={showGenderColors} />
          );
        }
        gridElements.push(<div key={visualRow} className="flex gap-3 justify-center">{rowElements}</div>);
      }
    } else { // 'left' or 'right' orientation (transposed visual grid)
      // Visual grid dimensions are swapped: visualRows = seatsPerRow, visualCols = rows
      const visualRows = seatsPerRow;
      const visualCols = rows;

      for (let visualCol = 0; visualCol < visualCols; visualCol++) { // Iterate visual columns
        const colElements = [];
        for (let visualRow = 0; visualRow < visualRows; visualRow++) { // Iterate visual rows within each visual column
          const { internalRow, internalCol } = getInternalCoordsForRender(visualRow, visualCol);
          const studentId = arrangement[internalRow]?.[internalCol] ?? null;
          colElements.push(
            <Seat key={`${visualRow}-${visualCol}`} student={studentId ? studentMap.get(studentId) : undefined} row={visualRow} col={visualCol} showGenderColors={showGenderColors} />
          );
        }
        gridElements.push(<div key={visualCol} className="flex flex-col gap-3 justify-center">{colElements}</div>);
      }
    }

    return gridElements;
  };

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
      <div className="space-y-6">
        <div className="flex items-center flex-wrap gap-4 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
          <div className="flex items-center gap-2">
            <label htmlFor="rows" className="text-sm font-medium">Rows:</label>
            <input
              type="number"
              id="rows"
              min="1"
              value={currentSeatingChart.rows}
              onChange={(e) => saveChart({ ...currentSeatingChart, rows: parseInt(e.target.value, 10) || 1 })}
              className="w-20 p-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="seats" className="text-sm font-medium">Seats per Row:</label>
            <input
              type="number"
              id="seats"
              min="1"
              value={currentSeatingChart.seatsPerRow}
              onChange={(e) => saveChart({ ...currentSeatingChart, seatsPerRow: parseInt(e.target.value, 10) || 1 })}
              className="w-20 p-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm text-sm"
            />
          </div>
          <button onClick={handleApplyGridSize} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-semibold text-sm">
            Apply Grid Size
          </button>
          <button onClick={handleClearCurrentPlan} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-semibold text-sm">
            Clear Current Plan
          </button>
          <button onClick={handleRandomAssign} disabled={unseatedStudents.length === 0} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors font-semibold text-sm">
            Randomly Assign
          </button>
          <div className="flex items-center gap-2">
            <label htmlFor="orientation-select" className="text-sm font-medium">Front of Room:</label>
            <select
              id="orientation-select"
              value={frontOfRoomOrientation}
              onChange={(e) => setFrontOfRoomOrientation(e.target.value as 'top' | 'bottom' | 'left' | 'right')}
              className="p-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show-gender-colors"
              checked={showGenderColors}
              onChange={(e) => setShowGenderColors(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="show-gender-colors" className="ml-2 text-sm font-medium">Show Gender Colours</label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label htmlFor="seating-plan-select" className="text-sm font-medium">Active Plan:</label>
                <select
                  id="seating-plan-select"
                  value={activeSeatingChartName}
                  onChange={(e) => setActiveSeatingChartName(e.target.value)}
                  className="p-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  {Object.keys(classData.seatingCharts || {}).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <button onClick={() => setIsManagePlansModalOpen(true)} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-semibold">
                  Manage Plans
                </button>
              </div>
            </div>
            <div className={`p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 space-y-3 ${frontOfRoomOrientation === 'left' || frontOfRoomOrientation === 'right' ? 'flex flex-row justify-center gap-3' : ''}`}>
              {(frontOfRoomOrientation === 'top' || frontOfRoomOrientation === 'left') && <p className="text-center font-semibold text-gray-500 dark:text-gray-400 text-sm">[ Front of Classroom ]</p>}
              {renderSeatingGrid()}
              {(frontOfRoomOrientation === 'bottom' || frontOfRoomOrientation === 'right') && <p className="text-center font-semibold text-gray-500 dark:text-gray-400 text-sm">[ Front of Classroom ]</p>}
            </div>
          </div>

          <div className="lg:col-span-1">
            <UnseatedStudentsList students={unseatedStudents} showGenderColors={showGenderColors} />
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeDragId && activeStudent ? <StudentSeatCard student={activeStudent} showGenderColors={showGenderColors} /> : null}
      </DragOverlay>
      {isManagePlansModalOpen && (
        <ManageSeatingPlansModal
          isOpen={isManagePlansModalOpen}
          onClose={() => setIsManagePlansModalOpen(false)}
          classData={classData}
          activeSeatingChartName={activeSeatingChartName}
          setActiveSeatingChartName={handleSetActive}
        />
      )}
    </DndContext>
  );
};

const UnseatedStudentsList: React.FC<{ students: Student[]; showGenderColors: boolean; }> = ({ students, showGenderColors }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'unseated' });
  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
      <h3 className="font-bold text-lg mb-4">Unseated Students ({students.length})</h3>
      <div
        ref={setNodeRef}
        className={`space-y-2 p-2 min-h-[200px] rounded-md ${isOver ? 'bg-green-100 dark:bg-green-900/50' : ''}`}
      >
        {students.map((student) => (
          <DraggableStudent key={student.studentId} student={student} id={`unseated-${student.studentId}`} showGenderColors={showGenderColors} />
        ))}
      </div>
    </div>
  );
};

export default SeatingPlanView;