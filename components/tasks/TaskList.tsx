import React, { useState, useEffect } from 'react';
import { Task, User } from '../../types';
import TaskCard from './TaskCard';
import TaskDetailsModal from './TaskDetailsModal';

interface TaskListProps {
  tasks: Task[];
  users: User[];
  onTaskUpdate?: (updatedTask: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, users, onTaskUpdate }) => {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // This effect ensures that if the parent's task list is updated (e.g., after a fetch),
    // the 'selectedTask' state (which controls the modal) is also updated to the new object reference.
    // This prevents the modal from holding onto stale data and is key to ensuring translations work on fresh data.
    useEffect(() => {
        if (selectedTask) {
            const refreshedTask = tasks.find(t => t.id === selectedTask.id);
            if (refreshedTask) {
                // Update to the new object from the props to maintain a single source of truth.
                setSelectedTask(refreshedTask);
            } else {
                // The task was likely deleted from the list, so we should close the modal.
                setSelectedTask(null);
            }
        }
    }, [tasks]);


    const handleCardClick = (task: Task) => {
        setSelectedTask(task);
    }

    const handleCloseModal = () => {
        setSelectedTask(null);
    }
    
    const handleUpdate = (updatedTask: Task) => {
        // First, optimistically update the state for a snappy UI response in the modal.
        setSelectedTask(updatedTask);
        // Then, trigger the parent component to refetch the master list of tasks,
        // which will flow back down and be synced by the useEffect above.
        if(onTaskUpdate) {
            onTaskUpdate(updatedTask);
        }
    }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            assignee={users.find(u => u.id === task.assigneeId)} 
            assigner={users.find(u => u.id === task.assignerId)}
            onClick={() => handleCardClick(task)}
          />
        ))}
      </div>
      {selectedTask && (
        <TaskDetailsModal
            task={selectedTask}
            users={users}
            onClose={handleCloseModal}
            onUpdate={handleUpdate}
        />
      )}
    </>
  );
};

export default TaskList;