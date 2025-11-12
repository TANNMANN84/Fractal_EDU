import React, { useState, useEffect, useRef } from 'react';
import type { FileUpload, NumeracyTag, NewmansTag, NumeracyEvidenceEntry } from '../types';
import { NUMERACY_DOMAINS, NEWMANS_ANALYSIS_TAGS } from '../constants';
import InlineFileUpload from './InlineFileUpload';

interface AddNumeracyEvidenceModalProps {
  onClose: () => void;
  onSave: (newLog: NumeracyEvidenceEntry) => void;
}

const AddNumeracyEvidenceModal: React.FC<AddNumeracyEvidenceModalProps> = ({ onClose, onSave }) => {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<FileUpload | null>(null);
  const [numeracyTags, setNumeracyTags] = useState<NumeracyTag[]>([]);
  const [newmansTags, setNewmansTags] = useState<NewmansTag[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleToggleNumeracyTag = (tag: NumeracyTag) => {
    setNumeracyTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  
  const handleToggleNewmansTag = (tag: NewmansTag) => {
    setNewmansTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSave = () => {
    if (!note.trim() && !file) {
      alert("Please provide either a note or upload a file.");
      return;
    }
    if (numeracyTags.length === 0 && newmansTags.length === 0) {
      alert("Please select at least one tag.");
      return;
    }
    
    const newEntry: NumeracyEvidenceEntry = {
      id: `num-ev-${crypto.randomUUID()}`,
      date: new Date().toISOString(),
      note: note.trim() ? note.trim() : undefined,
      file: file ?? undefined,
      numeracyTags: numeracyTags,
      newmansTags: newmansTags,
    };
    onSave(newEntry);
    onClose();
  };
  
  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  }
  
  const labelStyle = "block font-semibold text-gray-700 dark:text-gray-300";
  const inputStyle = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500";

  return (
    <dialog ref={dialogRef} onClose={onClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-2xl backdrop:bg-black backdrop:opacity-50 border border-gray-300 dark:border-gray-600">
        <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">Add Numeracy Evidence</h2>
            <button onClick={handleClose} className="text-2xl font-light text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 leading-none">&times;</button>
        </div>
        
        <div className="p-6 space-y-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 max-h-[70vh] overflow-y-auto">
            <div>
                <label className={labelStyle}>Numeracy Domains</label>
                <div className="flex flex-wrap gap-2 mt-2">
                    {NUMERACY_DOMAINS.map(tag => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleNumeracyTag(tag)}
                            className={`px-3 py-1 text-sm font-medium rounded-full border transition-colors ${ 
                                numeracyTags.includes(tag)
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className={labelStyle}>Newman's Error Analysis</label>
                <div className="flex flex-wrap gap-2 mt-2">
                    {NEWMANS_ANALYSIS_TAGS.map(tagInfo => (
                        <button
                            key={tagInfo.name}
                            type="button"
                            onClick={() => handleToggleNewmansTag(tagInfo.name)}
                            className={`px-3 py-1 text-sm font-medium rounded-full border transition-colors ${
                                newmansTags.includes(tagInfo.name) 
                                ? `${tagInfo.color} ${tagInfo.textColor} border-gray-400 dark:border-gray-500` 
                                : `bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 ${tagInfo.hoverColor} dark:hover:bg-gray-600`
                            }`}
                        >
                            {tagInfo.name}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="pt-2">
                <label className={labelStyle}>Note (optional)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} className={inputStyle} rows={4} placeholder="Describe the evidence or observation..."></textarea>
            </div>

            <div>
                <label className={labelStyle}>Upload File (optional)</label>
                <InlineFileUpload
                    file={file}
                    onUpload={setFile}
                    onRemove={() => setFile(null)}
                />
            </div>
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 sticky bottom-0">
            <button onClick={handleClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 font-semibold transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold transition-colors">Save Evidence</button>
        </div>
    </dialog>
  );
};

export default AddNumeracyEvidenceModal;
