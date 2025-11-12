import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { AppData, Student, ClassData, ReviewPackage, Teacher, BackupFile, StudentTransferPackage, ClassTransferPackage } from '../types';
import AddStudentModal from './AddStudentModal';
import CreateClassModal from './CreateClassModal';
import ImportChoiceModal from './ImportChoiceModal';
import ManageStudentsModal from './ManageStudentsModal';
import { BLANK_STUDENT, BLANK_SEATING_CHART, DEFAULT_SEATING_PLAN_NAME } from '../constants';
import { storageService } from '../services/storageService';
import ConfirmationModal from './ConfirmationModal';
import RolloverModal from './RolloverModal';
import ReviewModal from './ReviewModal';
import ClassAdminModal from './ClassAdminModal';


type TabName = 'Profile' | 'Students' | 'Classes' | 'System';

// Helper to update file IDs in an imported object
const updateFileIdsInObject = (obj: any, fileIdMap: { [oldId: string]: string }): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => updateFileIdsInObject(item, fileIdMap));
    
    const newObj = { ...obj };
    // Check if it's a FileUpload object and needs its ID replaced
    if (newObj.id && newObj.name && typeof newObj.id === 'string' && fileIdMap[newObj.id]) {
        newObj.id = fileIdMap[newObj.id];
    }
    // Recurse through properties
    for (const key in newObj) {
        newObj[key] = updateFileIdsInObject(newObj[key], fileIdMap);
    }
    return newObj;
};

