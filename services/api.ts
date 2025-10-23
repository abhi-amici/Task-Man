
import { db } from './firebase';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    Timestamp,
} from 'firebase/firestore';
import { User, Task, Project } from '../types';

// --- Helper Functions ---

// Converts a Firestore document into a Task object, handling Timestamp conversions.
const docToTask = (doc: any): Task => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        startDate: data.startDate.toDate().toISOString(),
        finishDate: data.finishDate.toDate().toISOString(),
        remarks: data.remarks || [], // Ensure remarks is always an array
    } as Task;
};

// Converts a Firestore document into a generic object with its ID.
const docToPlainObj = (doc: any) => ({ id: doc.id, ...doc.data() });


// --- API Implementation ---

export const api = {
    getUsers: async (): Promise<User[]> => {
        if (!db) throw new Error("Firebase is not initialized.");

        const usersSnapshot = await getDocs(collection(db, 'users'));
        return usersSnapshot.docs.map(doc => docToPlainObj(doc) as User);
    },

    getUserByEmail: async (email: string): Promise<User | null> => {
        if (!db) throw new Error("Firebase is not initialized.");

        const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        const userDoc = querySnapshot.docs[0];
        return docToPlainObj(userDoc) as User;
    },

    getProjects: async (): Promise<Project[]> => {
        if (!db) throw new Error("Firebase is not initialized.");

        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        return projectsSnapshot.docs.map(doc => docToPlainObj(doc) as Project);
    },
    
    getTasksForUser: async (userId: string): Promise<Task[]> => {
        if (!db) throw new Error("Firebase is not initialized.");

        const q = query(collection(db, 'tasks'), where('assigneeId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docToTask);
    },

    getTasksCreatedByUser: async (userId: string): Promise<Task[]> => {
        if (!db) throw new Error("Firebase is not initialized.");

        const q = query(collection(db, 'tasks'), where('assignerId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docToTask);
    },

    getTeamTasks: async (managerId: string): Promise<Task[]> => {
        if (!db) throw new Error("Firebase is not initialized.");

        const usersQuery = query(collection(db, 'users'), where('managerId', '==', managerId));
        const usersSnapshot = await getDocs(usersQuery);
        const teamMemberIds = usersSnapshot.docs.map(doc => doc.id);

        if (teamMemberIds.length === 0) return [];

        const tasks: Task[] = [];
        // Firestore 'in' queries are limited to 30 elements. We loop in chunks to support larger teams.
        for (let i = 0; i < teamMemberIds.length; i += 30) {
            const chunk = teamMemberIds.slice(i, i + 30);
            const tasksQuery = query(collection(db, 'tasks'), where('assigneeId', 'in', chunk));
            const tasksSnapshot = await getDocs(tasksQuery);
            tasks.push(...tasksSnapshot.docs.map(docToTask));
        }
        return tasks;
    },

    getAllTasks: async (): Promise<Task[]> => {
        if (!db) throw new Error("Firebase is not initialized.");

        const q = query(collection(db, 'tasks'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docToTask);
    },

    updateTask: async (updatedTask: Task): Promise<Task> => {
        if (!db) throw new Error("Firebase is not initialized.");

        const { id, ...taskData } = updatedTask;
        const taskRef = doc(db, 'tasks', id);
        await updateDoc(taskRef, {
            ...taskData,
            startDate: Timestamp.fromDate(new Date(updatedTask.startDate)),
            finishDate: Timestamp.fromDate(new Date(updatedTask.finishDate)),
        });
        return updatedTask;
    },

    createTask: async (newTaskData: Omit<Task, 'id' | 'remarks'>): Promise<Task> => {
        if (!db) throw new Error("Firebase is not initialized.");

        const dataToCreate = {
            ...newTaskData,
            startDate: Timestamp.fromDate(new Date(newTaskData.startDate)),
            finishDate: Timestamp.fromDate(new Date(newTaskData.finishDate)),
            remarks: [],
        };
        const docRef = await addDoc(collection(db, 'tasks'), dataToCreate);
        return {
            ...newTaskData,
            id: docRef.id,
            remarks: [],
        };
    },

    createUser: async (newUserData: Omit<User, 'id'>): Promise<User> => {
        if (!db) throw new Error("Firebase is not initialized.");

        const docRef = await addDoc(collection(db, 'users'), newUserData);
        return {
            id: docRef.id,
            ...newUserData,
        } as User;
    },

    updateUser: async (updatedUser: User): Promise<User> => {
        if (!db) throw new Error("Firebase is not initialized.");
        
        const { id, ...userData } = updatedUser;
        const userRef = doc(db, 'users', id);
        await updateDoc(userRef, userData);
        return updatedUser;
    }
};
