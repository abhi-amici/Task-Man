
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Role } from '../../constants';
import { User } from '../../types';
import { api } from '../../services/api';
import Avatar from '../common/Avatar';

const UserManagementTable: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { t } = useLanguage();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const users = await api.getUsers();
                setAllUsers(users);
            } catch (error) {
                console.error("Failed to fetch users for admin panel:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const isSuperAdmin = currentUser?.role === Role.SuperAdmin;
    const isAdmin = currentUser?.role === Role.Admin;

    const handleRoleChange = async (userId: string, newRole: Role) => {
        const userToUpdate = allUsers.find(u => u.id === userId);
        if (userToUpdate) {
            const updatedUser = { ...userToUpdate, role: newRole };
            await api.updateUser(updatedUser);
            setAllUsers(allUsers.map(u => u.id === userId ? updatedUser : u));
        }
    };

    const handleManagerChange = async (userId: string, newManagerId: string) => {
        const userToUpdate = allUsers.find(u => u.id === userId);
        if (userToUpdate) {
            const updatedUser = { ...userToUpdate, managerId: newManagerId || undefined };
            await api.updateUser(updatedUser);
            setAllUsers(allUsers.map(u => u.id === userId ? updatedUser : u));
        }
    };

    const managers = allUsers.filter(u => u.role === Role.Manager || u.role === Role.Admin || u.role === Role.SuperAdmin);

    if (loading) {
        return <p>Loading users...</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminPanel.name')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminPanel.role')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminPanel.manager')}</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {allUsers.map((user) => {
                        // A user's role can be edited if:
                        // 1. The current user is a Super Admin, and it's not their own profile.
                        // 2. The current user is an Admin, it's not their own profile, and the target user is not another Admin or a Super Admin.
                        const canEditRole = (isSuperAdmin && user.id !== currentUser?.id) ||
                            (isAdmin && user.id !== currentUser?.id && ![Role.SuperAdmin, Role.Admin].includes(user.role));

                        // Admins and Super Admins can set managers for Employees.
                        const canEditManager = (isSuperAdmin || isAdmin) && user.role === Role.Employee;

                        return (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Avatar src={user.avatarUrl} alt={user.name} size="md" />
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name.split(' (')[0]}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {canEditRole ? (
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                                            className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                                        >
                                            {isSuperAdmin ? (
                                                Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)
                                            ) : ( // isAdmin case
                                                <>
                                                    <option value={Role.Employee}>{Role.Employee}</option>
                                                    <option value={Role.Manager}>{Role.Manager}</option>
                                                </>
                                            )}
                                        </select>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">{user.role}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {canEditManager ? (
                                        <select
                                            value={user.managerId || ''}
                                            onChange={(e) => handleManagerChange(user.id, e.target.value)}
                                            className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                                        >
                                            <option value="">N/A</option>
                                            {managers.map(manager => <option key={manager.id} value={manager.id}>{manager.name.split(' (')[0]}</option>)}
                                        </select>
                                    ) : (
                                        allUsers.find(u => u.id === user.managerId)?.name.split(' (')[0] || 'N/A'
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagementTable;
