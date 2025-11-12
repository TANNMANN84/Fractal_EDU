
import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
// FIX: Corrected import paths to be relative.
import type { ClassData, Student, MonitoringDoc } from '../types';
import { useAppContext } from '../contexts/AppContext';
import StudentCard from './StudentCard';
import StudentProfileModal from './StudentProfileModal';
import AddStudentToClassModal from './AddStudentToClassModal';
import GroupingView from './GroupingView';
// FIX: Corrected import path for JuniorMonitoring to be explicit.
import JuniorMonitoring from './JuniorMonitoring';
import { BLANK_MONITORING_DOC_SKELETON } from '../constants';
import StudentListView, { ReportOptions } from './StudentListView';
import ReportGeneratorModal from './ReportGeneratorModal';
import ClassAnalytics from './ClassAnalytics';
import ReportView from './ReportView';
import SeatingPlanView from './SeatingPlanView';
import ConfirmationModal from './ConfirmationModal';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';


interface ClassViewProps {
  classData: ClassData;
}

const VIEW_MODES = ["Grid View", "List View", "Academic View", "Wellbeing/Plans View", "HPGE Profile View", "Seating Plan"];
const DATA_POINT_OPTIONS: { [key: string]: string[] } = {
  "Academic View": [
    "NAPLAN Year 7 - Reading", "NAPLAN Year 7 - Writing", "NAPLAN Year 7 - Spelling", "NAPLAN Year 7 - Grammar & Punctuation", "NAPLAN Year 7 - Numeracy",
    "NAPLAN Year 9 - Reading", "NAPLAN Year 9 - Writing", "NAPLAN Year 9 - Spelling", "NAPLAN Year 9 - Grammar & Punctuation", "NAPLAN Year 9 - Numeracy"
  ],
  "Wellbeing/Plans View": ["Has Behaviour Plan", "Has Learning Plan", "ATSI Status"],
  "HPGE Profile View": ["HPGE Status"],
};

const SORT_OPTIONS = {
    'lastName-asc': 'Surname (A-Z)',
    'lastName-desc': 'Surname (Z-A)',
    'firstName-asc': 'First Name (A-Z)',
    'firstName-desc': 'First Name (Z-A)',
    'gender-asc': 'Gender',
    'custom': 'Custom Order',
};

const SortableStudentCard: React.FC<{student: Student, isRemoveMode: boolean, onCardClick: () => void, onRemoveClick: () => void}> = ({ student, isRemoveMode, onCardClick, onRemoveClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: student.studentId });

    const style: React.CSSProperties = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
    };
    
    return <div ref={setNodeRef} style={style} {...attributes}><StudentCard student={student} isRemoveMode={isRemoveMode} onClick={onCardClick} onRemoveFromClass={onRemoveClick} listeners={listeners} /></div>
};

