import React, { useState } from 'react';
import type { Student, LearningSupport, LiteracyEvidenceEntry, NumeracyEvidenceEntry, DifferentiationEntry, FileUpload } from '../types';
import { NEWMANS_ANALYSIS_TAGS } from '../constants';
import { storageService } from '../services/storageService';
import AddLiteracyEvidenceModal from './AddLiteracyEvidenceModal';
import AddNumeracyEvidenceModal from './AddNumeracyEvidenceModal';
import InlineFileUpload from './InlineFileUpload';
import { EvidenceLogList } from './EvidenceLogList';

const NaplanDisplay: React.FC<{ title: string, band: string }> = ({ title, band }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400 font-medium">{title}:</span>
        <NaplanBandBadge band={band} />
    </div>
);

const NaplanBandBadge: React.FC<{ band: string }> = ({ band }) => {
    let colorClasses = 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'; // Default for "Not Assessed"
    switch (band) {
        case 'Exceeding': colorClasses = 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'; break;
        case 'Strong': colorClasses = 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'; break;
        case 'Developing': colorClasses = 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'; break;
        case 'Needs additional support': colorClasses = 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'; break;
    }
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>{band}</span>;
};

interface EditLearningSupportSectionProps {
    student: Student;
    onLearningSupportChange: (newLearningSupportData: LearningSupport) => void;
    onLiteracyEvidenceAdd: (newEntry: LiteracyEvidenceEntry) => void;
    onNumeracyEvidenceAdd: (newEntry: NumeracyEvidenceEntry) => void;
    onDifferentiationAdd: (newEntry: DifferentiationEntry) => void;
}

