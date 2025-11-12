// src/components/rapid-test/RapidTestAnalysis.tsx

import React, { useMemo, useCallback, useState } from 'react';
import { generateRapidTestReport, generateStudentReport } from '../../utils/pdfUtils';
import { useAppContext } from '../../../../contexts/AppContext';
import { RapidQuestion, RapidTest, ExamStudent } from '../../../../types'; import BarChart, { BarChartData } from './BarChart';

interface AnalysisData {
  studentId: string;
  studentName: string;
  preScore: number | null;
  postScore: number | null;
  prePercentage: number | null;
  postPercentage: number | null;
  growth: number | null;
}

interface RapidTestAnalysisProps {
  test: RapidTest;
  onBack: () => void;
}

interface QuestionAnalysisData {
  questionId: string;
  prompt: string;
  avgPreScore: number | null;
  avgPostScore: number | null;
  avgGrowth: number | null;
  maxMarks: number;
}

const RapidTestAnalysis: React.FC<RapidTestAnalysisProps> = ({ test, onBack }) => { // eslint-disable-line
  const { data } = useAppContext();
  if (!data) {
    return <div>Loading...</div>;
  }

  const allStudents = data.examAnalysis.rapidTestStudents;

  const [selectedClass, setSelectedClass] = useState<string>('all');

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Get unique class names for the dropdown
  const classNames = useMemo(() => {
    const classes = new Set<string>();
    allStudents.forEach(s => {
      if (s.className) classes.add(s.className);
    });
    return Array.from(classes).sort();
  }, [allStudents]);

  // Filter students based on selected class
  const students = useMemo(() => {
    const baseStudents = allStudents.filter(s => s.lastName || s.firstName).sort((a,b) => a.lastName.localeCompare(b.lastName));
    if (selectedClass === 'all') return baseStudents;
    return baseStudents.filter(s => s.className === selectedClass);
  }, [allStudents, selectedClass]);

  // Helper function to get score for a rapid question, moved here from AppContext
  const getScoreForRapidQuestion = useCallback((question: RapidQuestion, response: any): number => {
    if (response === undefined || response === null || response === '') return 0;

    switch (question.type) {
      case 'Spelling':
        // Assuming 'Correct' is stored for correct answers, or compare to correctAnswer if provided
        return (response === 'Correct') ? (question.maxMarks || 0) : 0;
      case 'MCQ':
        return (response === question.correctAnswer) ? (question.maxMarks || 0) : 0;
      case 'Matching':
        return (response === 'Correct') ? (question.maxMarks || 0) : 0;
      case 'Written':
      case 'Marks':
        return Math.max(0, Math.min(Number(response), question.maxMarks || 0));
      default:
        return 0;
    }
  }, []);

  const totalPossibleMarks = useMemo(() => {
    return test.questions.reduce((sum, q) => sum + (q.maxMarks || 0), 0);
  }, [test.questions]);

  const analysisData: AnalysisData[] = useMemo(() => {
    return students.map(student => {
      const preResult = test.results.find(r => r.studentId === student.id && r.type === 'pre');
      const postResult = test.results.find(r => r.studentId === student.id && r.type === 'post');

      const preScore = preResult?.totalScore ?? null;
      const postScore = postResult?.totalScore ?? null;

      const prePercentage = preScore !== null && totalPossibleMarks > 0 ? (preScore / totalPossibleMarks) * 100 : null;
      const postPercentage = postScore !== null && totalPossibleMarks > 0 ? (postScore / totalPossibleMarks) * 100 : null;

      const growth = prePercentage !== null && postPercentage !== null ? postPercentage - prePercentage : null;

      return {
        studentId: student.id,
        studentName: `${student.lastName}, ${student.firstName}`,
        preScore,
        postScore,
        prePercentage,
        postPercentage,
        growth,
      };
    });
  }, [students, test.results, totalPossibleMarks]);

  const classAverages = useMemo(() => {
    const validPreScores = analysisData.map(d => d.prePercentage).filter(s => s !== null) as number[];
    const validPostScores = analysisData.map(d => d.postPercentage).filter(s => s !== null) as number[];
    const validGrowths = analysisData.map(d => d.growth).filter(g => g !== null) as number[];

    const avgPre = validPreScores.length > 0 ? validPreScores.reduce((a, b) => a + b, 0) / validPreScores.length : null;
    const avgPost = validPostScores.length > 0 ? validPostScores.reduce((a, b) => a + b, 0) / validPostScores.length : null;
    const avgGrowth = validGrowths.length > 0 ? validGrowths.reduce((a, b) => a + b, 0) / validGrowths.length : null;

    return { avgPre, avgPost, avgGrowth };
  }, [analysisData]);

  const questionAnalysisData: QuestionAnalysisData[] = useMemo(() => {
    return test.questions.map(q => {
      let totalPreScore = 0;
      let totalPostScore = 0;
      let preCount = 0;
      let postCount = 0;

      test.results.forEach(r => {
        const preResponse = r.type === 'pre' ? r.responses[q.id] : undefined;
        const postResponse = r.type === 'post' ? r.responses[q.id] : undefined;

        if (preResponse !== undefined) {
          totalPreScore += getScoreForRapidQuestion(q, preResponse);
          preCount++;
        }
        if (postResponse !== undefined) {
          totalPostScore += getScoreForRapidQuestion(q, postResponse);
          postCount++;
        }
      });

      const avgPreScore = preCount > 0 ? (totalPreScore / preCount) : null;
      const avgPostScore = postCount > 0 ? (totalPostScore / postCount) : null;

      const avgPrePercentage = avgPreScore !== null && q.maxMarks > 0 ? (avgPreScore / q.maxMarks) * 100 : null;
      const avgPostPercentage = avgPostScore !== null && q.maxMarks > 0 ? (avgPostScore / q.maxMarks) * 100 : null;

      return {
        questionId: q.id,
        prompt: q.prompt,
        avgPreScore: avgPrePercentage,
        avgPostScore: avgPostPercentage,
        avgGrowth: (avgPrePercentage !== null && avgPostPercentage !== null) ? avgPostPercentage - avgPrePercentage : null,
        maxMarks: q.maxMarks,
      };
    }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test.questions, test.results]);

  const chartDataClassAvg: BarChartData[] = useMemo(() => {
    return [{
      label: 'Class Average',
      preValue: classAverages.avgPre ?? 0,
      postValue: classAverages.avgPost ?? 0,
    }];
  }, [classAverages]);

  const chartDataQuestionGrowth: BarChartData[] = useMemo(() => {
    return questionAnalysisData.map(q => ({ label: `Q${test.questions.findIndex(tq => tq.id === q.questionId) + 1}`, preValue: q.avgPreScore ?? 0, postValue: q.avgPostScore ?? 0 }));
  }, [questionAnalysisData, test.questions]);

  const renderGrowth = (growth: number | null) => {
    if (growth === null) return <span className="text-gray-500">-</span>;
    const color = growth > 0 ? 'text-green-400' : growth < 0 ? 'text-red-400' : 'text-gray-400';
    const sign = growth > 0 ? '+' : '';
    return <span className={color}>{sign}{growth.toFixed(1)}%</span>;
  };

  const handleExportClassReport = () => {
    generateRapidTestReport(test, analysisData, questionAnalysisData, classAverages);
  };

  const handleExportStudentReport = () => {
    if (!selectedStudent) return;
    // We can pass preResult and postResult directly as they are already calculated
    generateStudentReport(test, selectedStudent, preResult, postResult, getScoreForRapidQuestion);
  };

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);
  const preResult = useMemo(() => test.results.find(r => r.studentId === selectedStudentId && r.type === 'pre'), [test.results, selectedStudentId]);
  const postResult = useMemo(() => test.results.find(r => r.studentId === selectedStudentId && r.type === 'post'), [test.results, selectedStudentId]);

  const studentQuestionChartData: BarChartData[] = useMemo(() => {
    if (!test || !selectedStudentId) return [];
    return test.questions.map((q, index) => {
      const preResponse = preResult?.responses[q.id];
      const postResponse = postResult?.responses[q.id];

      const preScore = preResponse !== undefined ? getScoreForRapidQuestion(q, preResponse) : 0;
      const postScore = postResponse !== undefined ? getScoreForRapidQuestion(q, postResponse) : 0;

      const prePercentage = q.maxMarks > 0 ? (preScore / q.maxMarks) * 100 : 0;
      const postPercentage = q.maxMarks > 0 ? (postScore / q.maxMarks) * 100 : 0;

      return {
        label: `Q${index + 1}`,
        preValue: prePercentage,
        postValue: postPercentage,
      };
    });
  }, [test, selectedStudentId, preResult, postResult, getScoreForRapidQuestion]);

  // --- Render Student Drill Down View ---
  if (selectedStudentId) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Detailed Analysis for {selectedStudent?.firstName} {selectedStudent?.lastName}</h3>
          <div className="flex gap-2">
            <button onClick={handleExportStudentReport} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
              Export PDF
            </button>
            <button onClick={() => setSelectedStudentId(null)} className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">
              Back to Class View
            </button>
          </div>
        </div>
        <div className="space-y-8">
          <BarChart data={studentQuestionChartData} title="Score per Question" />
          <div>
            <h4 className="text-lg font-semibold text-gray-200 mb-3">Detailed Answers</h4>
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Question</th>
                    <th className="px-3 py-3.5 text-center text-sm font-semibold text-white">Pre-Test Answer</th>
                    <th className="px-3 py-3.5 text-center text-sm font-semibold text-white">Pre-Test Score</th>
                    <th className="px-3 py-3.5 text-center text-sm font-semibold text-white">Post-Test Answer</th>
                    <th className="px-3 py-3.5 text-center text-sm font-semibold text-white">Post-Test Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                  {test.questions.map(q => {
                    const preResponse = preResult?.responses[q.id];
                    const postResponse = postResult?.responses[q.id];
                    const preScore = preResponse !== undefined ? getScoreForRapidQuestion(q, preResponse) : null;
                    const postScore = postResponse !== undefined ? getScoreForRapidQuestion(q, postResponse) : null;
                    return (
                      <tr key={q.id} className="hover:bg-gray-700/40">
                        <td className="py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">{q.prompt}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 text-center">{preResponse ?? '-'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-cyan-300 text-center">{preScore !== null ? `${preScore} / ${q.maxMarks}` : '-'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 text-center">{postResponse ?? '-'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-cyan-300 text-center">{postScore !== null ? `${postScore} / ${q.maxMarks}` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Main Analysis View ---
  return (
    <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-grow">
          <h2 className="text-2xl font-semibold text-white">Analysis for {test.name}</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex rounded-md shadow-sm bg-gray-700 p-0.5">
              <button onClick={() => setViewMode('table')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'table' ? 'text-white bg-indigo-600' : 'text-gray-300 hover:bg-gray-600'}`}>Table View</button>
              <button onClick={() => setViewMode('chart')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'chart' ? 'text-white bg-indigo-600' : 'text-gray-300 hover:bg-gray-600'}`}>Chart View</button>
            </div>
            {classNames.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="class-filter" className="text-sm text-gray-400">Filter by Class:</label>
                <select id="class-filter" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="bg-gray-700 text-white text-sm rounded-md p-1 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="all">All Students</option>
                  {classNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleExportClassReport} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
              Export PDF
            </button>
            <button onClick={onBack} className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Back to Dashboard</button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="space-y-8">
          {/* Student Growth Table */}
          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-3">Student Growth</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Student</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-white">Pre-Test Score</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-white">Post-Test Score</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-white">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                  {analysisData.map((data) => (
                    <tr key={data.studentId} onClick={() => setSelectedStudentId(data.studentId)} className="hover:bg-gray-700/40 cursor-pointer">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">{data.studentName}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 text-center">
                        {data.prePercentage !== null ? `${data.prePercentage.toFixed(1)}%` : <span className="text-gray-500">Not Marked</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 text-center">
                        {data.postPercentage !== null ? `${data.postPercentage.toFixed(1)}%` : <span className="text-gray-500">Not Marked</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-center">{renderGrowth(data.growth)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-700/80">
                  <tr>
                    <th scope="row" className="py-3 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Class Average</th>
                    <td className="px-3 py-3 text-sm font-bold text-cyan-300 text-center">{classAverages.avgPre !== null ? `${classAverages.avgPre.toFixed(1)}%` : '-'}</td>
                    <td className="px-3 py-3 text-sm font-bold text-cyan-300 text-center">{classAverages.avgPost !== null ? `${classAverages.avgPost.toFixed(1)}%` : '-'}</td>
                    <td className="px-3 py-3 text-sm font-bold text-center">{renderGrowth(classAverages.avgGrowth)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Question Breakdown Table */}
          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-3">Question Breakdown</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6 w-3/5">Question</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-white">Avg. Pre-Test</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-white">Avg. Post-Test</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-white">Avg. Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                  {questionAnalysisData.map((q) => (
                    <tr key={q.questionId} className="hover:bg-gray-700/40">
                      <td className="py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">{q.prompt} <span className="text-gray-400 text-xs">({q.maxMarks} marks)</span></td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 text-center">{q.avgPreScore !== null ? `${q.avgPreScore.toFixed(1)}%` : '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 text-center">{q.avgPostScore !== null ? `${q.avgPostScore.toFixed(1)}%` : '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-center">{renderGrowth(q.avgGrowth)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
            <BarChart data={chartDataClassAvg} title="Class Average Pre- vs Post-Test Scores" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <BarChart data={chartDataQuestionGrowth.slice(0, Math.ceil(chartDataQuestionGrowth.length / 2))} title="Question Growth (Part 1)" />
                <BarChart data={chartDataQuestionGrowth.slice(Math.ceil(chartDataQuestionGrowth.length / 2))} title="Question Growth (Part 2)" />
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm bg-indigo-500"></div>Pre-Test</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm bg-green-500"></div>Post-Test</div>
            </div>
          </div>
      )}
    </div>
  );
};

export default RapidTestAnalysis;
