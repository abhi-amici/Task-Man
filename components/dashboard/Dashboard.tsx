import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { api } from '../../services/api';
import { Task, User, TaskStatus } from '../../types';
import { Role } from '../../constants';
import StatCard from './StatCard';
import TasksOverviewChart from './TasksOverviewChart';
import TaskList from '../tasks/TaskList';
import { CheckCircleIcon, ClockIcon } from '../common/Icons';
import TranslatedText from '../common/TranslatedText';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                let fetchedTasks: Task[];
                if (user.role === Role.Admin || user.role === Role.SuperAdmin) {
                    fetchedTasks = await api.getAllTasks();
                } else if (user.role === Role.Manager) {
                    const teamTasks = await api.getTeamTasks(user.id);
                    const myTasks = await api.getTasksForUser(user.id);
                    const taskIds = new Set(myTasks.map(t => t.id));
                    fetchedTasks = [...myTasks, ...teamTasks.filter(t => !taskIds.has(t.id))];
                } else {
                    fetchedTasks = await api.getTasksForUser(user.id);
                }
                setTasks(fetchedTasks);
                const allUsers = await api.getUsers();
                setUsers(allUsers);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading || !user) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    const tasksInProgress = tasks.filter(t => t.status === TaskStatus.InProgress).length;
    const tasksCompleted = tasks.filter(t => t.status === TaskStatus.Completed).length;
    const tasksToDo = tasks.filter(t => t.status === TaskStatus.ToDo).length;
    const isManagerOrAdmin = [Role.Manager, Role.Admin, Role.SuperAdmin].includes(user.role);

    const title = isManagerOrAdmin ? t('dashboard.teamOverview') : t('dashboard.myDashboard');
    const recentTasks = tasks.filter(t => t.status !== TaskStatus.Completed).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 5);


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('dashboard.welcome')}, {user.name.split(' ')[0]}!</h1>
                <p className="text-medium mt-1">{t('dashboard.summary')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('dashboard.totalTasks')} value={tasks.length.toString()} />
                <StatCard title={t('dashboard.toDo')} value={tasksToDo.toString()} icon={<ClockIcon className="w-8 h-8 text-yellow-500" />} />
                <StatCard title={t('dashboard.inProgress')} value={tasksInProgress.toString()} icon={<div className="w-8 h-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>} />
                <StatCard title={t('dashboard.completed')} value={tasksCompleted.toString()} icon={<CheckCircleIcon className="w-8 h-8 text-green-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                     <h2 className="text-xl font-semibold mb-4">{title}</h2>
                     <TasksOverviewChart tasks={tasks} />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4">{t('dashboard.upcomingDeadlines')}</h2>
                    <div className="space-y-4">
                       {tasks
                        .filter(t => t.status !== TaskStatus.Completed)
                        .sort((a,b) => new Date(a.finishDate).getTime() - new Date(b.finishDate).getTime())
                        .slice(0, 4)
                        .map(task => {
                            const assignee = users.find(u => u.id === task.assigneeId);
                            const daysLeft = Math.ceil((new Date(task.finishDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                            return (
                                <div key={task.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm"><TranslatedText>{task.title}</TranslatedText></p>
                                        <p className="text-xs text-medium">{t('dashboard.assignedTo')} {assignee?.name.split(" ")[0]}</p>
                                    </div>
                                    <div className={`text-sm font-semibold px-2 py-1 rounded-md ${daysLeft <=3 ? 'text-red-700 bg-red-100' : 'text-yellow-700 bg-yellow-100'}`}>
                                        {daysLeft > 0 ? `${daysLeft}${t('dashboard.daysLeft')}` : t('dashboard.overdue')}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            
             <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('dashboard.recentlyActive')}</h2>
                <TaskList tasks={recentTasks} users={users} />
            </div>

        </div>
    );
};

export default Dashboard;