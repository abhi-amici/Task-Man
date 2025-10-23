import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const MicrosoftIcon: React.FC = () => (
    <svg width="21" height="21" viewBox="0 0 21 21" className="mr-2">
        <title>Microsoft</title>
        <path fill="#f25022" d="M1 1h9v9H1z"></path>
        <path fill="#00a4ef" d="M1 11h9v9H1z"></path>
        <path fill="#7fba00" d="M11 1h9v9h-9z"></path>
        <path fill="#ffb900" d="M11 11h9v9h-9z"></path>
    </svg>
);

const Login: React.FC = () => {
    const { login, loading, error } = useAuth();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-light dark:bg-dark p-4">
            <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 text-center">
                <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">amiciKart</h1>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Task Manager</h2>
                <p className="text-medium mb-8">
                    Please sign in with your Microsoft account to continue.
                </p>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}
                
                <button
                    onClick={login}
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {loading ? (
                       'Signing in...'
                    ) : (
                        <>
                            <MicrosoftIcon />
                            Sign in with Microsoft
                        </>
                    )}
                </button>

                <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
                    &copy; {new Date().getFullYear()} amiciKart Inc. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Login;
