
export interface User {
  id: string;
  email: string;
  name?: string;
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
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  sprintId: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'backlog';
  assignedTo?: string;
  storyPoints?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BurndownData {
  date: string;
  ideal: number;
  actual: number;
}