const ManagementConsole: React.FC = () => {
    const { data, saveData, theme, toggleTheme } = useAppContext();
    
    const defaultTab = data?.teacherProfile?.name ? 'Students' : 'Profile';
    const [activeTab, setActiveTab] = useState<TabName>(defaultTab);

    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
    const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
    const [isClassAdminOpen, setIsClassAdminOpen] = useState(false);
    const [isRolloverOpen, setIsRolloverOpen] = useState(false);
    const [reviewPackage, setReviewPackage] = useState<ReviewPackage | null>(null);
    const [importChoicePackage, setImportChoicePackage] = useState<{ type: 'review' | 'students'; data: any } | null>(null);
    const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

    const [teacherProfile, setTeacherProfile] = useState<Teacher>(data?.teacherProfile || { name: '', email: '' });

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        setTeacherProfile(data?.teacherProfile || { name: '', email: '' });
        if (data?.teacherProfile?.name && activeTab === 'Profile') {
            setActiveTab('Students');
        }
    }, [data?.teacherProfile]);

    const handleAddStudent = (newStudent: Student) => {
        if (!data) return;
        saveData({ ...data, students: [...data.students, newStudent] });
    };

    const handleCreateClass = (newClassData: { className: string; teacher: string }) => {
        if (!data) return;
        const newClass: ClassData = { ...newClassData, classId: `class-${crypto.randomUUID()}`, studentIds: [], status: 'Active', seatingCharts: { [DEFAULT_SEATING_PLAN_NAME]: BLANK_SEATING_CHART }, activeSeatingChartName: DEFAULT_SEATING_PLAN_NAME };
        saveData({ ...data, classes: [...data.classes, newClass] });
    };
    
    const handleSaveTeacherProfile = () => {
        if (!data) return;
        if (!teacherProfile.name.trim()) {
            alert('Teacher name cannot be empty.');
            return;
        }
        saveData({ ...data, teacherProfile });
        alert('Teacher profile saved successfully.');
    };

    const handleExport = async () => {
        if (!data) return;
        
        try {
            const files = await storageService.getAllFileContents();
            const backupData: BackupFile = { dataType: 'fullBackup', appData: data, files };

            const fileName = `fractal_edu_student_profiler_backup_${new Date().toISOString().split('T')[0]}.json`;
            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error("Failed to export data:", error);
            alert("An error occurred during export. Please check the console for details.");
        }
    };
    
    const handleResetData = () => {
        setConfirmation({
            title: 'Confirm Data Reset',
            message: 'Are you sure you want to completely reset all application data? This action is permanent and cannot be undone.',
            onConfirm: async () => {
                const blankData: AppData = {
                    students: [], classes: [], monitoringDocs: [], teacherProfile: null,
                    examAnalysis: {
                        appMode: 'exam',
                        rapidTests: [],
                        exams: [],
                        activeExamId: '',
                        rapidTestStudents: [],
                        deleteMode: false,
                        selectedStudentId: '',
                        activeTags: [],
                        rankingSort: {
                            key: '',
                            direction: 'asc'
                        }
                    }
                };
                await storageService.clearFileContent();
                saveData(blankData);
                alert('All data has been reset.');
                setActiveTab('Profile');
            }
        });
    };

    const handleImportClick = () => { fileInputRef.current?.click(); };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                try {
                    if (file.name.endsWith('.csv')) {
                        const rows = text.split(/\r\n|\n/);
                        const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/\s/g, ''));
                        const studentsData = rows.slice(1).filter(row => row.trim() !== '').map(row => {
                            const values = row.split(',');
                            const studentObject = headers.reduce((obj, header, index) => {
                                const headerMap: { [key: string]: string } = { 'firstname': 'firstName', 'lastname': 'lastName', 'dob': 'dob', 'gender': 'gender', 'atsistatus': 'atsiStatus', 'yeargroup': 'currentYearGroup' };
                                const key = headerMap[header] || header;
                                obj[key] = values[index]?.trim();
                                return obj;
                            }, {} as { [key: string]: string });
                            return studentObject;
                        });
                        setImportChoicePackage({ type: 'students', data: studentsData });
                    } else {
                        const importedData = JSON.parse(text); // This will be either a backup or a review/transfer package
                         
                        // Legacy backup check: If dataType is missing but appData exists, assume it's an old backup.
                        if (!importedData.dataType && importedData.appData) {
                            importedData.dataType = 'fullBackup';
                        } else if (!importedData.dataType) {
                            throw new Error('Imported JSON file is missing the required "dataType" property.');
                        }

                        switch (importedData.dataType) {
                            case 'reviewPackage':
                                setImportChoicePackage({ type: 'review', data: importedData as ReviewPackage });
                                break;
                            case 'studentTransfer':
                                handleImportStudentTransfer(importedData as StudentTransferPackage);
                                break;
                            case 'classTransfer':
                                handleImportClassTransfer(importedData as ClassTransferPackage);
                                break;
                            case 'fullBackup':
                                setConfirmation({
                                    title: 'Confirm Full Backup Import',
                                    message: "Are you sure you want to overwrite all current data with this backup file? This cannot be undone.",
                                    onConfirm: async () => {
                                        const backup = importedData as BackupFile;
                                        await storageService.clearFileContent();
                                        for (const id in backup.files) {
                                            await storageService.saveFileContent(id, backup.files[id]);
                                        }
                                        saveData(backup.appData);
                                        alert('Backup restored successfully.');
                                        setConfirmation(null);
                                    }
                                });
                                break;
                            default:
                                throw new Error(`Unknown data type: ${importedData.dataType}`);
                        }
                    }
                } catch (error) {
                    alert(`Error: The selected file is not valid. ${error instanceof Error ? error.message : ''}`);
                } finally {
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };
            reader.readAsText(file);
        }
    };
    
     const handleImportStudentTransfer = async (pkg: StudentTransferPackage) => {
        if (!data) return;
        setConfirmation({
            title: 'Confirm Student Import',
            message: `Are you sure you want to import the profile for ${pkg.student.firstName} ${pkg.student.lastName}?`,
            onConfirm: async () => {
                try {
                    const fileIdMap: { [oldId: string]: string } = {};
                    for (const oldId in pkg.files) {
                        const newId = `file-${crypto.randomUUID()}`;
                        fileIdMap[oldId] = newId;
                        await storageService.saveFileContent(newId, pkg.files[oldId]);
                    }

                    let updatedStudent = updateFileIdsInObject(pkg.student, fileIdMap);

                    if (data.students.some(s => s.studentId === updatedStudent.studentId)) {
                        updatedStudent.studentId = `student-${crypto.randomUUID()}`;
                    }

                    const updatedStudents = [...data.students, updatedStudent];
                    saveData({ ...data, students: updatedStudents });
                    alert(`${updatedStudent.firstName} has been successfully imported.`);
                } catch (err) {
                    alert('An error occurred during student import.');
                    console.error(err);
                } finally {
                    setConfirmation(null);
                }
            }
        });
    };

    const handleImportClassTransfer = async (pkg: ClassTransferPackage) => {
        if (!data) return;
        setConfirmation({
            title: 'Confirm Class Import',
            message: `Are you sure you want to import the class package for "${pkg.classData.className}"? This will add the class, its monitoring doc, and ${pkg.students.length} students.`,
            onConfirm: async () => {
                try {
                    const fileIdMap: { [oldId: string]: string } = {};
                    for (const oldId in pkg.files) {
                        const newId = `file-${crypto.randomUUID()}`;
                        fileIdMap[oldId] = newId;
                        await storageService.saveFileContent(newId, pkg.files[oldId]);
                    }

                    const newStudents = pkg.students.map(s => {
                        let student = updateFileIdsInObject(s, fileIdMap);
                        if (data.students.some(existing => existing.studentId === student.studentId)) {
                            student.studentId = `student-${crypto.randomUUID()}`;
                        }
                        return student;
                    });
                    
                    let newClass = updateFileIdsInObject(pkg.classData, fileIdMap);
                    if (data.classes.some(c => c.classId === newClass.classId)) {
                        newClass.classId = `class-${crypto.randomUUID()}`;
                    }
                    newClass.studentIds = newStudents.map(s => s.studentId);
                    
                    let newMonitoringDoc = pkg.monitoringDoc ? updateFileIdsInObject(pkg.monitoringDoc, fileIdMap) : null;
                    if (newMonitoringDoc && data.monitoringDocs.some(d => d.id === newMonitoringDoc.id)) {
                        newMonitoringDoc.id = `mon-${crypto.randomUUID()}`;
                    }
                    if (newMonitoringDoc) newMonitoringDoc.classId = newClass.classId;

                    const finalStudents = [...data.students, ...newStudents];
                    const finalClasses = [...data.classes, newClass];
                    const finalDocs = newMonitoringDoc ? [...data.monitoringDocs, newMonitoringDoc] : data.monitoringDocs;

                    saveData({ ...data, students: finalStudents, classes: finalClasses, monitoringDocs: finalDocs });
                    alert(`Class "${newClass.className}" has been successfully imported.`);
                } catch (err) {
                    alert('An error occurred during class import.');
                    console.error(err);
                } finally {
                    setConfirmation(null);
                }
            }
        });
    };
    
    const handleMergeStudents = (newStudentsData: any[]) => {
      if (!data) return;
      let addedCount = 0;
      let updatedCount = 0;
      // Create a map for efficient lookup of existing students by a unique key
      const currentStudentsMap = new Map(data.students.map(s => [`${s.firstName.toLowerCase()}-${s.lastName.toLowerCase()}-${s.profile.dob}`, s]));
      const updatedStudentsList = [...data.students]; // Start with a copy of current students

      newStudentsData.forEach(newStudentData => {
        // Create a unique key for comparison
        const key = `${newStudentData.firstName?.toLowerCase()}-${newStudentData.lastName?.toLowerCase()}-${newStudentData.dob?.trim()}`;
        const existingStudent = currentStudentsMap.get(key) as Student | undefined;

        // Prepare the new student's profile data from the CSV
        const studentProfile: Student = JSON.parse(JSON.stringify(BLANK_STUDENT));
        studentProfile.firstName = newStudentData.firstName.trim();
        studentProfile.lastName = newStudentData.lastName.trim();
        studentProfile.profile.dob = newStudentData.dob?.trim() || '';

        const genderValue = (newStudentData.gender || '').trim().toUpperCase();
        if (genderValue === 'MALE') {
          studentProfile.profile.gender = 'M';
        } else if (genderValue === 'FEMALE') {
          studentProfile.profile.gender = 'F';
        } else {
          studentProfile.profile.gender = genderValue;
        }

        studentProfile.profile.atsiStatus = newStudentData.atsiStatus?.trim() || 'Not Stated';
        studentProfile.profile.currentYearGroup = newStudentData.currentYearGroup ? parseInt(newStudentData.currentYearGroup, 10) : 7;
        
        // If a student with the same identifying details exists, update them
        if (existingStudent) {
          // Update only the profile fields that are present in the CSV
          if (existingStudent) {
            Object.assign(existingStudent.profile, studentProfile.profile);
          }
          updatedCount++;
        } else {
          // Otherwise, add a new student
          updatedStudentsList.push({ ...studentProfile, studentId: `student-${crypto.randomUUID()}` });
          addedCount++;
        }
      });

      saveData({ ...data, students: updatedStudentsList });
      alert(`Import complete. Added ${addedCount} new students. Updated ${updatedCount} existing students.`);
      setImportChoicePackage(null);
    };

    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,FirstName,LastName,DOB,Gender,ATSIStatus,YearGroup\n";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
     const handleMergeReview = (pkg: ReviewPackage) => {
        if (!data) return;
        const docIndex = data.monitoringDocs.findIndex(d => d.id === pkg.monitoringDoc.id);
        if (docIndex === -1) { alert("Error: Could not find the original monitoring document to merge with."); return; }
        
        const updatedDocs = [...data.monitoringDocs];
        const originalDoc = updatedDocs[docIndex];
        Object.keys(pkg.monitoringDoc.headTeacherSignOff).forEach(termStr => {
            const term = termStr as keyof typeof pkg.monitoringDoc.headTeacherSignOff;
            const signedOff = pkg.monitoringDoc.headTeacherSignOff[term];
            if (signedOff?.date) { originalDoc.headTeacherSignOff[term] = signedOff; }
        });
        saveData({ ...data, monitoringDocs: updatedDocs });
        alert(`Signatures for ${pkg.classData.className} successfully merged.`);
        setImportChoicePackage(null);
    };

    const NavButton: React.FC<{ name: TabName, color: string }> = ({ name, color }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`w-full text-left font-semibold p-3 rounded-md transition-colors text-sm ${ activeTab === name ? `bg-${color}-100 text-${color}-700 dark:bg-gray-900 dark:text-${color}-400` : `text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`
            }`}
        >
            {name}
        </button>
    );

    return (
        <div className="flex flex-col md:flex-row gap-8 items-start">
            <nav className="w-full md:w-64 bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-2 flex-shrink-0">
                <NavButton name="Profile" color="blue" />
                <NavButton name="Students" color="green" />
                <NavButton name="Classes" color="purple" />
                <NavButton name="System" color="red" />
            </nav>

            <div className="flex-1 w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                {activeTab === 'Profile' && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">My Teacher Profile</h2>
                        <p className="text-gray-600 dark:text-gray-400">Manage your personal details. This information will be used to auto-fill your name when creating classes and signing documents.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                <input type="text" value={teacherProfile.name} onChange={e => setTeacherProfile(p => ({ ...p, name: e.target.value }))} className="mt-1 w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (optional)</label>
                                <input type="email" value={teacherProfile.email} onChange={e => setTeacherProfile(p => ({ ...p, email: e.target.value }))} className="mt-1 w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={handleSaveTeacherProfile} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold">Save Profile</button>
                        </div>
                    </div>
                )}
                {activeTab === 'Students' && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Student Management</h2>
                        <p className="text-gray-600 dark:text-gray-400">Add, manage, and import students. To edit a student's full profile, find them in a class on the Dashboard.</p>
                        <div className="flex flex-wrap gap-2 pt-4 border-t">
                            <button onClick={() => setIsAddStudentOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold">Add New Student</button>
                            <button onClick={() => setIsManageStudentsOpen(true)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Manage All Students</button>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg mt-4">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Bulk Import from CSV</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Bulk-create student profiles by uploading a CSV file. Download the template to ensure your column headers are correct.</p>
                             <div className="mt-3 flex items-center gap-2">
                                <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white text-sm font-semibold rounded-md hover:bg-gray-700 dark:hover:bg-gray-600">Download CSV Template</button>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    <p className="font-medium">Then, go to the 'System' tab to upload your file.</p>
                                    <button onClick={() => setActiveTab('System')} className="text-blue-600 dark:text-blue-400 hover:underline">Go to System Tab &rarr;</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'Classes' && (
                     <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Class Management</h2>
                        <p className="text-gray-600 dark:text-gray-400">Create new class shells and manage existing ones (edit, archive, delete).</p>
                        <div className="flex flex-wrap gap-2 pt-4 border-t">
                            <button onClick={() => setIsCreateClassOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold">Create New Class</button>
                            <button onClick={() => setIsClassAdminOpen(true)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Manage All Classes</button>
                        </div>
                    </div>
                )}
                {activeTab === 'System' && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">System Actions</h2>
                        <p className="text-gray-600 dark:text-gray-400">Manage application settings, import/export data, and perform system-wide actions like the annual rollover.</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json,.csv,.profiler-review" onChange={handleFileImport} />

                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg mt-4 space-y-3">
                             <h3 className="font-semibold text-gray-800 dark:text-gray-200">Data Import & Export</h3>
                             <p className="text-sm text-gray-600 dark:text-gray-400">Use the "Import Data File" button to load a full backup, a student CSV, a review package, or a transfer package. Use "Export Full Backup" to save a copy of all your data.</p>
                             <div className="flex flex-wrap gap-2">
                                <button onClick={handleImportClick} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 font-semibold">Import Data File...</button>
                                <button onClick={handleExport} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Export Full Backup</button>
                            </div>
                        </div>
                        
                         <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg mt-4 space-y-3">
                             <h3 className="font-semibold text-gray-800 dark:text-gray-200">Annual School Rollover</h3>
                             <p className="text-sm text-gray-600 dark:text-gray-400">Run the guided process to prepare the application for a new school year. This will promote students, export their profiles, and archive classes.</p>
                             <button onClick={() => setIsRolloverOpen(true)} className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-semibold">Prepare for New School Year</button>
                        </div>
                        
                         <div className="p-4 bg-red-50 border border-red-200 rounded-lg mt-4 space-y-3">
                             <h3 className="font-semibold text-red-800">Reset Application Data</h3>
                             <p className="text-sm text-red-700">Permanently delete all students, classes, and monitoring documents. This action cannot be undone.</p>
                             <button onClick={handleResetData} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">Reset All Data</button>
                        </div>
                    </div>
                )}
            </div>

            {isAddStudentOpen && <AddStudentModal onClose={() => setIsAddStudentOpen(false)} onSave={handleAddStudent} />}
            {isCreateClassOpen && <CreateClassModal onClose={() => setIsCreateClassOpen(false)} onSave={handleCreateClass} />}
            {isManageStudentsOpen && <ManageStudentsModal isOpen={isManageStudentsOpen} onClose={() => setIsManageStudentsOpen(false)} />}
            {isClassAdminOpen && <ClassAdminModal isOpen={isClassAdminOpen} onClose={() => setIsClassAdminOpen(false)} />}
            {isRolloverOpen && <RolloverModal isOpen={isRolloverOpen} onClose={() => setIsRolloverOpen(false)} />}
            {reviewPackage && <ReviewModal packageData={reviewPackage} onClose={() => setReviewPackage(null)} />}
            {importChoicePackage && (
                <ImportChoiceModal 
                    packageData={importChoicePackage.data}
                    importType={importChoicePackage.type}
                    onClose={() => setImportChoicePackage(null)}
                    onReview={(pkg) => { setReviewPackage(pkg); setImportChoicePackage(null); }}
                    onMerge={handleMergeReview}
                    onMergeStudents={handleMergeStudents}
                />
            )}
             <ConfirmationModal
                isOpen={!!confirmation}
                onClose={() => setConfirmation(null)}
                onConfirm={() => confirmation?.onConfirm()}
                title={confirmation?.title || ''}
                message={confirmation?.message || ''}
            />
        </div>
    );
};

export default ManagementConsole;