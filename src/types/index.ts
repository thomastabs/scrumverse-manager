
export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  endGoal?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  ownerName?: string;
  isCollaboration?: boolean;
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
  status: string;
  assignedTo?: string;
  storyPoints?: number;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  completionDate?: string; // New field to track when a task was completed
  // Add these new properties to handle database field name differences
  story_points?: number;
  assign_to?: string;
  completion_date?: string; // Database field name version
}

export interface BurndownData {
  date: string;
  ideal: number;
  actual: number;
}

export type ProjectRole = 'product_owner' | 'team_member' | 'scrum_master';

export interface Collaborator {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: ProjectRole;
  createdAt: string;
}

export interface CollaborativeProject extends Project {
  role: ProjectRole;
  ownerName: string;
  isCollaboration: boolean;
}
