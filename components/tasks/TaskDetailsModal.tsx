import React, { useState, useEffect } from 'react';
import { Task, User, TaskStatus, TaskPriority, Remark } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Role } from '../../constants';
import ConfirmationModal from '../common/ConfirmationModal';
import { TrashIcon, TranslateIcon } from '../common/Icons';
import TranslatedText from '../common/TranslatedText';
import Avatar from '../common/Avatar';

interface TaskDetailsModalProps {
  task: Task;
  users: User[];
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, users, onClose, onUpdate }) => {
    const { user: currentUser } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const [currentTask, setCurrentTask] = useState<Task>(task);
    const [isDiscardConfirmOpen, setDiscardConfirmOpen] = useState(false);
    const [newRemark, setNewRemark] = useState('');

    useEffect(() => {
        setCurrentTask({ ...task, remarks: task.remarks || [] });
    }, [task]);
    
    if (!currentUser) return null;

    const assigner = users.find(u => u.id === currentTask.assignerId);
    const assignee = users.find(u => u.id === currentTask.assigneeId);
    
    const isAssigner = currentUser.id === currentTask.assignerId;
    const isAdmin = [Role.Admin, Role.SuperAdmin].includes(currentUser.role);
    const isManagerOfAssignee = currentUser.role === Role.Manager && assignee?.managerId === currentUser.id;
    const canEditAssignee = isAssigner || isAdmin || isManagerOfAssignee;
    const canDiscard = isAssigner;
    const isDiscarded = currentTask.status === TaskStatus.Discarded;

    const handleLanguageToggle = () => {
        setLanguage(language === 'en' ? 'hi' : 'en');
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newProgress = parseInt(e.target.value, 10);
        let newStatus = currentTask.status;
        if(newProgress === 100) newStatus = TaskStatus.Completed;
        else if(newProgress > 0) newStatus = TaskStatus.InProgress;
        else newStatus = TaskStatus.ToDo;

        setCurrentTask({ ...currentTask, progress: newProgress, status: newStatus });
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as TaskStatus;
        let newProgress = currentTask.progress;
        if(newStatus === TaskStatus.Completed) newProgress = 100;
        if(newStatus === TaskStatus.ToDo && currentTask.progress > 0) newProgress = 0;
        
        setCurrentTask({ ...currentTask, status: newStatus, progress: newProgress });
    }

    const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentTask({ ...currentTask, priority: e.target.value as TaskPriority });
    };

    const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentTask({ ...currentTask, assigneeId: e.target.value });
    };

    const handleAddRemark = () => {
        if (!newRemark.trim() || !currentUser) return;

        const remarkToAdd: Remark = {
            userId: currentUser.id,
            text: newRemark.trim(),
            timestamp: new Date().toISOString(),
        };

        setCurrentTask(prevTask => ({
            ...prevTask,
            remarks: [...(prevTask.remarks || []), remarkToAdd],
        }));

        setNewRemark('');
    };

    const handleSaveChanges = async () => {
        const updated = await api.updateTask(currentTask);
        onUpdate(updated);
        onClose();
    }

    const handleDiscardClick = () => {
        setDiscardConfirmOpen(true);
    };

    const handleConfirmDiscard = async () => {
        const discardedTask = { ...currentTask, status: TaskStatus.Discarded };
        const updated = await api.updateTask(discardedTask);
        onUpdate(updated);
        setDiscardConfirmOpen(false);
        onClose();
    };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 flex justify-between items-start gap-4">
            <h2 className={`text-2xl font-bold text-gray-900 dark:text-white ${isDiscarded ? 'line-through' : ''}`}>
                <TranslatedText>{currentTask.title}</TranslatedText>
            </h2>
            <div className="flex items-center space-x-3 shrink-0">
                <button
                    onClick={handleLanguageToggle}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors"
                    aria-label="Toggle language"
                >
                    <TranslateIcon className="w-5 h-5" />
                    <span>{language === 'en' ? t('taskDetails.viewInHindi') : t('taskDetails.viewInEnglish')}</span>
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close modal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
        <fieldset disabled={isDiscarded} className="p-6 space-y-6">
            <div>
                <label className="text-sm font-medium text-medium">{t('taskDetails.description')}</label>
                <p className="mt-1 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md whitespace-pre-wrap"><TranslatedText>{currentTask.description}</TranslatedText></p>
            </div>

            <div>
                <label className="text-sm font-medium text-medium">{t('taskDetails.runningRemarks')}</label>
                <div className="mt-2 space-y-4 max-h-48 overflow-y-auto pr-2 border-b dark:border-gray-700 pb-4">
                    {(currentTask.remarks && currentTask.remarks.length > 0) ? currentTask.remarks.map((remark, index) => {
                        const remarkUser = users.find(u => u.id === remark.userId);
                        return (
                            <div key={index} className="flex items-start space-x-3">
                                <Avatar src={remarkUser?.avatarUrl || ''} alt={remarkUser?.name || 'User'} size="sm" />
                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{remarkUser?.name.split(' ')[0]}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(remark.timestamp).toLocaleString()}</p>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{remark.text}</p>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="text-sm text-gray-400 italic">No remarks yet.</p>
                    )}
                </div>
                <div className="mt-4 flex items-start space-x-3">
                    <Avatar src={currentUser.avatarUrl} alt={currentUser.name} size="sm" />
                    <div className="flex-1">
                        <textarea
                            value={newRemark}
                            onChange={(e) => setNewRemark(e.target.value)}
                            placeholder="Add a remark..."
                            rows={2}
                            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary text-sm disabled:opacity-70"
                        />
                        <button
                            onClick={handleAddRemark}
                            disabled={!newRemark.trim()}
                            className="mt-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {t('taskDetails.addRemark')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-sm font-medium text-medium">{t('taskDetails.assigner')}</label>
                    <p className="mt-1 font-semibold">{assigner?.name}</p>
                </div>
                 <div>
                    <label htmlFor="assignee" className="text-sm font-medium text-medium">{t('taskDetails.assignee')}</label>
                     {canEditAssignee ? (
                        <select
                            id="assignee"
                            value={currentTask.assigneeId}
                            onChange={handleAssigneeChange}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary disabled:opacity-70"
                        >
                            {users.map(u => <option key={u.id} value={u.id}>{u.name.split(' (')[0]}</option>)}
                        </select>
                    ) : (
                        <p className="mt-1 font-semibold">{assignee?.name}</p>
                    )}
                </div>
                 <div>
                    <label className="text-sm font-medium text-medium">{t('taskDetails.startDate')}</label>
                    <p className="mt-1 font-semibold">{new Date(currentTask.startDate).toLocaleDateString()}</p>
                </div>
                 <div>
                    <label className="text-sm font-medium text-medium">{t('taskDetails.finishDate')}</label>
                    <p className="mt-1 font-semibold">{new Date(currentTask.finishDate).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                 <div>
                    <label htmlFor="status" className="text-sm font-medium text-medium block mb-1">{t('taskDetails.status')}</label>
                    <select id="status" value={currentTask.status} onChange={handleStatusChange} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 disabled:opacity-70">
                        {Object.values(TaskStatus).filter(s => s !== TaskStatus.Discarded).map(s => <option key={s} value={s}>{t(`taskStatus.${s}`)}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="priority" className="text-sm font-medium text-medium block mb-1">{t('taskDetails.priority')}</label>
                    <select id="priority" value={currentTask.priority} onChange={handlePriorityChange} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 disabled:opacity-70">
                        {Object.values(TaskPriority).map(p => <option key={p} value={p}>{t(`taskPriority.${p}`)}</option>)}
                    </select>
                </div>
            </div>
             <div>
                 <label htmlFor="progress" className="text-sm font-medium text-medium block mb-1">{t('taskDetails.progress')}: {currentTask.progress}%</label>
                 <input type="range" id="progress" min="0" max="100" value={currentTask.progress} onChange={handleProgressChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-70" />
            </div>
        </fieldset>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center sticky bottom-0 bg-white dark:bg-gray-800 z-10">
            <div>
                {canDiscard && !isDiscarded && (
                    <button onClick={handleDiscardClick} className="flex items-center space-x-2 px-4 py-2 rounded-md bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 font-semibold text-sm">
                        <TrashIcon className="w-4 h-4" />
                        <span>{t('taskDetails.discardTask')}</span>
                    </button>
                )}
            </div>
            <div className="flex space-x-3">
                <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">{t('taskDetails.cancel')}</button>
                {!isDiscarded && (
                     <button onClick={handleSaveChanges} className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 font-semibold">{t('taskDetails.saveChanges')}</button>
                )}
            </div>
        </div>
      </div>
    </div>
    <ConfirmationModal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setDiscardConfirmOpen(false)}
        onConfirm={handleConfirmDiscard}
        title={t('confirmation.discardTitle')}
        message={t('confirmation.discardMessage')}
        confirmText={t('confirmation.discardConfirm')}
    />
    </>
  );
};

export default TaskDetailsModal;