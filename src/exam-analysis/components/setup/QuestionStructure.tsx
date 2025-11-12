// src/components/setup/QuestionStructure.tsx

import React, { JSX } from 'react';
import { produce, Draft } from 'immer';
import { useAppContext } from '../../../../contexts/AppContext';
import { Question } from '../../../../types';
// Make sure updateParentQuestionData is correctly implemented in helpers
import { updateParentQuestionData } from '../../utils/helpers'; 

// *** DEFINE THE EXPECTED PROPS HERE ***
interface QuestionStructureProps {
  onEdit: (questionId: string) => void;
  onAddSub: (parentId: string) => void;
}

const QuestionStructure: React.FC<QuestionStructureProps> = ({ onEdit, onAddSub }) => {
  const { data, saveData } = useAppContext();

  if (!data) {
    return null;
  }

  const activeExam = data.examAnalysis.activeExamId ? data.examAnalysis.exams.find(e => e.id === data.examAnalysis.activeExamId) : null;
  const questions = activeExam?.questions || [];

   const handleRemove = (id: string) => {
    if (!data || !activeExam) return;

    const nextData = produce(data, draft => {
      const examToUpdate = draft.examAnalysis.exams.find(e => e.id === activeExam.id);
      if (!examToUpdate) return;

      const removeRecursively = (qs: Draft<Question[]>, targetId: string): Draft<Question[]> => {
        return qs.filter(q => {
          if (q.id === targetId) return false;
          if (q.subQuestions && q.subQuestions.length > 0) {
            q.subQuestions = removeRecursively(q.subQuestions, targetId);
          }
          return true;
        });
      };

      const wasTopLevel = examToUpdate.questions.some(q => q.id === id);
      let updatedQuestions = removeRecursively(examToUpdate.questions, id);

      if (wasTopLevel) {
        updatedQuestions.forEach((q, index) => { q.number = (index + 1).toString(); });
      }

      examToUpdate.questions = updateParentQuestionData(updatedQuestions);
    });

    saveData(nextData);
  };


  const renderQuestions = (qs: Question[], level = 1): JSX.Element[] => {
    // Ensure qs is always an array before mapping
    if (!Array.isArray(qs)) {
        console.error("renderQuestions received non-array:", qs);
        return []; // Return empty array if qs is not valid
    }
    return qs.map((q, index) => {
      // Basic check for valid question object
      if (!q || typeof q !== 'object' || !q.id) {
          console.error("Invalid question object encountered:", q);
          return null; // Skip rendering invalid items
      }
      const hasSubQuestions = q.subQuestions && q.subQuestions.length > 0;
      const isMainQuestion = level === 1;
      const bgColor = isMainQuestion ? (index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-900/30') : '';

      return (
        <div key={q.id} className={`question-level-${level} mt-2`} data-id={q.id}>
           <div className={`${bgColor} border border-gray-700 rounded-lg overflow-hidden`}>
                <div className="flex w-full items-center gap-3 bg-gray-700/50 p-2">
                    {/* Ensure q.number exists before displaying */}
                    <span className="font-semibold text-gray-300 w-16 text-center">{isMainQuestion ? `Q ${q.number ?? 'N/A'}` : `Part ${q.number ?? 'N/A'}`}</span>
                    <span className="flex-1 text-sm text-gray-400 truncate pr-2" title={q.notes || ''}>{q.notes || <span className="italic">No notes</span>}</span>
                    {hasSubQuestions ? (
                        <span className="text-sm font-semibold text-gray-300 rounded-md bg-gray-600 px-2 py-1 parent-mark-total">Total: {q.maxMarks ?? 0}</span>
                    ) : (
                        <span className="text-sm font-semibold text-gray-300 rounded-md bg-gray-600 px-2 py-1">Marks: {q.maxMarks ?? 0}</span>
                    )}

                    {/* Action Buttons */}
                     <div className="flex items-center space-x-1 flex-shrink-0">
                        <button onClick={() => onEdit(q.id)} className="p-1.5 rounded-full hover:bg-gray-600 text-gray-300" title="Edit">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>
                        </button>
                        {level < 3 && (
                            <button onClick={() => onAddSub(q.id)} className="p-1.5 rounded-full hover:bg-gray-600 text-indigo-400" title="Add Sub-part">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/></svg>
                            </button>
                        )}
                        <button onClick={() => handleRemove(q.id)} className="p-1.5 rounded-full hover:bg-gray-600 text-red-400" title="Remove">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg>
                        </button>
                    </div>
                </div>
                 {hasSubQuestions && (
                     <div className={`sub-questions-container ${level === 1 ? 'pl-4' : 'pl-2'} py-2 pr-2`}>
                        {/* Recursive call */}
                        {renderQuestions(q.subQuestions, level + 1)}
                    </div>
                 )}
           </div>
        </div>
      );
    // Filter out nulls in case of invalid data
    }).filter(Boolean) as JSX.Element[]; 
  };

  return (
    <div id="exam-structure-container" className="space-y-2 min-h-[100px]">
        {/* Ensure questions is an array before checking length */}
        {(Array.isArray(questions) && questions.length === 0) &&
          <p className="text-gray-500 text-center py-4">Use the Exam Builder or add questions manually.</p>
        }
        {/* Render questions, ensuring it's an array */}
        {renderQuestions(Array.isArray(questions) ? questions : [])}
    </div>
  );
};

export default QuestionStructure;