
export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  endGoal?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  title: string;
  description: string;
  projectId: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'in-progress' | 'completed';
  isCompleted?: boolean; // Added for compatibility with shared code
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  sprintId: string;
  projectId?: string; // Added for backlog tasks
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'backlog' | string;
  assignedTo?: string;
  storyPoints?: number;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  priority?: 'low' | 'medium' | 'high';
  storyPoints?: number;
}

export interface BacklogItemFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  storyPoints: number;
  projectId?: string;
}

export interface BurndownData {
  date: string;
  ideal: number;
  actual: number;
}

export interface BoardColumn {
  id: string;
  title: string;
  sprintId: string;
  orderIndex: number;
}
