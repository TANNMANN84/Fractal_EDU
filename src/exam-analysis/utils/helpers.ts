import { Question, Student } from "../types";

export const createStudentObject = (): Student => ({
    id: crypto.randomUUID(),
    lastName: '',
    firstName: '',
    tags: [],
    responses: {},
    mcqResponses: {}
});

export const createQuestionObject = (number = ''): Question => ({
    id: crypto.randomUUID(),
    number,
    maxMarks: 1,
    type: 'marks',
    correctAnswer: '',
    module: [],
    contentArea: [],
    outcome: [],
    cognitiveVerb: [],
    notes: '',
    subQuestions: []
});

export const getLeafQuestions = (questions: Question[], parentNumber = '', level = 1): Question[] => {
    let leaves: Question[] = [];
    questions.forEach((q) => {
        const currentNumber = parentNumber ? `${parentNumber}(${q.number})` : `Q${q.number}`;
        if (q.subQuestions.length === 0) {
            leaves.push({ ...q, displayNumber: currentNumber, level: level });
        } else {
            leaves = leaves.concat(getLeafQuestions(q.subQuestions, currentNumber, level + 1));
        }
    });
    return leaves;
};

export const getAllQuestionsFlat = (questions: Question[]): Question[] => {
    let flatList: Question[] = [];
    questions.forEach(q => {
        flatList.push(q);
        if (q.subQuestions && q.subQuestions.length > 0) {
            flatList = flatList.concat(getAllQuestionsFlat(q.subQuestions));
        }
    });
    return flatList;
};

export const findQuestionAndParent = (id: string, questions: Question[], parent: Question | null = null): { question: Question; parent: Question | null } | null => {
    for (const question of questions) {
        if (question.id === id) return { question, parent };
        const found = findQuestionAndParent(id, question.subQuestions, question);
        if (found) return found;
    }
    return null;
};

export const findQuestionById = (id: string, questions: Question[]): Question | null => {
    return findQuestionAndParent(id, questions)?.question || null;
}

export const getQuestionPath = (id: string, questions: Question[], currentPath: Question[] = []): Question[] | null => {
    for (const q of questions) {
        if (q.id === id) {
            return [...currentPath, q];
        }
        const path = getQuestionPath(id, q.subQuestions, [...currentPath, q]);
        if (path) {
            return path;
        }
    }
    return null;
};


export const getColorForScore = (score: number | null | undefined, maxMarks: number): string => {
    if (score === null || score === undefined || maxMarks === 0) return 'bg-gray-700';
    const percentage = (score / maxMarks) * 100;
    if (percentage === 0) return 'bg-red-900/50';
    if (percentage < 40) return 'bg-red-700/60';
    if (percentage < 60) return 'bg-yellow-700/60';
    if (percentage < 90) return 'bg-green-700/60';
    if (percentage <= 100) return 'bg-green-600/70';
    return 'bg-gray-700';
};

export const toRomanNumeral = (num: number): string => {
    const numerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
    return numerals[num - 1] || num.toString();
}

export const updateParentQuestionData = (questions: Question[]): Question[] => {
    const aggregateAndUpdate = (qs: Question[]): Question[] => {
        return qs.map(q => {
            if (q.subQuestions.length > 0) {
                const updatedSubQuestions = aggregateAndUpdate(q.subQuestions);
                const leaves = getLeafQuestions(updatedSubQuestions);
                const allModules = new Set(leaves.flatMap(leaf => leaf.module || []));
                const allContent = new Set(leaves.flatMap(leaf => leaf.contentArea || []));
                const allOutcomes = new Set(leaves.flatMap(leaf => leaf.outcome || []));
                const allVerbs = new Set(leaves.flatMap(leaf => leaf.cognitiveVerb || []));

                return {
                    ...q,
                    subQuestions: updatedSubQuestions,
                    module: Array.from(allModules).sort(),
                    contentArea: Array.from(allContent).sort(),
                    outcome: Array.from(allOutcomes).sort(),
                    cognitiveVerb: Array.from(allVerbs).sort(),
                    maxMarks: leaves.reduce((sum, leaf) => sum + Number(leaf.maxMarks || 0), 0)
                };
            }
            return q;
        });
    };
    return aggregateAndUpdate(questions);
};