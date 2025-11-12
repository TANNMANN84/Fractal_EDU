import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Student, NaplanDataSet, WorkSample, EvidenceLogEntry, FileUpload, NoteEntry, DifferentiationEntry, LiteracyEvidenceEntry, NumeracyEvidenceEntry, ReportOptions } from '../types';
import { ATSI_STATUSES, HPGE_STATUSES, HPGE_DOMAINS, NAPLAN_BANDS, NEWMANS_ANALYSIS_TAGS } from '../constants';
import TagInput from './TagInput'; // Import the new component
import AddEvidenceModal from './AddEvidenceModal';
import InlineFileUpload from './InlineFileUpload';
import NotesSection from './NotesSection';
import EditWellbeingSection from './EditWellbeingSection';
import EditLearningSupportSection from './EditLearningSupportSection';
import { storageService } from '../services/storageService';


const getNaplanBandColor = (band: string): string => {
    switch (band) {
        case 'Exceeding': return 'bg-blue-100 border-blue-300 text-blue-900';
        case 'Strong': return 'bg-green-100 border-green-300 text-green-900';
        case 'Developing': return 'bg-yellow-100 border-yellow-300 text-yellow-900';
        case 'Needs additional support': return 'bg-red-100 border-red-300 text-red-900';
        default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
};

interface EditStudentModalProps {
  student: Student;
  onClose: () => void;
  onSave: (updatedStudent: Student) => void;
}

// New component for the Tab button
const TabButton: React.FC<{ title: string; isActive: boolean; onClick: () => void }> = ({ title, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors
      ${isActive
        ? 'border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-300'
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
      }
      focus:outline-none transition-colors`}
    role="tab"
    aria-selected={isActive}
  >
    {title}
  </button>
);

// New component for the Tab content panel
const TabPanel: React.FC<{ isActive: boolean; children: React.ReactNode }> = ({ isActive, children }) => (
  <div
    className={`p-6 ${isActive ? '' : 'hidden'}`}
    role="tabpanel"
  >
    {children}
  </div>
);

const NaplanBandBadge: React.FC<{ band: string }> = ({ band }) => {
    let colorClasses = 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'; // Default for "Not Assessed"
    switch (band) {
        case 'Exceeding':
            colorClasses = 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
            break;
        case 'Strong':
            colorClasses = 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300';
            break;
        case 'Developing':
            colorClasses = 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
            break;
        case 'Needs additional support':
            colorClasses = 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300';
            break;
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
            {band}
        </span>
    );
};

const EditStudentModal: React.FC<EditStudentModalProps> = ({ student, onClose, onSave }) => {
  const { data } = useAppContext();
  const [formData, setFormData] = useState<Student>(student);
  const [isCoreInfoLocked, setIsCoreInfoLocked] = useState(true);
  const [genderSelection, setGenderSelection] = useState<'M' | 'F' | 'Other'>('M');
  const [genderOther, setGenderOther] = useState('');
  const [activeTab, setActiveTab] = useState('Profile'); // State for active tab
  const [newGradePeriod, setNewGradePeriod] = useState('');
  const [newGradeValue, setNewGradeValue] = useState('');
  const [newHpgeEvidenceNote, setNewHpgeEvidenceNote] = useState('');
  const [newHpgeEvidenceLink, setNewHpgeEvidenceLink] = useState('');
  const [newHpgeEvidenceFile, setNewHpgeEvidenceFile] = useState<FileUpload | null>(null);
  const [newSampleTitle, setNewSampleTitle] = useState('');
  const [newSampleLink, setNewSampleLink] = useState('');
  const [newSampleFileUpload, setNewSampleFileUpload] = useState<FileUpload | null>(null);
  const [newSampleComments, setNewSampleComments] = useState('');

  // State for Evidence Log modal
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);

  const wellbeingLogs = useMemo(() => formData.evidenceLog?.filter(log => log.tags?.includes('Wellbeing')) || [], [formData.evidenceLog]);
  const learningSupportLogs = useMemo(() => formData.evidenceLog?.filter(log => log.tags?.includes('Learning Support')) || [], [formData.evidenceLog]);
  const hpgeLogs = useMemo(() => formData.evidenceLog?.filter(log => log.tags?.includes('HPGE')) || [], [formData.evidenceLog]);

  useEffect(() => {
    dialogRef.current?.showModal();
    const currentGender = student.profile.gender;
    if (currentGender === 'M' || currentGender === 'F') {
      setGenderSelection(currentGender);
      setGenderOther('');
    } else {
      setGenderSelection('Other');
      setGenderOther(currentGender);
    }
  }, [student]);
  
  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };

  // Generic handler for nested form data
  const handleDeepChange = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      let currentLevel = { ...prev } as any;
      let finalLevel: any = currentLevel;
      
      for (let i = 0; i < keys.length - 1; i++) {
        finalLevel = finalLevel[keys[i]] = { ...finalLevel[keys[i]] };
      }
      
      finalLevel[keys[keys.length - 1]] = value;
      return currentLevel;
    });
  };

  const handleNaplanChange = (year: 'year7' | 'year9', field: keyof NaplanDataSet, value: string) => {
    handleDeepChange(`academic.naplan.${year}.${field}`, value);
  };

  const handleSave = () => {
    const finalGender = genderSelection === 'Other' ? genderOther.trim() : genderSelection;
    const updatedStudent: Student = {
      ...formData,
      profile: {
        ...formData.profile,
        gender: finalGender,
      }
    };
    onSave(updatedStudent);
    handleClose();
  };

  // --- List Management Handlers ---

  const handleAddReportGrade = () => {
    if (!newGradePeriod || !newGradeValue) return;
    const newGrade = { id: crypto.randomUUID(), period: newGradePeriod, grade: newGradeValue };
    handleDeepChange('academic.reportGrades', [...formData.academic.reportGrades, newGrade]);
    setNewGradePeriod('');
    setNewGradeValue('');
  };
  
  const handleAddHpgeEvidence = () => {
    if (!newHpgeEvidenceNote.trim()) {
      alert('Please provide a note for the evidence.');
      return;
    }
    const newEvidence = {
      id: `hpge-ev-${crypto.randomUUID()}`,
      note: newHpgeEvidenceNote.trim(),
      fileLink: newHpgeEvidenceLink.trim() ? newHpgeEvidenceLink.trim() : undefined,
      evidenceFile: newHpgeEvidenceFile || undefined,
    };
    handleDeepChange('hpge.identificationEvidence', [...formData.hpge.identificationEvidence, newEvidence]);
    setNewHpgeEvidenceNote('');
    setNewHpgeEvidenceLink('');
    setNewHpgeEvidenceFile(null);
  };

  const handleAddWorkSample = () => {
    if (!newSampleTitle.trim() || (!newSampleLink.trim() && !newSampleFileUpload)) {
      alert('Please provide a title and either a file link or an uploaded file.');
      return;
    }

    const newSample: WorkSample = {
      id: `ws-${crypto.randomUUID()}`,
      title: newSampleTitle.trim(),
      comments: newSampleComments.trim() ? newSampleComments.trim() : undefined,
      fileLink: newSampleLink.trim() ? newSampleLink.trim() : undefined,
      fileUpload: newSampleFileUpload || undefined,
    };

    handleDeepChange('workSamples', [...(formData.workSamples || []), newSample]);
    setNewSampleTitle('');
    setNewSampleLink('');
    setNewSampleFileUpload(null);
    setNewSampleComments('');
  };

  const handleSaveLog = (newLog: EvidenceLogEntry) => {
    const updatedLogs = [newLog, ...(formData.evidenceLog || [])];
    handleDeepChange('evidenceLog', updatedLogs);
    setIsAddingEvidence(false);
  };
  
  const handleSaveLiteracyEvidence = (newLog: LiteracyEvidenceEntry) => {
    const updatedLogs = [newLog, ...(formData.academic.learningSupport.literacyEvidence || [])];
    handleDeepChange('academic.learningSupport.literacyEvidence', updatedLogs);
  };

  const handleSaveNumeracyEvidence = (newLog: NumeracyEvidenceEntry) => {
    const updatedLogs = [newLog, ...(formData.academic.learningSupport.numeracyEvidence || [])];
    handleDeepChange('academic.learningSupport.numeracyEvidence', updatedLogs);
  };

  const handleAddDifferentiation = (newEntry: DifferentiationEntry) => {
    const updatedEntries = [...formData.academic.learningSupport.differentiation, newEntry];
    handleDeepChange('academic.learningSupport.differentiation', updatedEntries);
  };
  
  const handleAddNote = (path: 'wellbeing.notes' | 'academic.notes' | 'hpge.notes', content: string) => {
    const keys = path.split('.');
    const newNote: NoteEntry = {
        id: `note-${crypto.randomUUID()}`,
        date: new Date().toISOString(),
        author: data?.teacherProfile?.name || 'Teacher',
        content: content,
    };
    
    let currentNotes: any = formData;
    for(let i = 0; i < keys.length; i++) {
        currentNotes = currentNotes[keys[i]];
    }
    
    handleDeepChange(path, [...(currentNotes || []), newNote]);
  };

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 text-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed";
  const selectClass = inputClass + " bg-white dark:bg-gray-700";
  const fieldsetClass = "space-y-4 p-4 border border-gray-200 rounded-md";
  
  const isYear9NaplanApplicable = formData.profile.currentYearGroup >= 9;
  
  const NaplanDisplay: React.FC<{ title: string, band: string }> = ({ title, band }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400 font-medium">{title}:</span>
        <NaplanBandBadge band={band} />
    </div>
);


  const NaplanEditor: React.FC<{ year: 'year7' | 'year9', disabled?: boolean }> = ({ year, disabled = false }) => (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {(['reading', 'writing', 'spelling', 'grammar', 'numeracy'] as const).map(field => {
          const bandValue = formData.academic.naplan[year][field];
          const colorClass = getNaplanBandColor(bandValue);
          return (
              <div key={field}>
                  <label className={`block text-sm font-medium capitalize ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{field}</label>
                  <select 
                      value={bandValue}
                      onChange={(e) => handleNaplanChange(year, field, e.target.value)}
                      className={`${inputClass} ${!disabled ? colorClass : ''} transition-colors`}
                      disabled={disabled}
                  >
                      {NAPLAN_BANDS.map(band => <option key={band} value={band}>{band}</option>)}
                  </select>
              </div>
          );
      })}
    </div>
  );

  return (
    <>
      <dialog ref={dialogRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-4xl backdrop:bg-black backdrop:opacity-50 border border-gray-300 dark:border-gray-600">
        <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">Edit Profile: {student.firstName} {student.lastName}</h2>
          <button onClick={handleClose} className="text-2xl font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 leading-none">&times;</button>
        </div>
        
        {/* --- TAB NAVIGATION --- */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-[65px] z-10">
          <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
            <TabButton title="Profile" isActive={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
            <TabButton title="Wellbeing & Plans" isActive={activeTab === 'Wellbeing & Plans'} onClick={() => setActiveTab('Wellbeing & Plans')} />
            <TabButton title="Academic" isActive={activeTab === 'Academic'} onClick={() => setActiveTab('Academic')} />
            <TabButton title="Learning Support" isActive={activeTab === 'Learning Support'} onClick={() => setActiveTab('Learning Support')} />
            <TabButton title="HPGE Profile" isActive={activeTab === 'HPGE Profile'} onClick={() => setActiveTab('HPGE Profile')} />
            <TabButton title="Work Samples" isActive={activeTab === 'Work Samples'} onClick={() => setActiveTab('Work Samples')} />
            <TabButton title="Evidence Log" isActive={activeTab === 'Evidence Log'} onClick={() => setActiveTab('Evidence Log')} />
          </nav>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          
          {/* --- TAB 1: PROFILE --- */}
          <TabPanel isActive={activeTab === 'Profile'}>
            <div className="space-y-4">
              <div className="flex justify-end items-center border-b dark:border-gray-700 pb-4">
                <button type="button" onClick={() => setIsCoreInfoLocked(prev => !prev)} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                  {isCoreInfoLocked ? 'Unlock Core Info' : 'Lock Core Info'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>First Name</label><input type="text" value={formData.firstName} onChange={(e) => handleDeepChange('firstName', e.target.value)} className={inputClass} disabled={isCoreInfoLocked}/></div>
                <div><label className={labelClass}>Last Name</label><input type="text" value={formData.lastName} onChange={(e) => handleDeepChange('lastName', e.target.value)} className={inputClass} disabled={isCoreInfoLocked}/></div>
                <div><label className={labelClass}>Date of Birth</label><input type="date" value={formData.profile.dob} onChange={(e) => handleDeepChange('profile.dob', e.target.value)} className={inputClass} disabled={isCoreInfoLocked}/></div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select value={genderSelection} onChange={(e) => setGenderSelection(e.target.value as 'M'|'F'|'Other')} className={selectClass} disabled={isCoreInfoLocked}>
                    <option value="M">M</option>
                    <option value="F">F</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {genderSelection === 'Other' && (
                  <div>
                    <label className={labelClass}>Specify Gender</label>
                    <input type="text" value={genderOther} onChange={(e) => setGenderOther(e.target.value)} className={inputClass} disabled={isCoreInfoLocked} />
                  </div>
                )}
                <div><label className={labelClass}>Pronouns</label><input type="text" value={formData.profile.pronouns} onChange={(e) => handleDeepChange('profile.pronouns', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Current Year Group</label><input type="number" value={formData.profile.currentYearGroup} onChange={(e) => handleDeepChange('profile.currentYearGroup', e.target.valueAsNumber)} className={inputClass} /></div>
                <div>
                  <label className={labelClass}>ATSI Status</label>
                  <select value={formData.profile.atsiStatus} onChange={(e) => handleDeepChange('profile.atsiStatus', e.target.value)} className={selectClass}>
                    {ATSI_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Student Status</label>
                  <select value={formData.profile.status} onChange={(e) => handleDeepChange('profile.status', e.target.value)} className={selectClass}>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </TabPanel>
          
          {/* --- TAB 2: WELLBEING & PLANS --- */}
          <TabPanel isActive={activeTab === 'Wellbeing & Plans'}>
            <EditWellbeingSection
              wellbeingData={formData.wellbeing}
              evidenceLog={wellbeingLogs}
              onWellbeingChange={(newWellbeingData) => handleDeepChange('wellbeing', newWellbeingData)}
            />
          </TabPanel>

          {/* --- TAB 3: ACADEMIC --- */}
          <TabPanel isActive={activeTab === 'Academic'}>
            <div className="space-y-6">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/80 shadow-sm">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2 mb-4">NAPLAN Results</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Year 7</h5>
                    <NaplanEditor year="year7" />
                  </div>
                  <div>
                    <h5 className={`font-medium mb-2 ${isYear9NaplanApplicable ? 'text-gray-700' : 'text-gray-400'}`}>Year 9</h5>
                    <NaplanEditor year="year9" disabled={!isYear9NaplanApplicable} />
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/80 shadow-sm">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2 mb-4">Report Grades</h4>
                <ul className="space-y-2 mb-4">
                  {formData.academic.reportGrades.map((grade) => (
                    <li key={grade.id} className="text-sm dark:text-gray-300"><strong>{grade.period}:</strong> {grade.grade}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input type="text" value={newGradePeriod} onChange={(e) => setNewGradePeriod(e.target.value)} placeholder="Period (e.g., Y10S1)" className={inputClass + " w-1/2"} />
                  <input type="text" value={newGradeValue} onChange={(e) => setNewGradeValue(e.target.value)} placeholder="Grade" className={inputClass + " w-1/4"} />
                  <button type="button" onClick={handleAddReportGrade} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold transition-colors">Add</button>
                </div>
              </div>
              <NotesSection title="Academic Notes" notes={formData.academic.notes || []} onAddNote={(content) => handleAddNote('academic.notes', content)} />
            </div>
          </TabPanel>

          {/* --- TAB 4: LEARNING SUPPORT --- */}
          <TabPanel isActive={activeTab === 'Learning Support'}>
            <EditLearningSupportSection
              student={formData}
              onLearningSupportChange={(newLearningSupportData) => handleDeepChange('academic.learningSupport', newLearningSupportData)}
              onLiteracyEvidenceAdd={handleSaveLiteracyEvidence}
              onNumeracyEvidenceAdd={handleSaveNumeracyEvidence}
              onDifferentiationAdd={handleAddDifferentiation}
            />
          </TabPanel>

          {/* --- TAB 5: HPGE PROFILE --- */}
          <TabPanel isActive={activeTab === 'HPGE Profile'}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>HPGE Status</label>
                  <select value={formData.hpge.status} onChange={(e) => handleDeepChange('hpge.status', e.target.value)} className={selectClass}>
                    {HPGE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>HPGE Domain</label>
                  <select value={formData.hpge.domain} onChange={(e) => handleDeepChange('hpge.domain', e.target.value)} className={selectClass}>
                    {HPGE_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Talent Development Plan</label>
                <textarea value={formData.hpge.talentDevelopmentPlan} onChange={(e) => handleDeepChange('hpge.talentDevelopmentPlan', e.target.value)} rows={4} className={inputClass} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">Identification Evidence</h4>
                <ul className="space-y-2 mb-4">
                  {formData.hpge.identificationEvidence.map((ev) => (
                    <li key={ev.id} className="text-sm bg-gray-100 dark:bg-gray-800 p-2 border dark:border-gray-700 rounded">
                      <p className="text-gray-800 dark:text-gray-300">{ev.note}</p>
                      {(ev.fileLink || ev.evidenceFile) && (
                          <div className="flex items-center gap-4 mt-1">
                              {ev.fileLink && <a href={ev.fileLink} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">View Link</a>}
                              {ev.evidenceFile && <button onClick={() => storageService.triggerDownload(ev.evidenceFile!)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">Download File</button>}
                          </div>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded-lg space-y-3">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Add New Evidence</h5>
                    <div>
                        <label className={labelClass}>Note</label>
                        <textarea value={newHpgeEvidenceNote} onChange={(e) => setNewHpgeEvidenceNote(e.target.value)} rows={3} placeholder="Add new evidence note..." className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div>
                            <label className={labelClass}>Link (optional)</label>
                            <input type="url" value={newHpgeEvidenceLink} onChange={(e) => setNewHpgeEvidenceLink(e.target.value)} placeholder="https://..." className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>File (optional)</label>
                            <InlineFileUpload file={newHpgeEvidenceFile} onUpload={setNewHpgeEvidenceFile} onRemove={() => setNewHpgeEvidenceFile(null)} />
                        </div>
                    </div>
                     <div className="flex justify-end">
                        <button type="button" onClick={handleAddHpgeEvidence} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold transition-colors text-sm">Add Evidence</button>
                    </div>
                </div>
              </div>
              <NotesSection title="HPGE Notes" notes={formData.hpge.notes || []} onAddNote={(content) => handleAddNote('hpge.notes', content)} />
              {/* The EvidenceLogList for HPGE is now part of the HPGE section component if you choose to extract it */}
            </div>
          </TabPanel>
          
          {/* --- TAB 6: WORK SAMPLES --- */}
          <TabPanel isActive={activeTab === 'Work Samples'}>
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-300 mb-2">Add New Work Sample</h3>
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded-lg space-y-4">
                        <div>
                          <label className={labelClass}>Title</label>
                          <input type="text" value={newSampleTitle} onChange={e => setNewSampleTitle(e.target.value)} className={inputClass} placeholder="e.g., Formative Task 1" required />
                        </div>
                         <div>
                            <label className={labelClass}>Teacher Comments (optional)</label>
                            <textarea value={newSampleComments} onChange={e => setNewSampleComments(e.target.value)} className={inputClass} rows={3} placeholder="e.g., Student demonstrated strong understanding of..."></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                             <div>
                                <label className={labelClass}>File Link (optional)</label>
                                <input type="url" value={newSampleLink} onChange={e => setNewSampleLink(e.target.value)} className={inputClass} placeholder="https://..." />
                            </div>
                            <div>
                                <label className={labelClass}>Or Upload File (optional)</label>
                                <InlineFileUpload
                                    file={newSampleFileUpload}
                                    onUpload={setNewSampleFileUpload}
                                    onRemove={() => setNewSampleFileUpload(null)}
                                />
                            </div>
                        </div>
                      <div className="flex justify-end">
                        <button type="button" onClick={handleAddWorkSample} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold text-sm">
                          + Add Sample
                        </button>
                      </div>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-300 mb-2">Logged Work Samples</h3>
                    <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {formData.workSamples && formData.workSamples.length > 0 ? (
                          formData.workSamples.map(sample => (
                            <li key={sample.id} className="p-3 flex flex-col items-start hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="w-full flex justify-between items-center">
                                    <span className="font-medium text-gray-800 dark:text-gray-300 truncate pr-4">{sample.title}</span>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        {sample.fileLink && (
                                            <a href={sample.fileLink} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                                                View Link
                                            </a>
                                        )}
                                        {sample.fileUpload && (
                                            <>
                                                <button onClick={() => storageService.triggerDownload(sample.fileUpload!)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                                                    Download File
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {sample.comments && (
                                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded w-full border-l-4 border-gray-200 dark:border-gray-600 whitespace-pre-wrap">{sample.comments}</p>
                                )}
                            </li>
                          ))
                        ) : (
                          <li className="p-4 text-center text-gray-500 dark:text-gray-400">No work samples have been logged for this student.</li>
                        )}
                      </ul>
                    </div>
                </div>
            </div>
          </TabPanel>

          {/* --- TAB 7: EVIDENCE LOG --- */}
          <TabPanel isActive={activeTab === 'Evidence Log'}>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-300">Evidence Log</h3>
                    <button onClick={() => setIsAddingEvidence(true)} className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-sm font-semibold">
                        + Add Entry
                    </button>
                </div>
                <div className="space-y-4">
                    {formData.evidenceLog.length > 0 ? (
                        formData.evidenceLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                            <div key={log.logId} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{log.tags?.includes('NCCD') && log.adjustment_level ? log.adjustment_level : 'General Observation'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(log.date).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })} by {log.teacher}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end text-sm gap-1">
                                        {log.evidenceLink && <a href={log.evidenceLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">View Link</a>}
                                        {log.evidenceFile && <button onClick={() => storageService.triggerDownload(log.evidenceFile!)} className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Download File</button>}
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{log.note}</p>
                                {log.adjustments_used && log.adjustments_used.length > 0 && (
                                    <div className="mt-2 pt-2 border-t dark:border-gray-700">
                                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Adjustments Used:</p>
                                        <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400">
                                            {log.adjustments_used.map(adj => <li key={adj}>{adj}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {log.tags && log.tags.length > 0 && (
                                    <div className="mt-2 pt-2 border-t dark:border-gray-700 flex items-center gap-2">
                                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Tags:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {log.tags.map(tag => (
                                                <span key={tag} className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No evidence logs recorded for this student.</p>
                    )}
                </div>
            </div>
          </TabPanel>

        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 sticky bottom-0">
          <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 font-semibold transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold transition-colors">Save Changes</button>
        </div>
      </dialog>
      {isAddingEvidence && <AddEvidenceModal onClose={() => setIsAddingEvidence(false)} onSaveLog={handleSaveLog} />}
    </>
  );
};

export default EditStudentModal;
