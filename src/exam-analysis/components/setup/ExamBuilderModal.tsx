import React, { useState } from 'react';
import { produce } from 'immer';
import Modal from '../../components/Modal';
import { useAppContext } from '../../../../contexts/AppContext';
import { createQuestionObject, toRomanNumeral, updateParentQuestionData } from '../../utils/helpers';
import { Question } from '../../../../types';

interface ExamBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Section {
    name: string;
    type: 'mc' | 'long';
    count?: number;
    marks?: number;
    questions?: { subParts: string }[];
}

const ExamBuilderModal: React.FC<ExamBuilderModalProps> = ({ isOpen, onClose }) => {
    const { data, saveData } = useAppContext();
    const [scaffold, setScaffold] = useState<Section[]>([{ name: 'Section I', type: 'mc', count: 20, marks: 1, questions: [] }]);

    const updateSection = (index: number, field: keyof Section, value: any) => {
        setScaffold(produce(draft => {
            (draft[index] as any)[field] = value;
            if (field === 'type') {
                if (value === 'mc') {
                    draft[index].questions = [];
                    draft[index].count = 20;
                    draft[index].marks = 1;
                } else {
                    draft[index].questions = [{subParts:''}];
                    delete draft[index].count;
                    delete draft[index].marks;
                }
            }
        }));
    };
    
    const handleBuildExam = () => {
        if (!data) return;

        let newQuestions: Question[] = [];
        let questionCounter = 1;

        const parseSubparts = (str: string): Question[] => {
            if (!str || !str.trim()) return [];
            return str.split(',').map(s => s.trim()).filter(Boolean).map(partStr => {
                const subMatch = partStr.match(/(.+)\((.*)\)/);
                if (subMatch) {
                    const number = subMatch[1].trim();
                    const subStr = subMatch[2];
                    const question = createQuestionObject(number);
                    question.subQuestions = subStr.split(';').map(s => s.trim()).filter(Boolean).map((_, j) => createQuestionObject(toRomanNumeral(j + 1)));
                    return question;
                } else {
                    return createQuestionObject(partStr);
                }
            });
        };

        scaffold.forEach(section => {
            if (section.type === 'mc') {
                for (let i = 0; i < (section.count || 0); i++) {
                    const q = createQuestionObject(questionCounter.toString());
                    q.maxMarks = section.marks || 1;
                    q.type = 'mcq';
                    q.notes = section.name;
                    newQuestions.push(q);
                    questionCounter++;
                }
            } else {
                section.questions?.forEach(scaffoldQ => {
                    const q = createQuestionObject(questionCounter.toString());
                    q.notes = section.name;
                    q.subQuestions = parseSubparts(scaffoldQ.subParts);
                    newQuestions.push(q);
                    questionCounter++;
                });
            }
        });

        const finalQuestions = updateParentQuestionData(newQuestions);
        const nextData = produce(data, draft => {
            const activeExam = draft.examAnalysis.exams.find(e => e.id === data.examAnalysis.activeExamId);
            if (activeExam) {
                activeExam.questions = finalQuestions;
            }
        });
        saveData(nextData);
        onClose();
    };

    const addQuestionToSection = (sectionIndex: number) => {
        setScaffold(produce(draft => {
            draft[sectionIndex].questions?.push({subParts: ''});
        }));
    };
    
    const removeQuestionFromSection = (sectionIndex: number, qIndex: number) => {
        setScaffold(produce(draft => {
             draft[sectionIndex].questions?.splice(qIndex, 1);
        }));
    };
    
    const updateLongAnswerQuestion = (sectionIndex: number, qIndex: number, value: string) => {
         setScaffold(produce(draft => {
            if (draft[sectionIndex].questions) {
                draft[sectionIndex].questions![qIndex].subParts = value;
            }
        }));
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Exam Builder" className="max-w-4xl">
            <div className="space-y-4">
                {scaffold.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                        <div className="flex justify-between items-center mb-4">
                            <input type="text" value={section.name} onChange={e => updateSection(sectionIndex, 'name', e.target.value)} className="text-lg font-semibold bg-transparent text-white p-1 rounded-md focus:bg-gray-700" />
                            <button onClick={() => setScaffold(scaffold.filter((_, i) => i !== sectionIndex))} className="text-red-400 hover:text-red-300">Remove Section</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-400">Section Type</label>
                                <select value={section.type} onChange={e => updateSection(sectionIndex, 'type', e.target.value)} className="mt-1 w-full p-2 rounded-md bg-gray-700 text-white">
                                    <option value="mc">Multiple Choice</option>
                                    <option value="long">Long Answer</option>
                                </select>
                            </div>
                            {section.type === 'mc' && (
                                <div className="flex items-end gap-2">
                                    <div>
                                        <label className="text-xs font-medium text-gray-400">Number of Qs</label>
                                        <input type="number" value={section.count} onChange={e => updateSection(sectionIndex, 'count', parseInt(e.target.value))} className="mt-1 w-full p-2 rounded-md bg-gray-600" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-400">Marks each</label>
                                        <input type="number" value={section.marks} className="mt-1 w-full p-2 rounded-md bg-gray-600" disabled />
                                    </div>
                                </div>
                            )}
                        </div>
                        {section.type === 'long' && (
                            <div className="mt-4 pt-4 border-t border-gray-600 space-y-2">
                                <h4 className="text-sm font-medium text-gray-300">Long Answer Questions (e.g. a, b(i;ii), c)</h4>
                                {section.questions?.map((q, qIndex) => (
                                    <div key={qIndex} className="flex items-center gap-2">
                                        <label className="text-sm font-semibold text-gray-300">Q{qIndex + 1}</label>
                                        <input type="text" placeholder="a, b(i;ii), c" value={q.subParts} onChange={e => updateLongAnswerQuestion(sectionIndex, qIndex, e.target.value)} className="flex-1 p-2 rounded-md bg-gray-600" />
                                        <button onClick={() => removeQuestionFromSection(sectionIndex, qIndex)} className="p-1 text-red-400 hover:text-red-300">✕</button>
                                    </div>
                                ))}
                                <button onClick={() => addQuestionToSection(sectionIndex)} className="w-full text-sm p-2 mt-2 rounded-md bg-gray-700 hover:bg-gray-600">+ Add Question</button>
                            </div>
                        )}
                    </div>
                ))}
                <button onClick={() => setScaffold([...scaffold, { name: `Section ${toRomanNumeral(scaffold.length + 1).toUpperCase()}`, type: 'long', questions: [{subParts: ''}] }])} className="w-full text-sm p-2 mt-4 rounded-md bg-gray-700 hover:bg-gray-600">+ Add Section</button>
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-600">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Cancel</button>
                <button onClick={handleBuildExam} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Build Exam Scaffold</button>
            </div>
        </Modal>
    );
};

export default ExamBuilderModal;