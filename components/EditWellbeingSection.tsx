import React from 'react';
import type { StudentWellbeing, NoteEntry, EvidenceLogEntry } from '../types';
import { useAppContext } from '../contexts/AppContext';
import TagInput from './TagInput';
import NotesSection from './NotesSection';
import { EvidenceLogList } from './EvidenceLogList';

interface EditWellbeingSectionProps {
    wellbeingData: StudentWellbeing;
    onWellbeingChange: (newWellbeingData: StudentWellbeing) => void;
}

const EditWellbeingSection: React.FC<EditWellbeingSectionProps> = ({ wellbeingData, onWellbeingChange }) => {
    const { data } = useAppContext();

    const handleFieldChange = (field: keyof StudentWellbeing, value: any) => {
        onWellbeingChange({ ...wellbeingData, [field]: value });
    };

    const handleAddNote = (content: string) => {
        const newNote: NoteEntry = {
            id: `note-${crypto.randomUUID()}`,
            date: new Date().toISOString(),
            author: data?.teacherProfile?.name || 'Teacher',
            content: content,
        };
        handleFieldChange('notes', [...(wellbeingData.notes || []), newNote]);
    };

    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
    const fieldsetClass = "space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md";

    return (
        <div className="space-y-6">
            <fieldset className={fieldsetClass}>
                <legend className="text-base font-semibold text-gray-700 dark:text-gray-300 px-2">Official Plans</legend>
                <div className="flex items-center">
                    <input type="checkbox" id="hasBehaviourPlan" checked={wellbeingData.hasBehaviourPlan} onChange={(e) => handleFieldChange('hasBehaviourPlan', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="hasBehaviourPlan" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Has Behaviour Support Plan</label>
                </div>
                {wellbeingData.hasBehaviourPlan && (
                    <div>
                        <label className={labelClass}>Behaviour Plan Link</label>
                        <input type="text" value={wellbeingData.behaviourPlanLink} onChange={(e) => handleFieldChange('behaviourPlanLink', e.target.value)} placeholder="Paste link to SharePoint/Sentral plan..." className={inputClass} />
                    </div>
                )}
                <div className="flex items-center">
                    <input type="checkbox" id="hasLearningPlan" checked={wellbeingData.hasLearningPlan} onChange={(e) => handleFieldChange('hasLearningPlan', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="hasLearningPlan" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Has Individual Learning Plan</label>
                </div>
                {wellbeingData.hasLearningPlan && (
                    <div>
                        <label className={labelClass}>Learning Plan Link</label>
                        <input type="text" value={wellbeingData.learningPlanLink} onChange={(e) => handleFieldChange('learningPlanLink', e.target.value)} placeholder="Paste link to SharePoint/Sentral plan..." className={inputClass} />
                    </div>
                )}
            </fieldset>

            <fieldset className={fieldsetClass}>
                <legend className="text-base font-semibold text-gray-700 dark:text-gray-300 px-2">At-a-Glance Profile</legend>
                <div>
                    <label className={labelClass}>Wellbeing Strengths & Positives</label>
                    <TagInput value={wellbeingData.strengths} onChange={(tags) => handleFieldChange('strengths', tags)} placeholder="e.g., Responds well to praise..." />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Type a value and press Enter to add it to the list.</p>
                </div>
                <div>
                    <label className={labelClass}>Known Triggers & Agitators</label>
                    <TagInput value={wellbeingData.triggers} onChange={(tags) => handleFieldChange('triggers', tags)} placeholder="e.g., Loud noises, Unstructured time..." />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Type a value and press Enter to add it to the list.</p>
                </div>
                <div>
                    <label className={labelClass}>Proactive Strategies (What to DO)</label>
                    <TagInput value={wellbeingData.proactiveStrategies} onChange={(tags) => handleFieldChange('proactiveStrategies', tags)} placeholder="e.g., Give 5-min warning..." />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Type a value and press Enter to add it to the list.</p>
                </div>
                <div>
                    <label className={labelClass}>De-escalation Strategies (When an issue occurs)</label>
                    <TagInput value={wellbeingData.deescalationStrategies} onChange={(tags) => handleFieldChange('deescalationStrategies', tags)} placeholder="e.g., Offer quiet space, Speak calmly..." />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Type a value and press Enter to add it to the list.</p>
                </div>
            </fieldset>

            <fieldset className={fieldsetClass}>
                <legend className="text-base font-semibold text-gray-700 dark:text-gray-300 px-2">Context & Medical</legend>
                <div>
                    <label className={labelClass}>Medical Needs</label>
                    <TagInput value={wellbeingData.medicalNeeds} onChange={(tags) => handleFieldChange('medicalNeeds', tags)} placeholder="e.g., Asthma, Anaphylaxis (Peanuts)..." />
                    <p className="text-xs text-gray-500 mt-1">Type a value and press Enter to add it to the list.</p>
                </div>
                <div>
                    <label className={labelClass}>Attendance (%)</label>
                    <input type="number" value={wellbeingData.attendancePercent} onChange={(e) => handleFieldChange('attendancePercent', e.target.valueAsNumber || 0)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Sentral Behaviour Summary</label>
                    <textarea value={wellbeingData.sentralBehaviourSummary} onChange={(e) => handleFieldChange('sentralBehaviourSummary', e.target.value)} rows={4} placeholder="Summarise historical behaviour from Sentral here. e.g., '5 minor incidents in T1...'" className={inputClass} />
                </div>
            </fieldset>
            <NotesSection title="Wellbeing Notes" notes={wellbeingData.notes || []} onAddNote={handleAddNote} />
            <EvidenceLogList logs={wellbeingData.evidenceLog || []} title="Related Wellbeing Evidence" />
        </div>
    );
};

export default EditWellbeingSection;