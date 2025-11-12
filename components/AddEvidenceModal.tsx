
import React, { useState, useEffect, useRef } from 'react';
import type { FileUpload, EvidenceLogEntry, EvidenceTag } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { NCCD_LEVELS, ASSIST_CHECKLIST, EXTEND_CHECKLIST, CULTURAL_CHECKLIST } from '../constants';
import InlineFileUpload from './InlineFileUpload';

interface AddEvidenceModalProps {
  onClose: () => void;
  onSaveLog: (newLog: EvidenceLogEntry) => void;
}

const EVIDENCE_TAGS: EvidenceTag[] = ['Wellbeing', 'Learning Support', 'HPGE', 'NCCD', 'Cultural'];

const AddEvidenceModal: React.FC<AddEvidenceModalProps> = ({ onClose, onSaveLog }) => {
  const { data } = useAppContext();
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<EvidenceTag[]>([]);
  const [adjustmentLevel, setAdjustmentLevel] = useState('');
  const [adjustmentsUsed, setAdjustmentsUsed] = useState<string[]>([]);
  const [evidenceLink, setEvidenceLink] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<FileUpload | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };

  const handleSave = () => {
    if (!note.trim()) {
      alert("Please provide a note for the evidence.");
      return;
    }
    const newLog: EvidenceLogEntry = {
      logId: `log-${crypto.randomUUID()}`,
      date: new Date().toISOString(),
      teacher: data?.teacherProfile?.name || 'Teacher',
      note: note.trim(),
      adjustments_used: adjustmentsUsed,
      adjustment_level: adjustmentLevel,
      tags: tags,
      evidenceLink: evidenceLink.trim() || undefined,
      evidenceFile: evidenceFile || undefined,
    };
    onSaveLog(newLog);
    handleClose();
  };

  const handleToggleTag = (tag: EvidenceTag) => {
    setTags(prev => {
      const newTags = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      if (!newTags.includes('NCCD')) {
        setAdjustmentLevel('');
      }
      // Clear adjustments when tags change to avoid keeping irrelevant ones
      setAdjustmentsUsed([]);
      return newTags;
    });
  };

  const handleToggleAdjustment = (adjustment: string) => {
    setAdjustmentsUsed(prev =>
      prev.includes(adjustment) ? prev.filter(adj => adj !== adjustment) : [...prev, adjustment]
    );
  };
  
  const renderAdjustmentChecklists = () => {
    const checklists: { title: string, items: string[], condition: boolean }[] = [
      { title: "Assist Adjustments", items: [...ASSIST_CHECKLIST.Curriculum, ...ASSIST_CHECKLIST.Environment, ...ASSIST_CHECKLIST.Assessment], condition: tags.includes('Learning Support') },
      { title: "Extend Adjustments", items: [...EXTEND_CHECKLIST.Curriculum, ...EXTEND_CHECKLIST.Process, ...EXTEND_CHECKLIST.Product], condition: tags.includes('HPGE') },
      { title: "Cultural Adjustments", items: Object.values(CULTURAL_CHECKLIST).flat(), condition: tags.includes('Cultural') }
    ];

    return checklists.filter(c => c.condition).map(list => (
      <div key={list.title} className="mt-2">
        <h4 className="font-semibold text-gray-700">{list.title}</h4>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {list.items.map(item => (
            <label key={item} className="flex items-center text-sm">
              <input type="checkbox" checked={adjustmentsUsed.includes(item)} onChange={() => handleToggleAdjustment(item)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="ml-2 text-gray-800">{item}</span>
            </label>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <dialog ref={dialogRef} onClose={onClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-2xl backdrop:bg-black backdrop:opacity-50 border border-gray-300 dark:border-gray-600">
      <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">Add Evidence Log Entry</h2>
        <button onClick={handleClose} className="text-2xl font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 leading-none">&times;</button>
      </div>
      <div className="p-6 bg-white dark:bg-gray-900 space-y-4 text-gray-900 dark:text-gray-200" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
             <div className="flex flex-wrap gap-2">
                {EVIDENCE_TAGS.map(tag => (
                    <button key={tag} onClick={() => handleToggleTag(tag)} className={`px-3 py-1 text-sm font-medium rounded-full border ${tags.includes(tag) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'}`}>
                        {tag}
                    </button>
                ))}
            </div>
        </div>
        {tags.includes('NCCD') && (
            <div>
                <label htmlFor="nccdLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">NCCD Adjustment Level</label>
                <select id="nccdLevel" value={adjustmentLevel} onChange={e => setAdjustmentLevel(e.target.value)} className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="" disabled>Select a level...</option>
                    {NCCD_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
            </div>
        )}
        <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Note / Observation</label>
            <textarea id="note" value={note} onChange={e => setNote(e.target.value)} rows={5} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 bg-white dark:bg-gray-700" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adjustments Used (optional)</label>
            {renderAdjustmentChecklists()}
        </div>
         <div>
            <label htmlFor="evidenceLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Evidence Link (optional)</label>
            <input type="url" id="evidenceLink" value={evidenceLink} onChange={e => setEvidenceLink(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 bg-white dark:bg-gray-700" placeholder="https://..." />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Evidence File (optional)</label>
            <InlineFileUpload file={evidenceFile} onUpload={setEvidenceFile} onRemove={() => setEvidenceFile(null)} />
        </div>
      </div>
      <div className="p-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 sticky bottom-0">
        <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 font-semibold transition-colors">Cancel</button>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold transition-colors">Save Entry</button>
      </div>
    </dialog>
  );
};

export default AddEvidenceModal;