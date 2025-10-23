
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center justify-between transition-transform hover:scale-105">
      <div>
        <p className="text-sm font-medium text-medium uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
      </div>
      {icon && (
        <div className="bg-primary/10 p-3 rounded-full">
            {icon}
        </div>
      )}
    </div>
  );
};

export default StatCard;
