
import React, { useState, useMemo } from 'react';
import type { Student, ReportOptions } from '../types';

interface StudentListViewProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

type SortableKeys = 'lastName' | 'atsiStatus' | 'hasLearningPlan' | 'hasBehaviourPlan' | 'hpgeStatus';

export type { ReportOptions };

const StudentListView: React.FC<StudentListViewProps> = ({ students, onSelectStudent }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' }>({ key: 'lastName', direction: 'ascending' });

    const sortedStudents = useMemo(() => {
        let sortableStudents = [...students];
        if (sortConfig !== null) {
            sortableStudents.sort((a, b) => {
                const key = sortConfig.key;
                let aValue: any;
                let bValue: any;

                switch (key) {
                    case 'lastName':
                        aValue = a.lastName;
                        bValue = b.lastName;
                        break;
                    case 'atsiStatus':
                        aValue = a.profile.atsiStatus;
                        bValue = b.profile.atsiStatus;
                        break;
                    case 'hasLearningPlan':
                        aValue = a.wellbeing.hasLearningPlan;
                        bValue = b.wellbeing.hasLearningPlan;
                        break;
                    case 'hasBehaviourPlan':
                        aValue = a.wellbeing.hasBehaviourPlan;
                        bValue = b.wellbeing.hasBehaviourPlan;
                        break;
                    case 'hpgeStatus':
                        aValue = a.hpge.status;
                        bValue = b.hpge.status;
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableStudents;
    }, [students, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ sortKey: SortableKeys; children: React.ReactNode }> = ({ sortKey, children }) => (
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(sortKey)}>
             <div className="flex items-center">
                {children}
                {sortConfig?.key === sortKey && (
                    <span className="ml-2 dark:text-gray-300">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                )}
            </div>
        </th>
    );

    const YesNoBadge: React.FC<{ value: boolean }> = ({ value }) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${value ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
            {value ? 'Yes' : 'No'}
        </span>
    );

    return (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <SortableHeader sortKey="lastName">Name</SortableHeader>
                        <SortableHeader sortKey="atsiStatus">ATSI</SortableHeader>
                        <SortableHeader sortKey="hasLearningPlan">Learning Plan</SortableHeader>
                        <SortableHeader sortKey="hasBehaviourPlan">Behaviour Plan</SortableHeader>
                        <SortableHeader sortKey="hpgeStatus">HPGE Status</SortableHeader>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedStudents.map(student => (
                        <tr key={student.studentId} onClick={() => onSelectStudent(student)} className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{student.lastName}, {student.firstName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.profile.atsiStatus}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"><YesNoBadge value={student.wellbeing.hasLearningPlan} /></td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"><YesNoBadge value={student.wellbeing.hasBehaviourPlan} /></td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.hpge.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StudentListView;
