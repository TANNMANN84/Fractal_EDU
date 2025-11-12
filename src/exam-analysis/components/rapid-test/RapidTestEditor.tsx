// src/components/rapid-test/RapidTestEditor.tsx

import React, { useState } from 'react';
import { RapidTest, RapidQuestion } from '../../../../types';
import RapidQuestionEditor from './RapidQuestionEditor';

interface RapidTestEditorProps {
  test: RapidTest;
  onSave: (updatedTest: RapidTest) => void;
  onCancel: () => void;
}

const createNewQuestion = (): RapidQuestion => ({
  id: crypto.randomUUID(),
  prompt: '',
  type: 'Spelling',
  maxMarks: 1,
  correctAnswer: '',
});

const RapidTestEditor: React.FC<RapidTestEditorProps> = ({
  test,
  onSave,
  onCancel,
}) => {
  const [localTest, setLocalTest] = useState<RapidTest>(test);

  const handleTestNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTest({ ...localTest, name: e.target.value });
  };

  const handleAddQuestion = () => {
    setLocalTest({
      ...localTest,
      questions: [...localTest.questions, createNewQuestion()],
    });
  };

  const handleQuestionChange = (index: number, updatedQuestion: RapidQuestion) => {
    const newQuestions = [...localTest.questions];
    newQuestions[index] = updatedQuestion;
    setLocalTest({ ...localTest, questions: newQuestions });
  };

  const handleQuestionDelete = (index: number) => {
    const newQuestions = localTest.questions.filter((_, i) => i !== index);
    setLocalTest({ ...localTest, questions: newQuestions });
  };

  return (
    <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-white">
          Editing Pre/Post Test
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(localTest)}
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Save Test Structure
          </button>
        </div>
      </div>

      {/* Test Name */}
      <div>
        <label className="block text-lg font-medium text-gray-300">
          Test Name
        </label>
        <input
          type="text"
          value={localTest.name}
          onChange={handleTestNameChange}
          placeholder="e.g., Year 11 Module 5 Test"
          className="mt-1 w-full max-w-lg rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white text-lg"
        />
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Questions</h3>
        {localTest.questions.map((q, index) => (
          <RapidQuestionEditor
            key={q.id}
            question={q}
            index={index}
            onChange={(updatedQ) => handleQuestionChange(index, updatedQ)}
            onDelete={() => handleQuestionDelete(index)}
          />
        ))}
        <button
          onClick={handleAddQuestion}
          className="w-full px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          + Add Question
        </button>
      </div>
    </div>
  );
};

export default RapidTestEditor;