const EditLearningSupportSection: React.FC<EditLearningSupportSectionProps> = ({ student, onLearningSupportChange, onLiteracyEvidenceAdd, onNumeracyEvidenceAdd, onDifferentiationAdd }) => {
    const [isAddingLiteracyEvidence, setIsAddingLiteracyEvidence] = useState(false);
    const [isAddingNumeracyEvidence, setIsAddingNumeracyEvidence] = useState(false);
    const [newDifferentiationNote, setNewDifferentiationNote] = useState('');
    const [newDifferentiationFile, setNewDifferentiationFile] = useState<FileUpload | null>(null);

    const learningSupportData = student.academic.learningSupport;
    const isYear9NaplanApplicable = student.profile.currentYearGroup >= 9;

    const handleFieldChange = (field: keyof LearningSupport, value: any) => {
        onLearningSupportChange({ ...learningSupportData, [field]: value });
    };

    const handleAddDifferentiation = () => {
        if (!newDifferentiationNote.trim()) {
            alert('Please provide a note for the differentiation entry.');
            return;
        }
        const newEntry: DifferentiationEntry = {
            id: `diff-${crypto.randomUUID()}`,
            date: new Date().toISOString(),
            note: newDifferentiationNote.trim(),
            file: newDifferentiationFile || undefined,
        };
        onDifferentiationAdd(newEntry);
        setNewDifferentiationNote('');
        setNewDifferentiationFile(null);
    };

    const fieldsetClass = "space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md";
    const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";

    return (
        <>
            <div className="space-y-6">
                <fieldset className={fieldsetClass}>
                    <legend className="text-base font-semibold text-gray-700 dark:text-gray-300 px-2">Numeracy</legend>
                    <div className="p-2 border dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 space-y-2">
                        <NaplanDisplay title="Year 7 NAPLAN" band={student.academic.naplan.year7.numeracy} />
                        {isYear9NaplanApplicable && <NaplanDisplay title="Year 9 NAPLAN" band={student.academic.naplan.year9.numeracy} />}
                    </div>
                    <div className="flex justify-end mt-4">
                        <button onClick={() => setIsAddingNumeracyEvidence(true)} className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-sm font-semibold">+ Add Numeracy Evidence</button>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {learningSupportData.numeracyEvidence?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                            <div key={entry.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start"><p className="text-xs text-gray-500 dark:text-gray-400">{new Date(entry.date).toLocaleDateString()}</p>{entry.file && <button onClick={() => storageService.triggerDownload(entry.file!)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Download Evidence</button>}</div>
                                {entry.note && <p className="text-sm mt-1 whitespace-pre-wrap dark:text-gray-300">{entry.note}</p>}
                                <div className="mt-2 pt-2 border-t dark:border-gray-700 flex flex-wrap gap-2">
                                    {entry.numeracyTags.map(tag => <span key={tag} className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full">{tag}</span>)}
                                    {entry.newmansTags.map(tag => {
                                        const tagInfo = NEWMANS_ANALYSIS_TAGS.find(t => t.name === tag);
                                        return <span key={tag} className={`text-xs ${tagInfo?.color || 'bg-gray-200 dark:bg-gray-600'} ${tagInfo?.textColor || 'text-gray-800 dark:text-gray-200'} px-2 py-0.5 rounded-full`}>{tag}</span>
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </fieldset>

                <fieldset className={fieldsetClass}>
                    <legend className="text-base font-semibold text-gray-700 dark:text-gray-300 px-2">Literacy</legend>
                    <div className="p-2 border dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 grid grid-cols-2 gap-2">
                        <NaplanDisplay title="Reading (Y7)" band={student.academic.naplan.year7.reading} />{isYear9NaplanApplicable && <NaplanDisplay title="Reading (Y9)" band={student.academic.naplan.year9.reading} />}
                        <NaplanDisplay title="Writing (Y7)" band={student.academic.naplan.year7.writing} />{isYear9NaplanApplicable && <NaplanDisplay title="Writing (Y9)" band={student.academic.naplan.year9.writing} />}
                        <NaplanDisplay title="Spelling (Y7)" band={student.academic.naplan.year7.spelling} />{isYear9NaplanApplicable && <NaplanDisplay title="Spelling (Y9)" band={student.academic.naplan.year9.spelling} />}
                        <NaplanDisplay title="Grammar (Y7)" band={student.academic.naplan.year7.grammar} />{isYear9NaplanApplicable && <NaplanDisplay title="Grammar (Y9)" band={student.academic.naplan.year9.grammar} />}
                    </div>
                    <div className="flex justify-end mt-4"><button onClick={() => setIsAddingLiteracyEvidence(true)} className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-sm font-semibold">+ Add Literacy Evidence</button></div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {learningSupportData.literacyEvidence?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                            <div key={entry.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start"><p className="text-xs text-gray-500 dark:text-gray-400">{new Date(entry.date).toLocaleDateString()}</p>{entry.file && <button onClick={() => storageService.triggerDownload(entry.file!)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Download Evidence</button>}</div>
                                {entry.note && <p className="text-sm mt-1 whitespace-pre-wrap dark:text-gray-300">{entry.note}</p>}
                                <div className="mt-2 pt-2 border-t dark:border-gray-700 flex flex-wrap gap-2">{entry.tags.map(tag => <span key={tag} className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full">{tag}</span>)}</div>
                            </div>
                        ))}
                    </div>
                </fieldset>

                <fieldset className={fieldsetClass}>
                    <legend className="text-base font-semibold text-gray-700 dark:text-gray-300 px-2">Status & Differentiation</legend>
                    <div className="flex items-center"><input type="checkbox" id="isSwan" checked={learningSupportData?.isSwan} onChange={(e) => handleFieldChange('isSwan', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label htmlFor="isSwan" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">SWAN (Student with additional needs)</label></div>
                    <div className={!learningSupportData?.isSwan ? 'opacity-50 pointer-events-none' : ''}>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">{learningSupportData?.differentiation.map(item => (<div key={item.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-2 rounded"><p className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.date).toLocaleDateString()}</p><p className="text-sm mt-1 dark:text-gray-300">{item.note}</p>{item.file && <button onClick={() => storageService.triggerDownload(item.file!)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Download Evidence</button>}</div>))}</div>
                        <div className="border-t dark:border-gray-700 pt-4"><h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Log New Differentiation</h5><textarea value={newDifferentiationNote} onChange={e => setNewDifferentiationNote(e.target.value)} rows={3} placeholder="Note of differentiation provided..." className={inputClass} /><div className="mt-2"><InlineFileUpload file={newDifferentiationFile} onUpload={setNewDifferentiationFile} onRemove={() => setNewDifferentiationFile(null)} /></div><div className="text-right mt-2"><button onClick={handleAddDifferentiation} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">Add Entry</button></div></div>
                    </div>
                </fieldset>

                <fieldset className={fieldsetClass}>
                    <legend className="text-base font-semibold text-gray-700 dark:text-gray-300 px-2">Learning Support Centre</legend>
                    <div className="flex items-center"><input type="checkbox" id="requiresBooking" checked={learningSupportData?.requiresLearningCentreBooking} onChange={(e) => handleFieldChange('requiresLearningCentreBooking', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label htmlFor="requiresBooking" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Student requires booking into learning centre for assessments</label></div>
                </fieldset>

                <EvidenceLogList logs={student.evidenceLog?.filter(log => log.tags?.includes('Learning Support')) || []} title="Related General Learning Support Evidence" />
            </div>
            {isAddingLiteracyEvidence && <AddLiteracyEvidenceModal onClose={() => setIsAddingLiteracyEvidence(false)} onSave={onLiteracyEvidenceAdd} />}
            {isAddingNumeracyEvidence && <AddNumeracyEvidenceModal onClose={() => setIsAddingNumeracyEvidence(false)} onSave={onNumeracyEvidenceAdd} />}
        </>
    );
};

export default EditLearningSupportSection;