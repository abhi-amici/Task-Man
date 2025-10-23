import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import Avatar from '../common/Avatar';
import { ChevronDownIcon, LiveTranslateIcon, MenuIcon } from '../common/Icons';
import { Language } from '../../types';
import LiveTranslationModal from '../common/LiveTranslationModal';

const GlobeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.5l.053-.053A2 2 0 018.828 4h6.344a2 2 0 011.414.586l.053.053M12 20.25a.75.75 0 01.75-.75h.008a.75.75 0 010 1.5h-.008a.75.75 0 01-.75-.75zM12 11a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
);

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const [isLiveTranslateOpen, setLiveTranslateOpen] = useState(false);
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const langDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setUserDropdownOpen(false);
            }
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
                setLangDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    const handleLanguageSwitch = (lang: Language) => {
        setLanguage(lang);
        setLangDropdownOpen(false);
    }

    return (
        <>
            <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-2 md:p-4 h-16">
                    <div className="flex items-center">
                        <button 
                            onClick={onMenuClick}
                            className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Open sidebar"
                        >
                            <MenuIcon className="h-6 w-6" />
                        </button>
                        <div className="md:hidden text-xl font-bold text-primary tracking-tight ml-2">
                            amiciKart
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 md:space-x-4">
                        {/* Live Translation */}
                         <button 
                            onClick={() => setLiveTranslateOpen(true)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Live translate"
                        >
                            <LiveTranslateIcon className="h-6 w-6 text-medium"/>
                        </button>

                        {/* Language Switcher */}
                        <div className="relative" ref={langDropdownRef}>
                            <button 
                                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Change language"
                            >
                                <GlobeIcon className="h-6 w-6 text-medium"/>
                            </button>
                            {langDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <button onClick={() => handleLanguageSwitch('en')} className={`w-full text-left px-4 py-2 text-sm transition-colors ${language === 'en' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{t('header.english')}</button>
                                    <button onClick={() => handleLanguageSwitch('hi')} className={`w-full text-left px-4 py-2 text-sm transition-colors ${language === 'hi' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{t('header.hindi')}</button>
                                </div>
                            )}
                        </div>

                        {/* User Profile Dropdown */}
                        <div className="relative" ref={userDropdownRef}>
                            <button
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Avatar src={user.avatarUrl} alt={user.name} size="md" />
                                <div className="text-left hidden md:block">
                                    <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">{user.name.split('(')[0].trim()}</div>
                                    <div className="text-xs text-medium">{user.role}</div>
                                </div>
                                <ChevronDownIcon className="w-5 h-5 text-medium" />
                            </button>

                            {userDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                        <p className="font-bold text-gray-800 dark:text-white">{user.name.split('(')[0].trim()}</p>

                                        <p className="text-sm text-medium">{user.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={logout}
                                            className="w-full text-left flex items-center p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <LiveTranslationModal isOpen={isLiveTranslateOpen} onClose={() => setLiveTranslateOpen(false)} />
        </>
    );
};

export default Header;