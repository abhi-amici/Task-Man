import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

interface ProgressBarProps {
  progress: number;
  startDate: string;
  finishDate: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, startDate, finishDate }) => {
  const { t } = useLanguage();
  const start = new Date(startDate).getTime();
  const end = new Date(finishDate).getTime();
  const now = new Date().getTime();

  const totalDuration = end - start;
  const elapsedDuration = now - start;

  let timeProgress = 0;
  if (totalDuration > 0) {
    timeProgress = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
  } else if (now >= end) {
      timeProgress = 100;
  }
  
  const isBehindSchedule = progress < timeProgress && now < end;
  const progressColor = isBehindSchedule ? 'bg-red-500' : (progress === 100 ? 'bg-secondary' : 'bg-primary');

  return (
    <div>
        <div className="flex justify-between mb-1">
            <span className="text-xs font-medium text-primary dark:text-white">{t('taskDetails.progress')}</span>
            <span className="text-sm font-medium text-primary dark:text-white">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 relative">
            {/* Time progress bar */}
            <div className="bg-gray-300 dark:bg-gray-600 h-2.5 rounded-full" style={{ width: `${timeProgress}%` }}></div>
            {/* Actual progress bar */}
            <div className={`${progressColor} h-2.5 rounded-full absolute top-0`} style={{ width: `${progress}%` }}></div>
        </div>
    </div>
  );
};

export default ProgressBar;
