import React from 'react';
import type { EvidenceLogEntry } from '../types';
import { storageService } from '../services/storageService';

export const EvidenceLogList: React.FC<{ logs: EvidenceLogEntry[], title: string }> = ({ logs, title }) => {
    if (logs.length === 0) {
        return null;
    }

    return (
        <div className="mt-6">
            <h4 className="font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                    <div key={log.logId} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                             <p className="text-xs text-gray-500">
                                {new Date(log.date).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <div className="flex flex-col items-end text-sm gap-1">
                                {log.evidenceLink && <a href={log.evidenceLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">View Link</a>}
                                {log.evidenceFile && <button onClick={() => storageService.triggerDownload(log.evidenceFile!)} className="text-blue-600 hover:underline font-semibold">Download File</button>}
                            </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{log.note}</p>
                        {log.adjustments_used && log.adjustments_used.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                                <p className="text-xs font-semibold text-gray-600">Adjustments:</p>
                                <ul className="list-disc list-inside text-xs text-gray-600">
                                    {log.adjustments_used.map(adj => <li key={adj}>{adj}</li>)}
                                </ul>
                            </div>
                        )}
                         {log.tags?.includes('NCCD') && log.adjustment_level && (
                            <p className="text-xs font-semibold text-gray-600 mt-2">Level: {log.adjustment_level}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};