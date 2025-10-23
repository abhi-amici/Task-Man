import React from 'react';
import { Task, User, TaskStatus, TaskPriority } from '../../types';
import Avatar from '../common/Avatar';
import ProgressBar from './ProgressBar';
import TranslatedText from '../common/TranslatedText';
import { useLanguage } from '../../hooks/useLanguage';

interface TaskCardProps {
  task: Task;
  assignee?: User;
  assigner?: User;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, assignee, assigner, onClick }) => {
  const { title, finishDate, progress, status, priority } = task;
  const { t } = useLanguage();

  const getStatusChip = (status: TaskStatus) => {
    const statusText = t(`taskStatus.${status}`);
    switch(status) {
        case TaskStatus.ToDo:
            return <div className="text-xs font-medium text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/50 px-2 py-1 rounded-full">{statusText}</div>;
        case TaskStatus.InProgress:
            return <div className="text-xs font-medium text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/50 px-2 py-1 rounded-full">{statusText}</div>;
        case TaskStatus.Completed:
            return <div className="text-xs font-medium text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900/50 px-2 py-1 rounded-full">{statusText}</div>;
        case TaskStatus.Discarded:
            return <div className="text-xs font-medium text-gray-800 bg-gray-200 dark:text-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">{statusText}</div>;
    }
  }
  
  const getPriorityIndicator = (priority: TaskPriority) => {
    const styles = {
      [TaskPriority.High]: { bg: 'bg-red-500', text: 'text-red-700 dark:text-red-300' },
      [TaskPriority.Medium]: { bg: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-300' },
      [TaskPriority.Low]: { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
    };
    return (
        <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${styles[priority].bg}`}></span>
            <span className={`text-xs font-semibold ${styles[priority].text}`}>{t(`taskPriority.${priority}`)}</span>
        </div>
    );
  };

  const daysLeft = Math.ceil((new Date(finishDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  const isDiscarded = status === TaskStatus.Discarded;

  return (
    <div onClick={onClick} className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${isDiscarded ? 'opacity-60' : ''}`}>
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className={`font-bold text-md text-gray-800 dark:text-white pr-4 ${isDiscarded ? 'line-through' : ''}`}><TranslatedText>{title}</TranslatedText></h3>
          {getStatusChip(status)}
        </div>
        
        <div className="flex items-center justify-between text-sm text-medium mb-4">
            <div>
                {t('taskCard.dueIn')} <span className={`font-semibold ${daysLeft < 3 && !isDiscarded ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>{daysLeft > 0 ? `${daysLeft} ${t('taskCard.days')}` : t('dashboard.overdue')}</span>
            </div>
            {getPriorityIndicator(priority)}
        </div>
      </div>
      
      <div>
        <ProgressBar progress={progress} startDate={task.startDate} finishDate={task.finishDate} />

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center space-x-2">
            {assignee && <Avatar src={assignee.avatarUrl} alt={assignee.name} size="sm" />}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{assignee?.name.split(' ')[0]}</span>
          </div>
          <div className="text-right">
              <span className="text-xs text-medium">{t('taskCard.by')} {assigner?.name.split(' ')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;