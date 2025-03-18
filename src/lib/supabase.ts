
import { createClient } from '@supabase/supabase-js';
import { Collaborator, BurndownData as BurndownDataType } from '@/types';

const supabaseUrl = 'https://wslflobdapmebkjnaqld.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzbGZsb2JkYXBtZWJram5hcWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NDc2ODQsImV4cCI6MjA1NzAyMzY4NH0.lNk_nX9S7KMjSYnR1JpFns7biqXvq0Ln2Z6pAYGi9aQ';

// Configure client with retry and timeout options
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache',
    },
    fetch: (url, options) => {
      const controller = new AbortController();
      const { signal } = controller;
      
      // Set a timeout to abort long-running requests
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      return fetch(url, { 
        ...options, 
        signal,
        // Ensure we get fresh data
        cache: 'no-cache'
      }).finally(() => clearTimeout(timeoutId));
    }
  }
});

// Helper function to get authenticated client
export const getAuthenticatedClient = () => {
  return supabase;
};

// Add a retry wrapper for Supabase requests
export const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000,
  backoffFactor = 2
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // Only retry on network errors
      if (!(error instanceof Error) || !(error.message?.includes('Failed to fetch') || error.message?.includes('Network error'))) {
        throw error;
      }
      
      // Wait with exponential backoff before retrying
      const waitTime = delay * Math.pow(backoffFactor, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

// Helper function to fetch columns for a sprint
export const fetchSprintColumns = async (sprintId: string, userId: string) => {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('board_columns')
        .select('*')
        .eq('sprint_id', sprintId)
        .order('order_index', { ascending: true });
        
      if (error) throw error;
      return data || [];
    });
  } catch (error) {
    console.error('Error fetching sprint columns:', error);
    return [];
  }
};

// Helper function to create a default column
export const createDefaultColumn = async (sprintId: string, userId: string, title: string, orderIndex: number) => {
  try {
    const { data, error } = await supabase
      .from('board_columns')
      .insert({
        sprint_id: sprintId,
        user_id: userId,
        title: title,
        order_index: orderIndex
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating default column:', error);
    return null;
  }
};

// Helper function to delete a column
export const deleteColumn = async (columnId: string) => {
  try {
    const { error } = await supabase
      .from('board_columns')
      .delete()
      .eq('id', columnId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting column:', error);
    return false;
  }
};

// Helper function to find a user by email or username
export const findUserByEmailOrUsername = async (emailOrUsername: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email')
      .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
      .single();
      
    if (error) {
      console.error('Error finding user:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};

// Helper function to add a collaborator to a project
export const addCollaborator = async (projectId: string, userId: string, role: 'viewer' | 'member' | 'admin') => {
  try {
    const { data, error } = await supabase
      .from('collaborators')
      .insert({
        project_id: projectId,
        user_id: userId,
        role: role
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding collaborator:', error);
    throw error;
  }
};

// Helper function to fetch collaborators for a project
export const fetchProjectCollaborators = async (projectId: string) => {
  try {
    const { data, error } = await supabase
      .from('collaborators')
      .select(`
        id,
        role,
        created_at,
        user_id,
        users:user_id (id, username, email)
      `)
      .eq('project_id', projectId);
      
    if (error) throw error;
    
    // Transform the data to match our Collaborator type
    const collaborators: Collaborator[] = (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      username: item.users ? (item.users as any).username || '' : '',
      email: item.users ? (item.users as any).email || '' : '',
      role: item.role,
      createdAt: item.created_at
    }));
    
    return collaborators;
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return [];
  }
};

// Helper function to remove a collaborator from a project
export const removeCollaborator = async (collaboratorId: string) => {
  try {
    const { error } = await supabase
      .from('collaborators')
      .delete()
      .eq('id', collaboratorId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return false;
  }
};

// Helper function to update a collaborator's role
export const updateCollaboratorRole = async (collaboratorId: string, role: 'viewer' | 'member' | 'admin') => {
  try {
    const { error } = await supabase
      .from('collaborators')
      .update({ role })
      .eq('id', collaboratorId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating collaborator role:', error);
    return false;
  }
};

// Helper function to fetch projects where user is a collaborator
export const fetchCollaborativeProjects = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('collaborators')
      .select(`
        role,
        projects:project_id (
          id, 
          title, 
          description, 
          end_goal, 
          created_at, 
          updated_at,
          owner:owner_id (username, email)
        )
      `)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Transform the data to include role information
    return (data || []).map(item => {
      const project = item.projects as any;
      return {
        id: project.id,
        title: project.title,
        description: project.description || '',
        endGoal: project.end_goal,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        ownerId: project.owner_id,
        ownerName: project.owner ? project.owner.username || '' : '',
        isCollaboration: true,
        role: item.role
      };
    });
  } catch (error) {
    console.error('Error fetching collaborative projects:', error);
    return [];
  }
};

// New helper to check if a user is a collaborator on a project
export const checkProjectCollaborator = async (projectId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('collaborators')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // No rows found error code
        return null;
      }
      throw error;
    }
    
    return data?.role || null;
  } catch (error) {
    console.error('Error checking collaborator status:', error);
    return null;
  }
};

// New helper to fetch sprints for a project as a collaborator
export const fetchCollaborativeProjectSprints = async (projectId: string) => {
  try {
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching collaborative project sprints:', error);
    return [];
  }
};

// New helper to fetch tasks for a sprint as a collaborator
export const fetchCollaborativeSprintTasks = async (sprintId: string) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('sprint_id', sprintId);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching collaborative sprint tasks:', error);
    return [];
  }
};

// New helper to fetch backlog tasks for a project as a collaborator
export const fetchCollaborativeBacklogTasks = async (projectId: string) => {
  try {
    console.log('Fetching collaborative backlog tasks for project:', projectId);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .is('sprint_id', null)
      .eq('status', 'backlog');
      
    if (error) {
      console.error('Error fetching backlog tasks:', error);
      throw error;
    }
    
    console.log('Backlog tasks fetched:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching collaborative backlog tasks:', error);
    return [];
  }
};

// New helper to fetch burndown data for a project
export const fetchBurndownData = async (projectId: string, userId: string): Promise<BurndownDataType[]> => {
  try {
    const { data, error } = await supabase
      .from('burndown_data')
      .select('date, ideal_points, actual_points')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('date', { ascending: true });
      
    if (error) throw error;
    
    // Map the database format to our app format
    return (data || []).map(item => ({
      date: item.date,
      ideal: item.ideal_points,
      actual: item.actual_points
    }));
  } catch (error) {
    console.error('Error fetching burndown data:', error);
    return [];
  }
};

// Updated helper to upsert burndown data for a project
// First deletes existing entries and then inserts new ones to avoid constraint errors
export const upsertBurndownData = async (
  projectId: string, 
  userId: string,
  burndownData: BurndownDataType[]
): Promise<boolean> => {
  try {
    // First delete existing data for this project/user
    const { error: deleteError } = await supabase
      .from('burndown_data')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
      
    if (deleteError) {
      console.error('Error deleting existing burndown data:', deleteError);
      return false;
    }
    
    // Then insert new data
    const dbData = burndownData.map(item => ({
      project_id: projectId,
      user_id: userId,
      date: item.date,
      ideal_points: item.ideal,
      actual_points: item.actual
    }));
    
    const { error: insertError } = await supabase
      .from('burndown_data')
      .insert(dbData);
      
    if (insertError) {
      console.error('Error inserting burndown data:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error upserting burndown data:', error);
    return false;
  }
};
