import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { api } from '../../services/api';
import { Task, User, TaskStatus } from '../../types';
import { Role } from '../../constants';
import TaskList from './TaskList';
import CreateTaskModal from './CreateTaskModal';

const TeamTasks: React.FC = () => {
    const { user, users } = useAuth();
    const { t } = useLanguage();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    
    const fetchData = async () => {
        if (!user || ![Role.Manager, Role.Admin, Role.SuperAdmin].includes(user.role)) return;
        setLoading(true);
        try {
            const fetchedTasks = user.role === Role.Manager ? await api.getTeamTasks(user.id) : await api.getAllTasks();
            setTasks(fetchedTasks);
        } catch (error) {
            console.error("Failed to fetch team tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const teamMembers = useMemo(() => {
        if (!user) return [];
        if ([Role.Admin, Role.SuperAdmin].includes(user.role)) return users;
        return users.filter(u => u.managerId === user.id || u.id === user.id);
    }, [user, users]);

    const filteredTasks = useMemo(() => {
        let memberFilteredTasks = tasks;
        if (selectedMember !== 'all') {
            memberFilteredTasks = tasks.filter(task => task.assigneeId === selectedMember);
        }

        if (selectedStatus === 'all') {
            return memberFilteredTasks;
        }

        return memberFilteredTasks.filter(task => task.status === selectedStatus);
    }, [tasks, selectedMember, selectedStatus]);
    
    const handleTaskUpdate = () => {
        fetchData();
    };

    const handleTaskCreate = () => {
        fetchData();
        setCreateModalOpen(false);
    };

    if (loading) {
        return <div className="text-center p-8">Loading team tasks...</div>;
    }
    
    if (!user || ![Role.Manager, Role.Admin, Role.SuperAdmin].includes(user.role)) {
        return <div className="text-center p-8 text-red-500">Access Denied.</div>;
    }

    const statusFilters: (TaskStatus | 'all')[] = ['all', TaskStatus.ToDo, TaskStatus.InProgress, TaskStatus.Completed, TaskStatus.Discarded];

    return (
        <>
            <div className="space-y-8">
                 <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('teamTasks.title')}</h1>
                        <p className="text-medium mt-1">{t('teamTasks.description')}</p>
                    </div>
                    <button 
                        onClick={() => setCreateModalOpen(true)}
                        className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 font-semibold transition-colors flex items-center space-x-2"
                        aria-label="Delegate a new task"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        <span>{t('teamTasks.delegateTask')}</span>
                    </button>
                </div>
                
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-start gap-6">
                    <div className="flex items-center space-x-3">
                        <label htmlFor="team-member-filter" className="font-medium text-sm text-gray-700 dark:text-gray-300 shrink-0">{t('teamTasks.teamMember')}</label>
                        <select 
                            id="team-member-filter"
                            value={selectedMember}
                            onChange={(e) => setSelectedMember(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-primary text-sm min-w-[150px]"
                        >
                            <option value="all">{t('teamTasks.allMembers')}</option>
                            {teamMembers.map(member => (
                                <option key={member.id} value={member.id}>{member.name.split(' (')[0]}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium shrink-0 text-sm text-gray-700 dark:text-gray-300">{t('teamTasks.status')}</span>
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            {statusFilters.map((status) => {
                                const isActive = selectedStatus === status;
                                const label = status === 'all' ? t('teamTasks.all') : t(`taskStatus.${status}`);
                                return (
                                    <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                                        isActive
                                        ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                                    }`}
                                    >
                                    {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {filteredTasks.length > 0 ? (
                    <TaskList tasks={filteredTasks} users={users} onTaskUpdate={handleTaskUpdate}/>
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <p className="text-medium font-semibold">{t('teamTasks.noTasksMatch')}</p>
                        <p className="text-sm text-gray-500 mt-1">{t('teamTasks.tryDifferentFilters')}</p>
                    </div>
                )}
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

export default TeamTasks;