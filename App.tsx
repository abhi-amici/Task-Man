import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LanguageProvider } from './hooks/useLanguage';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import AdminPanel from './components/admin/AdminPanel';
import MyTasks from './components/tasks/MyTasks';
import TeamTasks from './components/tasks/TeamTasks';
import Login from './components/auth/Login';
import { Role } from './constants';

type View = 'dashboard' | 'mytasks' | 'teamtasks' | 'admin';

const AppContent: React.FC = () => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-light dark:bg-dark">
                <div className="text-2xl font-semibold text-dark dark:text-light">Loading amiciKart...</div>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    return <MainApp />;
};

const MainApp: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard />;
            case 'mytasks':
                return <MyTasks />;
            case 'teamtasks':
                return user && [Role.Manager, Role.Admin, Role.SuperAdmin].includes(user.role) ? <TeamTasks /> : <Dashboard />;
            case 'admin':
                return user && [Role.Admin, Role.SuperAdmin].includes(user.role) ? <AdminPanel /> : <Dashboard />;
            default:
                return <Dashboard />;
        }
    };
    
    return (
        <div className="h-screen flex overflow-hidden bg-light dark:bg-dark text-gray-800 dark:text-gray-200 font-sans">
            <Sidebar 
                currentView={view} 
                setView={setView}
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            {isSidebarOpen && (
                <div 
                    onClick={() => setSidebarOpen(false)} 
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    aria-hidden="true"
                />
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light dark:bg-dark p-4 sm:p-6 lg:p-8">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    return (
        <AuthProvider>
            <LanguageProvider>
                <AppContent />
            </LanguageProvider>
        </AuthProvider>
    );
};

export default App;