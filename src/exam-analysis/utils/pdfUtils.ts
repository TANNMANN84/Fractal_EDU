// src/utils/pdfUtils.ts

import { jsPDF } from 'jspdf'; 
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { RapidTest, Student } from '../types';

// --- Interfaces for Rapid Test Data ---
interface AnalysisData {
  studentId: string;
  studentName: string;
  prePercentage: number | null;
  postPercentage: number | null;
  growth: number | null;
}

interface QuestionAnalysisData {
  questionId: string;
  prompt: string;
  avgPreScore: number | null;
  avgPostScore: number | null;
  avgGrowth: number | null;
}

interface ClassAverages {
    avgPre: number | null;
    avgPost: number | null;
    avgGrowth: number | null;
}

const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// --- PDF Generator for Rapid Test (Class View) ---
export const generateRapidTestReport = (
    test: RapidTest,
    analysisData: AnalysisData[],
    questionAnalysisData: QuestionAnalysisData[],
    classAverages: ClassAverages
) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let finalY = 20;

    doc.setFontSize(18);
    doc.text(`Analysis for: ${test.name}`, 14, finalY);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report generated on: ${formatDate(new Date())}`, 14, finalY + 7);
    finalY += 20;

    doc.setFontSize(14);
    doc.text('Class Averages', 14, finalY);
    finalY += 6;
    autoTable(doc, {
        startY: finalY,
        head: [['Avg. Pre-Test', 'Avg. Post-Test', 'Avg. Growth']],
        body: [[
            classAverages.avgPre !== null ? `${classAverages.avgPre.toFixed(1)}%` : 'N/A',
            classAverages.avgPost !== null ? `${classAverages.avgPost.toFixed(1)}%` : 'N/A',
            classAverages.avgGrowth !== null ? `${classAverages.avgGrowth > 0 ? '+' : ''}${classAverages.avgGrowth.toFixed(1)}%` : 'N/A'
        ]],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
    });
    finalY = (doc as any).lastAutoTable.finalY + 15;

    if (finalY > pageHeight - 30) { doc.addPage(); finalY = 20; }
    doc.setFontSize(14);
    doc.text('Student Growth', 14, finalY);
    finalY += 6;
    autoTable(doc, {
        startY: finalY,
        head: [['Student', 'Pre-Test Score', 'Post-Test Score', 'Growth']],
        body: analysisData.map(d => [
            d.studentName,
            d.prePercentage !== null ? `${d.prePercentage.toFixed(1)}%` : 'Not Marked',
            d.postPercentage !== null ? `${d.postPercentage.toFixed(1)}%` : 'Not Marked',
            d.growth !== null ? `${d.growth > 0 ? '+' : ''}${d.growth.toFixed(1)}%` : 'N/A'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
    });
    finalY = (doc as any).lastAutoTable.finalY + 15;

    if (finalY > pageHeight - 30) { doc.addPage(); finalY = 20; }
    doc.setFontSize(14);
    doc.text('Question Breakdown (Class Average)', 14, finalY);
    finalY += 6;
    autoTable(doc, {
        startY: finalY,
        head: [['Question', 'Avg. Pre-Test', 'Avg. Post-Test', 'Avg. Growth']],
        body: questionAnalysisData.map((q, i) => [
            `Q${i + 1}: ${q.prompt}`,
            q.avgPreScore !== null ? `${q.avgPreScore.toFixed(1)}%` : 'N/A',
            q.avgPostScore !== null ? `${q.avgPostScore.toFixed(1)}%` : 'N/A',
            q.avgGrowth !== null ? `${q.avgGrowth > 0 ? '+' : ''}${q.avgGrowth.toFixed(1)}%` : 'N/A'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`analysis_${test.name.replace(/ /g, '_')}.pdf`);
};

// --- PDF Generator for Rapid Test (Individual Student View) ---
export const generateStudentReport = (
    test: RapidTest,
    student: Student,
    preResult: any,
    postResult: any,
    getScoreForRapidQuestion: Function
) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Detailed Report for: ${student.firstName} ${student.lastName}`, 14, 20);
    doc.setFontSize(14);
    doc.text(`Test: ${test.name}`, 14, 28);

    autoTable(doc, {
        startY: 40,
        head: [['Question', 'Pre-Test Answer', 'Pre-Test Score', 'Post-Test Answer', 'Post-Test Score']],
        body: test.questions.map(q => [
            q.prompt,
            preResult?.responses[q.id] ?? '-',
            preResult ? `${getScoreForRapidQuestion(q, preResult.responses[q.id])} / ${q.maxMarks}` : '-',
            postResult?.responses[q.id] ?? '-',
            postResult ? `${getScoreForRapidQuestion(q, postResult.responses[q.id])} / ${q.maxMarks}` : '-'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`student_report_${student.lastName}_${student.firstName}.pdf`);
};

// --- PDF Generator for Exam Analysis ---
export const generateExamAnalysisReport = async (isIndividual: boolean, reportTitle: string) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    let yPos = 15;
    const pageMargin = 15;
    const contentWidth = 210 - pageMargin * 2;

    doc.setFontSize(18);
    doc.text(reportTitle, pageMargin, yPos);
    yPos += 10;

    const chartIds = isIndividual
        ? ['indivModuleChart', 'indivContentChart', 'indivOutcomeChart', 'indivVerbChart']
        : ['classModuleChart', 'classContentChart', 'classOutcomeChart', 'classVerbChart', 'bandChart'];

    for (const chartId of chartIds) {
        const chartElement = document.getElementById(chartId);
        if (!chartElement) continue;

        const canvas = await html2canvas(chartElement, { scale: 2, backgroundColor: '#111827' });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        if (yPos + imgHeight > 297 - pageMargin) {
            doc.addPage();
            yPos = pageMargin;
        }

        doc.addImage(imgData, 'PNG', pageMargin, yPos, contentWidth, imgHeight);
        yPos += imgHeight + 10;
    }

    doc.save(`${reportTitle.replace(/ /g, '_')}_report.pdf`);
};