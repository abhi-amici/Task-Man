import { Role } from './constants';

export interface User {
  id: string;
  name: string;
  email: string;
  extension: string;
  avatarUrl: string;
  role: Role;
  managerId?: string;
}

export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Discarded = 'Discarded',
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export interface Remark {
  userId: string;
  text: string;
  timestamp: string; // ISO 8601 format
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignerId: string;
  assigneeId: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number; // 0-100
  startDate: string; // ISO 8601 format
  finishDate: string; // ISO 8601 format
  remarks: Remark[];
}

export interface Project {
  id: string;
  name: string;
}

export type Language = 'en' | 'hi';