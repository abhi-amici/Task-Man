import React, { useState } from 'react';
import { User, TaskStatus, TaskPriority } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

interface CreateTaskModalProps {
  users: User[];
  onClose: () => void;
  onCreate: () => void; // Callback to refresh data
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ users, onClose, onCreate }) => {
    const { user: currentUser } = useAuth();
    const { t, language, translateDynamic } = useLanguage();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState<string | undefined>(currentUser?.id);
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [finishDate, setFinishDate] = useState('');
    const [error, setError] = useState('');

    const [preview, setPreview] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const handlePreview = async () => {
        if (!description) return;
        setIsPreviewLoading(true);
        setPreview('');
        const translated = await translateDynamic(description);
        setPreview(translated);
        setIsPreviewLoading(false);
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !assigneeId || !startDate || !finishDate || !currentUser) {
            setError(t('createTask.fillAllFields'));
            return;
        }
        if (new Date(startDate) > new Date(finishDate)) {
            setError(t('createTask.dateError'));
            return;
        }

        setError('');

        try {
            await api.createTask({
                title,
                description,
                assignerId: currentUser.id,
                assigneeId,
                projectId: '3', // In a real app, this might be a selector
                status: TaskStatus.ToDo,
                priority,
                progress: 0,
                startDate,
                finishDate,
            });
            onCreate();
        } catch (err) {
            setError(t('createTask.createError'));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="create-task-title">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 relative">
                        <h2 id="create-task-title" className="text-2xl font-bold text-gray-900 dark:text-white">{t('createTask.title')}</h2>
                         <button type="button" onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                           </svg>
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm" role="alert">{error}</div>}
                        <div>
                            <label htmlFor="title" className="text-sm font-medium text-medium block mb-1">{t('createTask.taskTitle')}</label>
                            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary" required />
                        </div>
                         <div>
                            <label htmlFor="description" className="text-sm font-medium text-medium block mb-1">{t('createTask.description')}</label>
                            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary" required></textarea>
                             {language !== 'en' && description && (
                                <div className="mt-2 text-right">
                                    <button type="button" onClick={handlePreview} className="text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline" disabled={isPreviewLoading}>
                                        {isPreviewLoading ? 'Translating...' : `Preview in ${language === 'hi' ? 'Hindi' : ''}`}
                                    </button>
                                     {preview && !isPreviewLoading && (
                                        <div className="mt-2 p-3 border border-gray-200 dark:border-gray-600 border-dashed rounded-md text-sm text-medium text-left bg-gray-50 dark:bg-gray-700/50">
                                            {preview}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="assignee" className="text-sm font-medium text-medium block mb-1">{t('createTask.assignTo')}</label>
                                <select id="assignee" value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary" required>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name.split(' (')[0]}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="priority" className="text-sm font-medium text-medium block mb-1">{t('createTask.priority')}</label>
                                <select id="priority" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary" required>
                                    {Object.values(TaskPriority).map(p => <option key={p} value={p}>{t(`taskPriority.${p}`)}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startDate" className="text-sm font-medium text-medium block mb-1">{t('createTask.startDate')}</label>
                                <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary" required />
                            </div>
                            <div>
                                <label htmlFor="finishDate" className="text-sm font-medium text-medium block mb-1">{t('createTask.finishDate')}</label>
                                <input type="date" id="finishDate" value={finishDate} min={startDate} onChange={e => setFinishDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary" required />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">{t('taskDetails.cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 font-semibold">{t('createTask.createTaskBtn')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;