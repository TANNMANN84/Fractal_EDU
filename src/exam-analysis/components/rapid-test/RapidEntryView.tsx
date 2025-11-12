// src/components/rapid-test/RapidEntryView.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { produce } from 'immer';
import { useAppContext } from '../../../../contexts/AppContext';
import { RapidTest, ExamStudent, RapidQuestion, RapidTestResult, RapidQuestionType } from '../../../../types';

interface RapidEntryViewProps {
  testId: string;
  onBack: () => void; // Function to go back to the dashboard
}

const RapidEntryView: React.FC<RapidEntryViewProps> = ({ testId, onBack }) => {
  const { data, saveData } = useAppContext();
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [testType, setTestType] = useState<'pre' | 'post'>('pre');
  const [responses, setResponses] = useState<RapidTestResult['responses']>({});
  const formRef = useRef<HTMLDivElement>(null); // Ref for the form area

  if (!data) {
    return <div>Loading...</div>;
  }

  const { rapidTests, rapidTestStudents } = data.examAnalysis;

  const test = rapidTests.find(t => t.id === testId);
  const students = rapidTestStudents.filter(s => s.lastName || s.firstName).sort((a,b) => a.lastName.localeCompare(b.lastName)); // Get sorted, named students

  // Helper function to get score for a rapid question (copied from RapidTestAnalysis for self-containment)
  const getScoreForRapidQuestion = useCallback((question: RapidQuestion, response: any): number => {
    if (response === undefined || response === null || response === '') return 0;
    switch (question.type) {
      case 'Spelling': return (response === 'Correct') ? (question.maxMarks || 0) : 0;
      case 'MCQ': return (response === question.correctAnswer) ? (question.maxMarks || 0) : 0;
      case 'Matching': return (response === 'Correct') ? (question.maxMarks || 0) : 0;
      case 'Written': case 'Marks': return Math.max(0, Math.min(Number(response), question.maxMarks || 0));
      default: return 0;
    }
  }, []);

  const currentStudent = students[currentStudentIndex];

  // Load existing responses when student or testType changes
  useEffect(() => {
    if (!test || !currentStudent) {
        setResponses({});
        return;
    };

    const existingResult = test.results.find(
      r => r.studentId === currentStudent.id && r.type === testType
    );
    setResponses(existingResult ? existingResult.responses : {});
    // Focus first input on student/type change
    focusFirstInput();

  }, [currentStudentIndex, testType, test, currentStudent?.id]); // Added currentStudent.id dependency


  const focusFirstInput = () => {
    setTimeout(() => {
        const firstInput = formRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
            'input:not([type=hidden]), textarea'
        );
        firstInput?.focus();
        firstInput?.select();
    }, 0); // Timeout ensures DOM is updated
  };


  const handleInputChange = (questionId: string, value: string | number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleClear = useCallback(() => {
    if (!test || !currentStudent || !data) return;

    if (window.confirm(`Are you sure you want to clear all responses for ${currentStudent.firstName} ${currentStudent.lastName} (${testType})? This cannot be undone.`)) {
        // Clear local state
        setResponses({});

        const nextData = produce(data, draft => {
            const rapidTest = draft.examAnalysis.rapidTests.find(t => t.id === test.id);
            if (rapidTest) {
                const resultIndex = rapidTest.results.findIndex(
                    r => r.studentId === currentStudent.id && r.type === testType
                );
                if (resultIndex !== -1) {
                    rapidTest.results.splice(resultIndex, 1); // Remove the result
                }
            }
        });
        saveData(nextData);
    }
  }, [test, currentStudent, testType, data, saveData]);

  const handleSaveAndNext = useCallback(() => {
    if (!test || !currentStudent || !data) return;

    // Calculate total score for the current responses
    let totalScore = 0;
    test.questions.forEach(q => {
        const response = responses[q.id];
        totalScore += getScoreForRapidQuestion(q, response);
    });

    const nextData = produce(data, draft => {
        const rapidTest = draft.examAnalysis.rapidTests.find(t => t.id === test.id);
        if (rapidTest) {
            const existingResultIndex = rapidTest.results.findIndex(
                r => r.studentId === currentStudent.id && r.type === testType
            );

            const newResult: RapidTestResult = {
                studentId: currentStudent.id,
                type: testType,
                responses: responses,
                totalScore: totalScore,
            };

            if (existingResultIndex !== -1) {
                rapidTest.results[existingResultIndex] = newResult;
            } else {
                rapidTest.results.push(newResult);
            }
        }
    });
    saveData(nextData);

    console.log(`Saving results for ${currentStudent.firstName} ${currentStudent.lastName} (${testType})`);

    // Move to next student
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(prev => prev + 1);
    } else {
      // Optionally go back or show completion message
      alert('Finished marking the last student!');
    }
  }, [test, currentStudent, testType, responses, currentStudentIndex, students.length, data, saveData, getScoreForRapidQuestion]);


  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, questionIndex: number) => {
    const isLastQuestion = questionIndex === (test?.questions.length ?? 0) - 1;

    if (e.key === 'Enter' && isLastQuestion) {
        e.preventDefault();
        handleSaveAndNext();
    } else if (e.key === 'Tab' || e.key === 'Enter') {
        // Allow default Tab behavior
        // If Enter, move to next input (default form behavior often does this, but we can enhance)
        if (e.key === 'Enter') {
            e.preventDefault();
            const formElements = Array.from(
                formRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
                 'input:not([type=hidden]), textarea'
                ) ?? []
            );
            const currentElementIndex = formElements.findIndex(el => el === e.target);
            const nextElement = formElements[currentElementIndex + 1];
            if (nextElement) {
                nextElement.focus();
                nextElement.select();
            } else if (isLastQuestion) {
                 handleSaveAndNext(); // Save if Enter on last field
            }
        }
    }

    // --- Single-key press auto-advance ---
    const question = test?.questions[questionIndex];
    const key = e.key.toUpperCase();
    let shouldAdvance = false;

    if ((question?.type === 'Spelling' || question?.type === 'Matching') && (key === 'C' || key === 'I')) {
        const value = key === 'C' ? 'Correct' : 'Incorrect';
        handleInputChange(question.id, value);
        shouldAdvance = true;
    } else if (question?.type === 'MCQ' && question.options?.includes(key)) {
        handleInputChange(question.id, key);
        shouldAdvance = true;
    }

    if (shouldAdvance) {
        e.preventDefault();
        const formElements = Array.from(
            formRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input:not([type=hidden]), textarea') ?? []
        );
        const currentElementIndex = formElements.findIndex(el => el === e.target);
        const nextElement = formElements[currentElementIndex + 1];

        if (nextElement) { nextElement.focus(); nextElement.select(); } 
        else if (isLastQuestion) { handleSaveAndNext(); }
    }
  }, [test?.questions, handleSaveAndNext, students.length, currentStudentIndex, onBack, responses, testType, currentStudent]);
  // The dispatch in handleKeyDown is no longer needed as handleSaveAndNext handles the save.

  // Render Input based on Question Type
   const renderQuestionInput = (q: RapidQuestion, index: number) => {
    const value = responses[q.id] ?? ''; // Keep this for initial value render

    switch (q.type) {
      case 'Spelling':
        return (
          <input
            type="text"
            value={value as string}
            onKeyDown={(e) => handleKeyDown(e, index)} // KeyDown handles logic
            onChange={(e) => { /* Controlled by keydown */ }} // Prevent manual typing other than C/I
            data-question-id={q.id} // Add data attribute
            placeholder="Press C or I"
            className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white uppercase text-center focus:ring-indigo-500 focus:border-indigo-500"
          />
        );
      case 'MCQ':
        return (
          <input
            type="text"
            maxLength={q.options?.length ? 1 : undefined}
            value={value as string}
            onChange={(e) => handleInputChange(q.id, e.target.value.toUpperCase())}
            onKeyDown={(e) => handleKeyDown(e, index)} // Keep for auto-advance
            data-question-id={q.id}
            placeholder="Enter Letter (A,B,C...)"
            className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white uppercase text-center focus:ring-indigo-500 focus:border-indigo-500"
          />
        );
      case 'Matching':
        return (
          <input
            type="text" // Keep as text, but handle C/I in keydown
            value={value as string} // Display Correct/Incorrect
            onKeyDown={(e) => handleKeyDown(e, index)}
            onChange={(e) => { /* Controlled by keydown */ }} // Prevent manual typing other than C/I
            data-question-id={q.id} // Add data attribute
            placeholder="Press C or I"
            className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white uppercase text-center focus:ring-indigo-500 focus:border-indigo-500"
          />
        );
       case 'Written': // Use textarea for potentially longer answers/notes
        return (
           <input // Keep as input for score
             type="number"
             value={value as number}
             min={0}
             max={q.maxMarks}
             step={0.5} // Allow half marks
             onChange={(e) => handleInputChange(q.id, e.target.value)}
             onKeyDown={(e) => handleKeyDown(e, index)}
             data-question-id={q.id}
             placeholder={`Score (0-${q.maxMarks})`}
             className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
           />
         );
       case 'Marks':
         return (
           <input
             type="number"
             value={value as number}
             min={0}
             max={q.maxMarks}
             step={0.5} // Allow half marks
             onChange={(e) => handleInputChange(q.id, e.target.value)}
             onKeyDown={(e) => handleKeyDown(e, index)}
             data-question-id={q.id}
             placeholder={`Score (0-${q.maxMarks})`}
             className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
           />
         );
      default:
        return <p className="text-red-400">Unknown question type</p>;
    }
  };


  if (!test) return <p className="text-red-400">Error: Test not found.</p>;
  if (!currentStudent) return <p className="text-gray-400">No students available to mark.</p>;

  // Calculate progress
  const markedStudents = new Set(test.results.filter(r => r.type === testType).map(r => r.studentId));
  const progressPercent = students.length > 0 ? (markedStudents.size / students.length) * 100 : 0;

  // Calculate total possible marks for percentage calculation
  const totalPossibleMarks = test.questions.reduce((sum, q) => sum + (q.maxMarks || 0), 0);


  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Panel 1: Class List & Progress */}
      <div className="md:w-1/4 bg-gray-800 border border-gray-700 p-4 rounded-lg h-fit">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Class List</h2>
             {/* Pre/Post Toggle */}
            <div className="flex rounded-md shadow-sm bg-gray-700 p-0.5">
                 <button onClick={() => { setTestType('pre'); setCurrentStudentIndex(0); }} className={`px-2 py-1 text-xs font-medium rounded-md ${testType === 'pre' ? 'text-white bg-indigo-600' : 'text-gray-300 hover:bg-gray-600'}`}> Pre </button>
                 <button onClick={() => { setTestType('post'); setCurrentStudentIndex(0); }} className={`px-2 py-1 text-xs font-medium rounded-md ${testType === 'post' ? 'text-white bg-indigo-600' : 'text-gray-300 hover:bg-gray-600'}`}> Post </button>
             </div>
        </div>

        {/* Overall Progress */}
         <div className="mb-4">
             <div className="flex justify-between text-sm text-gray-400 mb-1">
                 <span>Marking Progress ({markedStudents.size}/{students.length})</span>
                 <span>{progressPercent.toFixed(0)}%</span>
             </div>
             <div className="w-full bg-gray-600 rounded-full h-2">
                 <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
             </div>
         </div>


        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {students.map((s, index) => {
             const result = test.results.find(r => r.studentId === s.id && r.type === testType);
             const isMarked = !!result;
             const isCurrent = index === currentStudentIndex;
             return (
              <div
                key={s.id}
                onClick={() => setCurrentStudentIndex(index)}
                className={`p-2 rounded-md cursor-pointer flex justify-between items-center gap-2 transition-colors ${
                  isCurrent ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'
                }`}
              >
                <span className="truncate pr-2">{s.lastName}, {s.firstName}</span>
                {isMarked ? (
                    <span className="text-xs font-semibold text-cyan-300 flex-shrink-0 bg-gray-900/50 px-1.5 py-0.5 rounded">
                        {totalPossibleMarks > 0 ? `${((result.totalScore / totalPossibleMarks) * 100).toFixed(0)}%` : '✔'}
                    </span>
                ) : null}
              </div>
             )
            })}
        </div>
         <button onClick={onBack} className="mt-4 w-full px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">
             Back to Dashboard
         </button>
      </div>

      {/* Panel 2: Digital Answer Sheet */}
      <div className="md:w-3/4 bg-gray-800 border border-gray-700 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-white mb-1">
          Marking: {test.name} ({testType.toUpperCase()})
        </h2>
        <h3 className="text-lg text-indigo-400 mb-4">
          Student: {currentStudent.lastName}, {currentStudent.firstName}
        </h3>

        <div ref={formRef} className="space-y-4">
          {test.questions.map((q, index) => (
            <div key={q.id} className="grid grid-cols-4 gap-4 items-center border-b border-gray-700 pb-3 last:border-b-0">
               {/* Question Info */}
              <div className="col-span-3">
                 <label className="block text-sm font-medium text-gray-300">
                    Q{index + 1}: {q.prompt} ({q.type})
                 </label>
                 {(q.type === 'MCQ' || q.type === 'Matching') && q.options && (
                     <p className="text-xs text-gray-400 mt-1">Options: {q.options.join(', ')}</p>
                 )}
              </div>
              {/* Input & Marks */}
               <div className="col-span-1 flex flex-col items-end">
                  {renderQuestionInput(q, index)}
                  <span className="text-xs text-gray-400 mt-1">/ {q.maxMarks}</span>
               </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
            <button
                onClick={handleClear}
                className="w-full px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
                Clear All Responses
            </button>
            <button
                onClick={handleSaveAndNext}
                className="w-full px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
                Save & Next Student (Enter)
            </button>
        </div>
      </div>
    </div>
  );
};

export default RapidEntryView;