const ClassView: React.FC<ClassViewProps> = ({ classData }) => {
  const { data, saveData } = useAppContext();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);
  
  // Profiler View State
  const [viewMode, setViewMode] = useState('Default Grid');
  const [sortOrder, setSortOrder] = useState(classData.studentSortOrder ? 'custom' : 'lastName-asc');
  const [dataPoint, setDataPoint] = useState<string | null>(null);

  // Main Tab State
  const [activeTab, setActiveTab] = useState('Student Profiler');

  // Monitoring View State
  const [monitoringDoc, setMonitoringDoc] = useState<MonitoringDoc | null>(null);

  // Report Generation State
  const [isReportGeneratorOpen, setIsReportGeneratorOpen] = useState(false);
  const [reportToShow, setReportToShow] = useState<{ students: Student[], options: ReportOptions } | null>(null);

  const studentsInClass = useMemo(() => {
    return (data?.students.filter(student => classData.studentIds.includes(student.studentId))) ?? [];
  }, [data?.students, classData.studentIds]);

  const sortedStudentsInClass = useMemo<Student[]>(() => {
    const students = [...studentsInClass];
    
    if (sortOrder === 'custom' && classData.studentSortOrder) {
        const studentIdMap = new Map(students.map(s => [s.studentId, s]));
        // Filter out any stale IDs from sort order and add new students to the end
        const orderedStudents = classData.studentSortOrder.map(id => studentIdMap.get(id)).filter(Boolean) as Student[];
        const unOrderedStudents = students.filter(s => !classData.studentSortOrder?.includes(s.studentId));
        return [...orderedStudents, ...unOrderedStudents];
    }

    const [key, direction] = sortOrder.split('-');
    
    students.sort((a, b) => {
        let valA: string | number, valB: string | number;
        if (key === 'firstName' || key === 'lastName') {
            valA = a[key];
            valB = b[key];
        } else { // gender
            valA = a.profile[key as keyof Student['profile']] as string;
            valB = b.profile[key as keyof Student['profile']] as string;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    return students;
  }, [studentsInClass, sortOrder, classData.studentSortOrder]);

  useEffect(() => {
    if (!data) return;

    const currentYear = new Date().getFullYear();
    let doc = data.monitoringDocs.find(d => d.classId === classData.classId && d.year === currentYear);

    if (!doc) {
        // Create, save, and then set the new monitoring doc
        doc = {
            id: `mon-${crypto.randomUUID()}`,
            classId: classData.classId,
            year: currentYear,
            ...BLANK_MONITORING_DOC_SKELETON,
        };
        const updatedDocs = [...data.monitoringDocs, doc];
        saveData({ ...data, monitoringDocs: updatedDocs });
    }
    
    setMonitoringDoc(doc);
  }, [data, classData.classId, saveData]);


  if (!data) return null;

  const handleRemoveStudentFromClass = (studentIdToRemove: string) => {
    const updatedClass = {
        ...classData,
        studentIds: classData.studentIds.filter(id => id !== studentIdToRemove),
    };
    const updatedClasses = data.classes.map(c => c.classId === classData.classId ? updatedClass : c);
    saveData({ ...data, classes: updatedClasses });
    setStudentToRemove(null);
  };

  const handleRemoveClick = (student: Student) => {
    setStudentToRemove(student);
  };
  
  const handleViewModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value;
    setViewMode(newMode);
    if (newMode !== 'Default Grid') setSortOrder('lastName-asc');
    setDataPoint(null); // Reset data point when view mode changes
  };

  const handleSaveMonitoring = (updatedDoc: MonitoringDoc, silent = false) => {
     if (!data) return;
     const docIndex = data.monitoringDocs.findIndex(d => d.id === updatedDoc.id);
     if (docIndex === -1) return; // Should not happen

     const updatedDocs = [...data.monitoringDocs];
     updatedDocs[docIndex] = updatedDoc;
     saveData({ ...data, monitoringDocs: updatedDocs });
     if (!silent) {
        alert('Monitoring document saved!');
     }
  };
  
  const handleGenerateReport = (selectedStudentIds: string[], options: ReportOptions) => {
    const selectedStudents = studentsInClass.filter(s => selectedStudentIds.includes(s.studentId));
    setReportToShow({ students: selectedStudents, options });
    setIsReportGeneratorOpen(false);
  };
  
  const onDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if (!over || active.id === over.id) return;

    // Reorder the array that is currently being displayed
    const reorderedStudents: Student[] = Array.from(sortedStudentsInClass);
    const oldIndex = reorderedStudents.findIndex(s => s.studentId === active.id);
    const newIndex = reorderedStudents.findIndex(s => s.studentId === over.id);
    const [removed] = reorderedStudents.splice(oldIndex, 1);
    if (!removed) return;

    reorderedStudents.splice(newIndex, 0, removed);
    const reorderedStudentIds = reorderedStudents.map(s => s.studentId);
    
    const updatedClass = {
        ...classData,
        studentSortOrder: reorderedStudentIds,
    };

    const updatedClasses = data.classes.map(c => c.classId === classData.classId ? updatedClass : c);
    saveData({ ...data, classes: updatedClasses });
    setSortOrder('custom');
  };

  const renderProfilerContent = () => {
    if (studentsInClass.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg mt-4 bg-gray-50">
                <p className="text-gray-700 font-medium">This class has no students yet.</p>
                <p className="text-sm text-gray-600">Click "Add Student to Class" to get started.</p>
            </div>
        );
    }

    switch(viewMode) {
        case 'Default Grid':
            return (
                <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={sortedStudentsInClass.map(s => s.studentId)} strategy={verticalListSortingStrategy} disabled={sortOrder !== 'custom'}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sortedStudentsInClass.map((student) => (
                                <SortableStudentCard
                                    key={student.studentId}
                                    student={student}
                                    isRemoveMode={isRemoveMode}
                                    onCardClick={() => !isRemoveMode && setSelectedStudent(student)}
                                    onRemoveClick={() => handleRemoveClick(student)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            );
        case 'List View':
            return <StudentListView students={sortedStudentsInClass} onSelectStudent={setSelectedStudent} />;
        case 'Seating Plan': // Pass all seating charts and the active one
            return <SeatingPlanView students={studentsInClass} classData={classData} />; 
        // For Academic, Wellbeing, HPGE views
        default:
            if (dataPoint) {
                return <GroupingView students={studentsInClass} dataPoint={dataPoint} />;
            }
            if (viewMode === 'Seating Plan') return null; // Seating Plan has its own controls
            return (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg mt-4 bg-gray-50">
                    <p className="text-gray-700 font-medium">Please select a data point to group students.</p>
                </div>
            );
    }
  }

  return (
    <div>
        <div className="mb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{classData.className}</h2>
            <div className="mt-2 flex space-x-4 overflow-x-auto">
                {['Student Profiler', 'Junior Monitoring', 'Reports and Analysis'].map(tabName => (
                    <button
                        key={tabName}
                        onClick={() => setActiveTab(tabName)}
                        className={`py-2 px-3 text-sm font-semibold rounded-t-md ${activeTab === tabName ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        {tabName}
                    </button>
                ))}
            </div>
        </div>

      {activeTab === 'Student Profiler' && (
        <>
            <div className="flex justify-between items-start mb-4 pb-2 flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div>
                            <label htmlFor="view-mode-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">View Mode:</label>
                            <select id="view-mode-select" value={viewMode} onChange={handleViewModeChange} className="p-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                                {VIEW_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                            </select>
                        </div>
                        <div className={`${viewMode === 'Seating Plan' ? 'hidden' : ''}`}>
                            {viewMode === 'Default Grid' && (
                                <div>
                                    <label htmlFor="sort-order-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Sort by:</label>
                                    <select id="sort-order-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="p-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                                        {Object.entries(SORT_OPTIONS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        {viewMode !== 'Default Grid' && viewMode !== 'List View' && viewMode !== 'Seating Plan' && (
                            <div>
                                <label htmlFor="data-point-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Data Point:</label>
                                <select id="data-point-select" value={dataPoint || ''} onChange={e => setDataPoint(e.target.value)} className="p-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                                    <option value="" disabled>Select...</option>
                                    {DATA_POINT_OPTIONS[viewMode]?.map(point => <option key={point} value={point}>{point}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <div className={`flex gap-2 ${viewMode === 'Seating Plan' ? 'hidden' : ''}`}>
                    <button onClick={() => setIsRemoveMode(prev => !prev)} className={`px-4 py-2 rounded-md font-semibold transition-colors ${isRemoveMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>
                        {isRemoveMode ? 'Cancel Removal' : 'Remove Students'}
                    </button>
                    <button onClick={() => setIsAddingStudent(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-semibold">
                        Add Student to Class
                    </button>
                </div>
            </div>
            {renderProfilerContent()}
        </>
      )}

      {activeTab === 'Junior Monitoring' && monitoringDoc && (
        <JuniorMonitoring
            students={studentsInClass}
            monitoringDoc={monitoringDoc}
            onSave={handleSaveMonitoring}
            className={classData.className}
            classData={classData}
        />
      )}

      {activeTab === 'Reports and Analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full flex flex-col items-center justify-center text-center">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Report Generation</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Generate detailed PDF reports for individual students or the entire class.</p>
                    <button
                        onClick={() => setIsReportGeneratorOpen(true)}
                        className="mt-4 bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 font-semibold transition-colors"
                    >
                        Launch Report Generator
                    </button>
                </div>
            </div>
            <div className="lg:col-span-2">
                <ClassAnalytics students={studentsInClass} />
            </div>
        </div>
      )}


      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
      
      {isAddingStudent && (
        <AddStudentToClassModal 
            classData={classData}
            onClose={() => setIsAddingStudent(false)}
        />
      )}

      {isReportGeneratorOpen && (
        <ReportGeneratorModal
            students={studentsInClass}
            className={classData.className}
            onClose={() => setIsReportGeneratorOpen(false)}
            onGenerate={handleGenerateReport}
        />
      )}
      
      {reportToShow && (
        <ReportView
            students={reportToShow.students}
            options={reportToShow.options}
            onClose={() => setReportToShow(null)}
        />
      )}

      {studentToRemove && (
        <ConfirmationModal
            isOpen={!!studentToRemove}
            onClose={() => setStudentToRemove(null)}
            onConfirm={() => handleRemoveStudentFromClass(studentToRemove.studentId)}
            title="Confirm Student Removal"
            message={`Are you sure you want to remove ${studentToRemove.firstName} ${studentToRemove.lastName} from this class?`}
        />
      )}
    </div>
  );
};

export default ClassView;
