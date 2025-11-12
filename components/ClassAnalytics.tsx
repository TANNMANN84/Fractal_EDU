
import React, { useState, useMemo } from 'react';
import type { Student } from '../types';
import BarChart from './BarChart';
import PieChart from './PieChart';

interface ClassAnalyticsProps {
    students: Student[];
}

const NAPLAN_YEARS = ['year7', 'year9'] as const;
const NAPLAN_SUBJECTS = ['reading', 'writing', 'spelling', 'grammar', 'numeracy'] as const;
type NaplanSubject = typeof NAPLAN_SUBJECTS[number];

const NAPLAN_SUBJECT_DISPLAY: Record<NaplanSubject, string> = {
    reading: 'Reading',
    writing: 'Writing',
    spelling: 'Spelling',
    grammar: 'Grammar & Punctuation',
    numeracy: 'Numeracy',
};

const NAPLAN_BAND_COLORS: { [key: string]: string } = {
    'Exceeding': '#3b82f6', // blue-500
    'Strong': '#22c55e', // green-500
    'Developing': '#f59e0b', // amber-500
    'Needs additional support': '#ef4444', // red-500
    'Not Assessed': '#6b7280', // gray-500
};

const ClassAnalytics: React.FC<ClassAnalyticsProps> = ({ students }) => {
    const [naplanYear, setNaplanYear] = useState<'year7' | 'year9'>('year7');
    const [naplanSubject, setNaplanSubject] = useState<NaplanSubject>('reading');
    const [selectedStudents, setSelectedStudents] = useState<{ title: string; students: Student[] } | null>(null);

    const naplanData = useMemo(() => {
        const counts: { [key: string]: number } = {
            'Exceeding': 0, 'Strong': 0, 'Developing': 0, 'Needs additional support': 0, 'Not Assessed': 0
        };

        students.forEach(student => {
            const band = student.academic.naplan[naplanYear]?.[naplanSubject] || 'Not Assessed';
            if (counts.hasOwnProperty(band)) {
                counts[band]++;
            }
        });

        return Object.keys(counts).map(key => ({
            label: key,
            value: counts[key],
            color: NAPLAN_BAND_COLORS[key] || '#6b7280'
        }));
    }, [students, naplanYear, naplanSubject]);

    const planData = useMemo(() => {
        const learningPlanCount = students.filter(s => s.wellbeing.hasLearningPlan).length;
        const behaviourPlanCount = students.filter(s => s.wellbeing.hasBehaviourPlan).length;
        const total = students.length;
        return {
            learning: [
                { label: 'Has Plan', value: learningPlanCount, color: '#8b5cf6' }, // violet-500
                { label: 'No Plan', value: total - learningPlanCount, color: '#d1d5db' } // gray-300
            ],
            behaviour: [
                { label: 'Has Plan', value: behaviourPlanCount, color: '#ec4899' }, // pink-500
                { label: 'No Plan', value: total - behaviourPlanCount, color: '#d1d5db' }
            ]
        };
    }, [students]);

    const hpgeData = useMemo(() => {
        const counts = students.reduce((acc, student) => {
            const status = student.hpge.status || 'Not Identified';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const colors: { [key: string]: string } = {
            'Identified': '#a855f7', // purple-500
            'Nominated': '#f97316', // orange-500
            'Not Identified': '#d1d5db'
        };

        return Object.entries(counts).map(([label, value]) => ({ label, value, color: colors[label] || '#d1d5db' }));
    }, [students]);

    const atsiData = useMemo(() => {
        const counts = students.reduce((acc, student) => {
            const status = student.profile.atsiStatus || 'Not Stated';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
         const colors: { [key: string]: string } = {
            'Yes': '#14b8a6', // teal-500
            'No': '#d1d5db',
            'Not Stated': '#9ca3af' // gray-400
        };
        return Object.entries(counts).map(([label, value]) => ({ label, value, color: colors[label] || '#d1d5db' }));
    }, [students]);

    const handleNaplanBarClick = (band: string) => {
        const filteredStudents = students.filter(student => {
            const studentBand = student.academic.naplan[naplanYear]?.[naplanSubject] || 'Not Assessed';
            return studentBand === band;
        });
        const subjectDisplayName = NAPLAN_SUBJECT_DISPLAY[naplanSubject];
        setSelectedStudents({
            title: `Students: Year ${naplanYear.slice(-1)} ${subjectDisplayName} - ${band}`,
            students: filteredStudents
        });
    };

    const handlePieSliceClick = (
        label: string,
        filterFn: (student: Student) => boolean,
        titlePrefix: string
    ) => {
        const filteredStudents = students.filter(filterFn);
        setSelectedStudents({
            title: `${titlePrefix}: ${label}`,
            students: filteredStudents,
        });
    };

    if (students.length === 0) {
        return (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                 <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Class Analytics</h3>
                 <p className="text-gray-600 dark:text-gray-400 mt-2">Add students to the class to see analytics.</p>
             </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Class Analytics</h3>
            <div className="space-y-6">
                {/* NAPLAN Chart */}
                <div>
                    <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">NAPLAN Distribution</h4>
                        <div className="flex gap-2">
                            <select value={naplanYear} onChange={e => setNaplanYear(e.target.value as 'year7' | 'year9')} className="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm p-1">
                                {NAPLAN_YEARS.map(year => <option key={year} value={year}>{`Year ${year.slice(-1)}`}</option>)}
                            </select>
                            <select value={naplanSubject} onChange={e => setNaplanSubject(e.target.value as NaplanSubject)} className="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm p-1">
                                {NAPLAN_SUBJECTS.map(subject => <option key={subject} value={subject}>{NAPLAN_SUBJECT_DISPLAY[subject]}</option>)}
                            </select>
                        </div>
                    </div>
                    <BarChart data={naplanData} onBarClick={handleNaplanBarClick} />
                </div>

                {/* Other Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t dark:border-gray-700">
                    <PieChart data={planData.learning} title="Learning Plans" onSliceClick={(label) => handlePieSliceClick(label, s => s.wellbeing.hasLearningPlan === (label === 'Has Plan'), 'Students with Learning Plan')} />
                    <PieChart data={planData.behaviour} title="Behaviour Plans" onSliceClick={(label) => handlePieSliceClick(label, s => s.wellbeing.hasBehaviourPlan === (label === 'Has Plan'), 'Students with Behaviour Plan')} />
                    <PieChart data={hpgeData} title="HPGE Status" onSliceClick={(label) => handlePieSliceClick(label, s => s.hpge.status === label, 'Students with HPGE Status')} />
                    <PieChart data={atsiData} title="ATSI Status" onSliceClick={(label) => handlePieSliceClick(label, s => s.profile.atsiStatus === label, 'Students with ATSI Status')} />
                </div>
            </div>

            {selectedStudents && (
                <div className="mt-6 p-4 border-t-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-indigo-800 dark:text-indigo-300">{selectedStudents.title} ({selectedStudents.students.length})</h4>
                        <button
                            onClick={() => setSelectedStudents(null)}
                            className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 font-bold text-2xl leading-none"
                            aria-label="Close student list"
                        >
                            &times;
                        </button>
                    </div>
                    <ul className="max-h-48 overflow-y-auto space-y-1 pr-2">
                        {selectedStudents.students.length > 0 ? (
                            selectedStudents.students.sort((a,b) => a.lastName.localeCompare(b.lastName)).map(student => (
                                <li key={student.studentId} className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 p-2 rounded border dark:border-gray-600">
                                    {student.lastName}, {student.firstName}
                                </li>
                            ))
                        ) : (
                            <li className="text-sm text-gray-500 italic">No students in this category.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ClassAnalytics;
