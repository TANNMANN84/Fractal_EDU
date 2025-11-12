// src/components/setup/SetupSection.tsx

import React, { useState, useEffect } from 'react';
import { produce } from 'immer';
import { useAppContext } from '../../../../contexts/AppContext';
import { syllabusData } from '../../data/syllabusData';
import QuestionStructure from './QuestionStructure'; // Import the component
import ExamBuilderModal from './ExamBuilderModal';
import QuestionEditorModal from './QuestionEditorModal';
import { useTemplates } from '../../hooks/useTemplates';
import Modal from '../Modal';

interface SetupSectionProps {
  onFinalize: () => void;
}

const SetupSection: React.FC<SetupSectionProps> = ({ /* onFinalize */ }) => {
  const { data, saveData } = useAppContext();
  
  if (!data) {
    return null;
  }
  const activeExam = data.examAnalysis.activeExamId ? data.examAnalysis.exams.find(e => e.id === data.examAnalysis.activeExamId) : null;

  if (!activeExam) {
    // Optionally render a message or create a default exam
    return <div className="text-center p-8">Please create or select an exam to begin.</div>;
  }

  const { selectedSyllabus, structureLocked, questions } = activeExam;
  const { templates, saveTemplate, loadTemplate, deleteTemplate } = useTemplates();

  const [isExamBuilderOpen, setIsExamBuilderOpen] = useState(false);
  const [isQuestionEditorOpen, setIsQuestionEditorOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [addingSubToParentId, setAddingSubToParentId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateAction, setTemplateAction] = useState<'save' | 'load'>('load');
  const [newTemplateName, setNewTemplateName] = useState('');


  const handleSyllabusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextData = produce(data, draft => {
      const exam = draft.examAnalysis.exams.find(e => e.id === activeExam.id);
      if (exam) {
        exam.selectedSyllabus = e.target.value;
      }
    });
    saveData(nextData);
  };

  const handleFinalize = () => {
      if (!Array.isArray(questions) || questions.length === 0) {
           alert("Please add at least one question to the exam structure.");
           return;
      }
      const nextData = produce(data, draft => {
        const exam = draft.examAnalysis.exams.find(e => e.id === activeExam.id);
        if (exam) {
          exam.structureLocked = true;
        }
      });
      saveData(nextData);
  };

   const openQuestionEditor = (questionId: string | null = null, parentId: string | null = null) => {
        setEditingQuestionId(questionId);
        setAddingSubToParentId(parentId);
        setIsQuestionEditorOpen(true);
    };

    // Handler for editing an existing question (passed as onEdit)
    const handleEditQuestion = (questionId: string) => {
        openQuestionEditor(questionId, null);
    };
    // Handler for adding a sub-question (passed as onAddSub)
    const handleAddSubQuestion = (parentId: string) => {
        openQuestionEditor(null, parentId);
    };

    const handleOpenTemplateModal = (action: 'save' | 'load') => {
        setTemplateAction(action);
        setIsTemplateModalOpen(true);
        setNewTemplateName('');
    };

    const handleSaveTemplate = () => {
        if (!newTemplateName.trim()) {
            alert("Please enter a name for the template."); return;
        }
        if (!Array.isArray(questions) || questions.length === 0) {
             alert("Cannot save an empty structure."); return;
        }
        saveTemplate(newTemplateName);
        setNewTemplateName('');
    };

    const handleLoadTemplate = (name: string) => {
        if (activeExam) {
            loadTemplate(name, activeExam.id);
        }
        setIsTemplateModalOpen(false);
    };

    const handleDeleteTemplate = (name: string) => {
         if (window.confirm(`Are you sure you want to delete the template "${name}"?`)) {
            deleteTemplate(name);
         }
    };

  if (structureLocked) {
      return null;
  }

  return (
    <>
      <div id="setup-section" className={`bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md mb-8`}>
        <div className="flex flex-wrap justify-between items-center mb-4 border-b border-gray-600 pb-3 gap-2">
          <h2 className="text-2xl font-semibold text-white">1. Exam Structure Setup</h2>
        </div>

        <div className="mb-6">
          <label htmlFor="syllabus-select" className="block text-sm font-medium text-gray-300">Pre-populate Topics (NSW Science Syllabus)</label>
          <select
            id="syllabus-select"
            value={selectedSyllabus}
            onChange={handleSyllabusChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-white"
          >
            <option value="" disabled>Select a Syllabus...</option>
            {Object.keys(syllabusData).map(key => (
              <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* *** FIX IS HERE: Use onEdit and onAddSub prop names *** */}
        <QuestionStructure
            onEdit={handleEditQuestion}
            onAddSub={handleAddSubQuestion}
        />
        {/* *** END FIX *** */}


        <div className="mt-6 pt-6 border-t border-gray-700 space-y-6">
          <button
            onClick={() => setIsExamBuilderOpen(true)}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={!selectedSyllabus}
            title={!selectedSyllabus ? "Select a syllabus first" : ""}
          >
            Build Exam Structure (Exam Builder)
          </button>

          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <button onClick={() => handleOpenTemplateModal('save')} className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 mr-2"> Save as Template </button>
              <button onClick={() => handleOpenTemplateModal('load')} className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600"> Load Template </button>
            </div>
            <button
              onClick={handleFinalize}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Finalise and Proceed to Data Entry
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExamBuilderModal isOpen={isExamBuilderOpen} onClose={() => setIsExamBuilderOpen(false)} />
      <QuestionEditorModal isOpen={isQuestionEditorOpen} onClose={() => setIsQuestionEditorOpen(false)} questionId={editingQuestionId} parentId={addingSubToParentId} />
       <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={templateAction === 'save' ? "Save Structure as Template" : "Load Structure from Template"} >
             <div className="space-y-4">
                 <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                     <h4 className="text-md font-semibold text-gray-300"> {Object.keys(templates).length > 0 ? "Existing Templates:" : "No saved templates."} </h4>
                     {Object.keys(templates).sort().map(name => ( <div key={name} className="flex justify-between items-center p-2 bg-gray-700 rounded-md"> <span className="truncate pr-2">{name}</span> <div className="flex-shrink-0 flex gap-2"> {templateAction === 'load' && ( <button onClick={() => handleLoadTemplate(name)} className="text-blue-400 hover:text-blue-300 text-sm font-medium">Load</button> )} <button onClick={() => handleDeleteTemplate(name)} className="text-red-400 hover:text-red-300 text-sm font-medium">Delete</button> </div> </div> ))}
                 </div>
                 {templateAction === 'save' && ( <div className="pt-4 border-t border-gray-600"> <label htmlFor="new-template-name" className="block text-sm font-medium text-gray-300">Save current structure as:</label> <div className="mt-1 flex gap-2"> <input type="text" id="new-template-name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Enter template name..." className="flex-grow block w-full rounded-md bg-gray-600 border-gray-500 p-2 text-white focus:ring-indigo-500 focus:border-indigo-500" /> <button onClick={handleSaveTemplate} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Save New</button> </div> </div> )}
                  <div className="mt-4 flex justify-end"> <button onClick={() => setIsTemplateModalOpen(false)} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Close</button> </div>
             </div>
        </Modal>
    </>
  );
};

export default SetupSection;