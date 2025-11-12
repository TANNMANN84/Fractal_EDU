// src/components/rapid-test/RapidQuestionEditor.tsx

import React from 'react';
import { RapidQuestion, RapidQuestionType } from '../../../../types';

interface RapidQuestionEditorProps {
  question: RapidQuestion;
  onChange: (updatedQuestion: RapidQuestion) => void;
  onDelete: () => void;
  index: number;
}

const questionTypes: RapidQuestionType[] = [ 'Spelling', 'MCQ', 'Matching', 'Written', 'Marks', ];

const RapidQuestionEditor: React.FC<RapidQuestionEditorProps> = ({ question, onChange, onDelete, index, }) => {

  const handleChange = ( field: keyof RapidQuestion | `matchPairTerm-${string}` | `matchPairMatch-${string}`, value: any ) => {
    let updatedQuestion = { ...question };

    // --- Handle Match Pair Updates ---
    if (field.startsWith('matchPairTerm-')) {
        const pairId = field.split('-')[1];
        updatedQuestion.matchPairs = updatedQuestion.matchPairs?.map(p =>
            p.id === pairId ? { ...p, term: value } : p
        );
    } else if (field.startsWith('matchPairMatch-')) {
         const pairId = field.split('-')[1];
         updatedQuestion.matchPairs = updatedQuestion.matchPairs?.map(p =>
             p.id === pairId ? { ...p, correctMatch: value } : p
         );
    }
    // --- Handle Standard Field Updates ---
    else if (field === 'maxMarks') {
        const numValue = parseInt(value, 10);
        updatedQuestion[field] = isNaN(numValue) ? 1 : Math.max(1, numValue);
    } else if (field === 'options' && (question.type === 'MCQ')) {
        updatedQuestion[field] = (value as string).split(',').map(opt => opt.trim()).filter(Boolean);
    } else if (field === 'type') {
        updatedQuestion.type = value;
        // Reset type-specific fields when type changes
        if (value !== 'Matching') updatedQuestion.matchPairs = undefined;
        if (value !== 'MCQ') updatedQuestion.options = undefined;
        if (value !== 'MCQ' && value !== 'Spelling') updatedQuestion.correctAnswer = undefined;
        // Automatically set maxMarks based on pairs if switching TO Matching
        if (value === 'Matching') {
            updatedQuestion.maxMarks = updatedQuestion.matchPairs?.length || 1;
            // Add a default pair if none exist
            if (!updatedQuestion.matchPairs || updatedQuestion.matchPairs.length === 0) {
                 updatedQuestion.matchPairs = [{ id: crypto.randomUUID(), term: '', correctMatch: '' }];
            }
        }
    } else {
        // Direct assignment for other fields (prompt, correctAnswer for Spelling/MCQ)
 (updatedQuestion as any)[field] = value; // Use 'any' for direct assignment to allow dynamic field names
    }

    onChange(updatedQuestion);
  };

  const handleAddMatchPair = () => {
      const newPair = { id: crypto.randomUUID(), term: '', correctMatch: '' };
      const updatedPairs = [...(question.matchPairs || []), newPair];
      // Update max marks to match number of pairs
      onChange({ ...question, matchPairs: updatedPairs, maxMarks: updatedPairs.length });
  };

  const handleDeleteMatchPair = (pairId: string) => {
       const updatedPairs = (question.matchPairs || []).filter(p => p.id !== pairId);
       // Update max marks to match number of pairs
       onChange({ ...question, matchPairs: updatedPairs, maxMarks: updatedPairs.length });
  };


  return (
    <div className="p-4 bg-gray-700/50 rounded-lg space-y-3 relative border border-gray-600">
      {/* Question Number & Delete Button (keep existing) */}
       <div className="absolute top-3 left-3 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-gray-800"> {index + 1} </div>
       <button onClick={onDelete} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-red-800 text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-700" title="Remove Question" > {/* SVG Icon */} </button>

      {/* Form Fields - Increased top padding */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-10">
        {/* Prompt */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300"> Prompt / Question </label>
          <input type="text" value={question.prompt} onChange={(e) => handleChange('prompt', e.target.value)} placeholder="e.g., 'Mitochondria' or 'Define Homeostasis'" className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white focus:ring-indigo-500 focus:border-indigo-500" />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300"> Question Type </label>
          <select value={question.type} onChange={(e) => handleChange('type', e.target.value as RapidQuestionType)} className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white focus:ring-indigo-500 focus:border-indigo-500" >
            {questionTypes.map((type) => ( <option key={type} value={type}> {type} </option> ))}
          </select>
        </div>

        {/* Max Marks (Read-only for Matching) */}
        <div>
          <label className="block text-sm font-medium text-gray-300"> Max Marks </label>
          <input type="number" value={question.maxMarks} min={1} step={1} onChange={(e) => handleChange('maxMarks', e.target.value)} disabled={question.type === 'Matching'} className={`mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white focus:ring-indigo-500 focus:border-indigo-500 ${question.type === 'Matching' ? 'opacity-50 cursor-not-allowed' : ''}`} />
          {question.type === 'Matching' && <p className="text-xs text-gray-400 mt-1">Set automatically by number of pairs.</p>}
        </div>

        {/* Correct Answer (for Spelling/MCQ) */}
        {(question.type === 'Spelling' || question.type === 'MCQ') && (
          <div>
            <label className="block text-sm font-medium text-gray-300"> Correct Answer </label>
            <input type="text" value={question.correctAnswer || ''} onChange={(e) => handleChange('correctAnswer', e.target.value)} placeholder={ question.type === 'MCQ' ? "e.g., C" : "'Correct' spelling if different" } className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white focus:ring-indigo-500 focus:border-indigo-500" />
             {question.type === 'Spelling' && <p className="text-xs text-gray-400 mt-1">Leave blank if prompt is the correct spelling.</p>}
          </div>
        )}

        {/* Options (for MCQ) */}
        {question.type === 'MCQ' && (
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-300"> Options (comma-separated, no spaces unless part of option) </label>
            <input type="text" value={question.options?.join(',') || ''} onChange={(e) => handleChange('options', e.target.value)} placeholder="e.g., A,B,C,D" className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        )}

        {/* --- Matching Pairs Editor --- */}
        {question.type === 'Matching' && (
          <div className="md:col-span-3 pt-4 border-t border-gray-600 space-y-3">
            <h4 className="text-md font-medium text-gray-300">Matching Pairs</h4>
            {(question.matchPairs || []).map((pair, pairIndex) => (
              <div key={pair.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={pair.term}
                  onChange={(e) => handleChange(`matchPairTerm-${pair.id}`, e.target.value)}
                  placeholder={`Term ${pairIndex + 1}`}
                  className="flex-1 rounded-md bg-gray-600 border-gray-500 p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-gray-400">matches</span>
                <input
                  type="text"
                  value={pair.correctMatch}
                  onChange={(e) => handleChange(`matchPairMatch-${pair.id}`, e.target.value)}
                  placeholder={`Correct Match ${pairIndex + 1}`}
                  className="flex-1 rounded-md bg-gray-600 border-gray-500 p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={() => handleDeleteMatchPair(pair.id)}
                  className="p-1.5 text-red-400 hover:bg-red-800 rounded-full focus:outline-none" title="Delete Pair"
                > ✕ </button>
              </div>
            ))}
            <button
              onClick={handleAddMatchPair}
              className="text-sm text-indigo-400 hover:text-indigo-300 pt-1"
            > + Add Pair </button>
          </div>
        )}
        {/* --- End Matching Pairs Editor --- */}

      </div>
    </div>
  );
};

export default RapidQuestionEditor;