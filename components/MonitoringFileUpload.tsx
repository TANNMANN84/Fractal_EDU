import React from 'react';
import type { FileUpload } from '../types';
import { storageService } from '../services/storageService';


interface MonitoringFileUploadProps {
    file: FileUpload | null;
    onUpload: (file: FileUpload) => void;
    onRemove: () => void;
    label: string;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


const MonitoringFileUpload: React.FC<MonitoringFileUploadProps> = ({ file, onUpload, onRemove, label }) => {
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            try {
                const base64 = await fileToBase64(selectedFile);
                const newFileId = `file-${crypto.randomUUID()}`;
                await storageService.saveFileContent(newFileId, base64);
                onUpload({ id: newFileId, name: selectedFile.name });
            } catch (error) {
                console.error("Error saving file to DB", error);
                alert("Could not upload file. Please try again.");
            }
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            {file ? (
                <div className="flex items-center justify-between p-2 mt-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md w-full">
                    <button onClick={() => storageService.triggerDownload(file)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate" title={file.name}>
                        {file.name}
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-2 font-bold text-lg flex-shrink-0"
                        aria-label="Remove file"
                    >
                        &times;
                    </button>
                </div>
            ) : (
                <div className="mt-1">
                    <label className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded-md hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 font-semibold cursor-pointer transition-colors">
                        <span>Upload File</span>
                        <input type="file" className="hidden" onChange={handleFileChange} />
                    </label>
                </div>
            )}
        </div>
    );
};

export default MonitoringFileUpload;
