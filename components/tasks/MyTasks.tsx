import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { api } from '../../services/api';
import { Task, User, TaskStatus } from '../../types';
import TaskList from './TaskList';
import CreateTaskModal from './CreateTaskModal';

const MyTasks: React.FC = () => {
    const { user, users } = useAuth();
    const { t } = useLanguage();
    const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
    const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [assigned, created] = await Promise.all([
                api.getTasksForUser(user.id),
                api.getTasksCreatedByUser(user.id),
            ]);
            setAssignedTasks(assigned);
            setCreatedTasks(created);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
      fetchData();
       // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleTaskUpdate = () => {
        // Refetch all data to ensure consistency
        fetchData();
    };
    
    const handleTaskCreate = () => {
        fetchData();
        setCreateModalOpen(false);
    };

    if (loading) {
        return <div className="text-center p-8">Loading tasks...</div>;
    }

    // Tasks assigned to the current user by someone else (excluding discarded).
    const assignedToMeTasks = assignedTasks.filter(t => t.assignerId !== user?.id && t.status !== TaskStatus.Discarded);
    
    // Tasks created by the current user for themselves (excluding discarded).
    const myPersonalTasks = createdTasks.filter(task => task.assigneeId === user?.id && task.status !== TaskStatus.Discarded);

    // Delegated tasks are tasks created by the user for someone else (including discarded for history).
    const delegatedTasks = createdTasks.filter(task => task.assigneeId !== user?.id);

    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('myTasks.title')}</h1>
                        <p className="text-medium mt-1">{t('myTasks.description')}</p>
                    </div>
                    <button 
                        onClick={() => setCreateModalOpen(true)}
                        className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 font-semibold transition-colors flex items-center space-x-2"
                        aria-label="Create new task"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        <span>{t('myTasks.createTask')}</span>
                    </button>
                </div>
                
                <section>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">{t('myTasks.assignedToMe')}</h2>
                    {assignedToMeTasks.length > 0 ? (
                        <TaskList tasks={assignedToMeTasks} users={users} onTaskUpdate={handleTaskUpdate}/>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <p className="text-medium font-semibold">{t('myTasks.emptyList')}</p>
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">{t('myTasks.myPersonalTasks')}</h2>
                    {myPersonalTasks.length > 0 ? (
                        <TaskList tasks={myPersonalTasks} users={users} onTaskUpdate={handleTaskUpdate}/>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <p className="text-medium font-semibold">{t('myTasks.noPersonalTasks')}</p>
                            <p className="text-sm text-gray-500 mt-1">{t('myTasks.getStarted')}</p>
                        </div>
                    )}
                </section>
                
                <section>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">{t('myTasks.delegatedByMe')}</h2>
                    {delegatedTasks.length > 0 ? (
                        <TaskList tasks={delegatedTasks} users={users} onTaskUpdate={handleTaskUpdate} />
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <p className="text-medium font-semibold">{t('myTasks.notDelegated')}</p>
                        </div>
                    )}
                </section>
            </div>
            {isCreateModalOpen && (
                <CreateTaskModal 
                    users={users} 
                    onClose={() => setCreateModalOpen(false)}
                    onCreate={handleTaskCreate}
                />
            )}
        </>
    );
};

export default MyTasks;