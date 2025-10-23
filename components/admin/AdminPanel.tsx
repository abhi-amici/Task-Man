import React from 'react';
import UserManagementTable from './UserManagementTable';
import { useLanguage } from '../../hooks/useLanguage';

const AdminPanel: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('adminPanel.title')}</h1>
                <p className="text-medium mt-1">{t('adminPanel.description')}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                 <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">{t('adminPanel.userManagement')}</h2>
                 <UserManagementTable />
            </div>
        </div>
    );
};

export default AdminPanel;