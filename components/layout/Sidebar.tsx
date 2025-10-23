import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Role } from '../../constants';
import { DashboardIcon, TasksIcon, TeamIcon, AdminIcon } from '../common/Icons';

interface SidebarProps {
  currentView: string;
  setView: (view: 'dashboard' | 'mytasks' | 'teamtasks' | 'admin') => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors rounded-lg
        ${
          isActive
            ? 'bg-primary text-white'
            : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
    >
      {icon}
      <span className="ml-4">{label}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isSidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleNavigation = (view: 'dashboard' | 'mytasks' | 'teamtasks' | 'admin') => {
    setView(view);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-primary tracking-tight">amiciKart</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2" aria-label="Main navigation">
        <NavLink
          icon={<DashboardIcon className="h-6 w-6" />}
          label={t('sidebar.dashboard')}
          isActive={currentView === 'dashboard'}
          onClick={() => handleNavigation('dashboard')}
        />
        <NavLink
          icon={<TasksIcon className="h-6 w-6" />}
          label={t('sidebar.myTasks')}
          isActive={currentView === 'mytasks'}
          onClick={() => handleNavigation('mytasks')}
        />
        {user && [Role.Manager, Role.Admin, Role.SuperAdmin].includes(user.role) && (
          <NavLink
            icon={<TeamIcon className="h-6 w-6" />}
            label={t('sidebar.teamTasks')}
            isActive={currentView === 'teamtasks'}
            onClick={() => handleNavigation('teamtasks')}
          />
        )}
        {user && [Role.Admin, Role.SuperAdmin].includes(user.role) && (
          <NavLink
            icon={<AdminIcon className="h-6 w-6" />}
            label={t('sidebar.adminPanel')}
            isActive={currentView === 'admin'}
            onClick={() => handleNavigation('admin')}
          />
        )}
      </nav>
      <div className="p-4 mt-auto">
        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} amiciKart Inc.
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;