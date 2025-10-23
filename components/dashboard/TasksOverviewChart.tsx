import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Task, TaskStatus } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';

interface TasksOverviewChartProps {
  tasks: Task[];
}

const TasksOverviewChart: React.FC<TasksOverviewChartProps> = ({ tasks }) => {
  const { t } = useLanguage();
  
  const data = useMemo(() => {
    const statusCounts = {
      [TaskStatus.ToDo]: 0,
      [TaskStatus.InProgress]: 0,
      [TaskStatus.Completed]: 0,
    };
    tasks.forEach(task => {
      statusCounts[task.status]++;
    });
    return [
      { name: t('taskStatus.To Do'), count: statusCounts[TaskStatus.ToDo] },
      { name: t('taskStatus.In Progress'), count: statusCounts[TaskStatus.InProgress] },
      { name: t('taskStatus.Completed'), count: statusCounts[TaskStatus.Completed] },
    ];
  }, [tasks, t]);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
          <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
          <YAxis allowDecimals={false} tick={{ fill: '#6b7280' }} />
          <Tooltip
             cursor={{fill: 'rgba(79, 70, 229, 0.1)'}}
             contentStyle={{
                 backgroundColor: '#1f2937',
                 borderColor: '#374151',
                 borderRadius: '0.5rem'
             }}
          />
          <Legend />
          <Bar dataKey="count" fill="#4f46e5" barSize={40} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TasksOverviewChart;
