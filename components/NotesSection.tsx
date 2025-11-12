
import React, { useState } from 'react';
import type { NoteEntry } from '../types';

interface NotesSectionProps {
    notes: NoteEntry[];
    onAddNote: (content: string) => void;
    title: string;
}

const NotesSection: React.FC<NotesSectionProps> = ({ notes, onAddNote, title }) => {
    const [newNote, setNewNote] = useState('');

    const handleAddClick = () => {
        if (newNote.trim()) {
            onAddNote(newNote.trim());
            setNewNote('');
        }
    };

    return (
        <div className="mt-6">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2 mb-4">{title}</h4>
            <div className="space-y-4">
                <div>
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        placeholder="Type your note here..."
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={handleAddClick}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-indigo-300 dark:disabled:bg-indigo-800"
                            disabled={!newNote.trim()}
                        >
                            Add Note
                        </button>
                    </div>
                </div>

                {notes && notes.length > 0 && (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 bg-gray-100 dark:bg-gray-800/50 p-2 rounded-lg border dark:border-gray-700">
                        {notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(note => (
                            <div key={note.id} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
                                <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    - {note.author} on {new Date(note.date).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesSection;