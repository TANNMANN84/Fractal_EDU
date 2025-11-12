import { useState, useCallback } from 'react';
import { produce } from 'immer';
import { Template } from '../../../types';
import { useAppContext } from '../../../contexts/AppContext';

export const useTemplates = () => {
    const { data, saveData } = useAppContext();
    const [templates, setTemplates] = useState<Record<string, Template>>(() =>
        JSON.parse(localStorage.getItem('examTrackerTemplates') || '{}')
    );

    const saveTemplatesToStorage = useCallback((newTemplates: Record<string, Template>) => {
        localStorage.setItem('examTrackerTemplates', JSON.stringify(newTemplates));
        setTemplates(newTemplates);
    }, []);

    const saveTemplate = (name: string) => {
        if (!name.trim()) {
            alert('Please provide a template name.');
            return false;
        }
        if (!data) return false;
        const activeExam = data.examAnalysis.activeExamId ? data.examAnalysis.exams.find(e => e.id === data.examAnalysis.activeExamId) : null;
        if (!activeExam || activeExam.questions.length === 0) {
            alert('Cannot save an empty structure as a template.');
            return false;
        }
        const newTemplates = { ...templates, [name]: { questions: activeExam.questions, selectedSyllabus: activeExam.selectedSyllabus } };
        saveTemplatesToStorage(newTemplates);
        return true;
    };

    const loadTemplate = (name: string, examId: string) => {
        const template = templates[name];
        if (template && data) {
            const nextData = produce(data, draft => {
                const examToUpdate = draft.examAnalysis.exams.find(e => e.id === examId);
                if (examToUpdate) {
                    examToUpdate.questions = template.questions;
                    examToUpdate.selectedSyllabus = template.selectedSyllabus;
                }
            });
            saveData(nextData);
        }
    };

    const deleteTemplate = (name: string) => {
        const newTemplates = { ...templates };
        delete newTemplates[name];
        saveTemplatesToStorage(newTemplates);
    };

    return { templates, saveTemplate, loadTemplate, deleteTemplate };
};