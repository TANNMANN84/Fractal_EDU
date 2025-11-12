// src/types/jspdf-autotable.d.ts

import { jsPDF } from 'jspdf';

declare module 'jspdf-autotable' {
  const autoTable: (doc: jsPDF, options: any) => void;
  export default autoTable;
}

