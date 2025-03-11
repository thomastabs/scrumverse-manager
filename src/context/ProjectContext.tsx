import React, { createContext, useContext, useState, useEffect } from "react";
import { Project, Sprint, Task, BurndownData } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";

interface ProjectContextType {
  projects: Project[];
  sprints: Sprint[];
  tasks: Task[];
  burndownData: Record<string, BurndownData[]>;
  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<Project>;
  getProject: (id: string) => Project | undefined;
  updateProject: (id: string, project: Partial<Omit<Project, "id">>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  addSprint: (sprint: Omit<Sprint, "id">) => Promise<Sprint>;
  getSprint: (id: string) => Sprint | undefined;
  updateSprint: (id: string, sprint: Partial<Omit<Sprint, "id">>) => Promise<Sprint>;
  deleteSprint: (id: string) => Promise<void>;
  getSprintsByProject: (projectId: string) => Sprint[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<Task>;
  getTask: (id: string) => Task | undefined;
  updateTask: (id: string, task: Partial<Omit<Task, "id">>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTasksBySprint: (sprintId: string) => Task[];
  getBacklogTasks: (projectId: string) => Task[];
  getBurndownData: (projectId: string) => BurndownData[];
  fetchCollaborativeProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  sprints: [],
  tasks: [],
  burndownData: {},
  addProject: async () => ({ id: "", title: "", description: "", createdAt: "", updatedAt: "" }),
  getProject: () => undefined,
  updateProject: async () => ({ id: "", title: "", description: "", createdAt: "", updatedAt: "" }),
  deleteProject: async () => {},
  addSprint: async () => ({ id: "", title: "", description: "", projectId: "", startDate: "", endDate: "", status: "planned" }),
  getSprint: () => undefined,
  updateSprint: async () => ({ id: "", title: "", description: "", projectId: "", startDate: "", endDate: "", status: "planned" }),
  deleteSprint: async () => {},
  getSprintsByProject: () => [],
  addTask: async () => ({ id: "", title: "", sprintId: "", status: "todo", createdAt: "", updatedAt: "" }),
  getTask: () => undefined,
  updateTask: async () => ({ id: "", title: "", sprintId: "", status: "todo", createdAt: "", updatedAt: "" }),
  deleteTask: async () => {},
  getTasksBySprint: () => [],
  getBacklogTasks: () => [],
  getBurndownData: () => [],
  fetchCollaborativeProjects: async () => {},
});

export const useProjects = () => useContext(ProjectContext);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [burndownData, setBurndownData] = useState<Record<string, BurndownData[]>>({});

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchCollaborativeProjects();
    } else {
      setProjects([]);
      setSprints([]);
      setTasks([]);
      setBurndownData({});
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, owner:owner_id (username, email)`)
        .eq('owner_id', user.id);

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      if (data) {
        const formattedProjects: Project[] = data.map(project => ({
          id: project.id,
          title: project.title,
          description: project.description || '',
          endGoal: project.end_goal,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          ownerId: project.owner_id,
          ownerName: project.owner?.username || '',
          isCollaboration: false
        }));

        setProjects(formattedProjects);
        
        formattedProjects.forEach(project => {
          fetchSprints(project.id);
          fetchBacklogTasks(project.id);
        });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchSprints = async (projectId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching sprints:', error);
        return;
      }

      if (data) {
        const formattedSprints: Sprint[] = data.map(sprint => ({
          id: sprint.id,
          title: sprint.title,
          description: sprint.description || '',
          projectId: sprint.project_id,
          startDate: sprint.start_date,
          endDate: sprint.end_date,
          status: sprint.status as 'planned' | 'in-progress' | 'completed'
        }));

        setSprints(prev => {
          const filtered = prev.filter(s => s.projectId !== projectId);
          return [...filtered, ...formattedSprints];
        });
        
        formattedSprints.forEach(sprint => {
          fetchTasksBySprint(sprint.id);
        });
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
    }
  };

  const fetchTasksBySprint = async (sprintId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('sprint_id', sprintId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching tasks for sprint:', error);
        return;
      }

      if (data) {
        // Map the database status values to ensure they are consistent
        const formattedTasks: Task[] = data.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          sprintId: task.sprint_id || '',
          // Ensure we preserve the exact status from the database
          status: task.status,
          assignedTo: task.assign_to,
          storyPoints: task.story_points,
          priority: task.priority as 'low' | 'medium' | 'high',
          createdAt: task.created_at,
          updatedAt: task.created_at,
          projectId: task.project_id
        }));

        console.log('Fetched tasks with statuses:', formattedTasks.map(t => ({ id: t.id, status: t.status })));

        setTasks(prev => {
          const filtered = prev.filter(t => t.sprintId !== sprintId);
          return [...filtered, ...formattedTasks];
        });
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchBacklogTasks = async (projectId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .is('sprint_id', null)
        .eq('project_id', projectId)
        .eq('status', 'backlog')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching backlog tasks:', error);
        return;
      }

      if (data) {
        console.log('Fetched backlog tasks:', data);
        const formattedTasks: Task[] = data.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          sprintId: '',
          status: 'backlog',
          assignedTo: task.assign_to,
          storyPoints: task.story_points,
          priority: task.priority as 'low' | 'medium' | 'high',
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          projectId: task.project_id
        }));

        setTasks(prev => {
          const filtered = prev.filter(t => 
            !(t.status === 'backlog' && t.projectId === projectId && !t.sprintId)
          );
          return [...filtered, ...formattedTasks];
        });
      }
    } catch (error) {
      console.error('Error fetching backlog tasks:', error);
    }
  };

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const addProject = async (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          title: project.title,
          description: project.description,
          end_goal: project.endGoal,
          owner_id: user.id
        }])
        .select(`*, owner:owner_id (username, email)`)
        .single();

      if (error) throw error;

      if (!data) throw new Error('Failed to create project');

      const newProject: Project = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        endGoal: data.end_goal,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        ownerId: data.owner_id,
        ownerName: data.owner?.username || '',
        isCollaboration: false
      };

      setProjects(prev => [...prev, newProject]);
      
      setBurndownData(prev => ({
        ...prev,
        [newProject.id]: generateDefaultBurndownData(),
      }));
      
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  };

  const getProject = (id: string) => projects.find((p) => p.id === id);

  const updateProject = async (id: string, project: Partial<Omit<Project, "id">>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: project.title,
          description: project.description,
          end_goal: project.endGoal,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      const updatedProject = {
        ...projects.find((p) => p.id === id)!,
        ...project,
        updatedAt: new Date().toISOString(),
      };

      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const projectSprints = sprints.filter(s => s.projectId === id);
      const sprintIds = projectSprints.map(s => s.id);
      
      if (sprintIds.length > 0) {
        const { error: tasksError } = await supabase
          .from('tasks')
          .delete()
          .in('sprint_id', sprintIds)
          .eq('user_id', user.id);
          
        if (tasksError) {
          console.error('Error deleting tasks:', tasksError);
          throw tasksError;
        }
        
        const { error: sprintsError } = await supabase
          .from('sprints')
          .delete()
          .eq('project_id', id)
          .eq('user_id', user.id);
          
        if (sprintsError) {
          console.error('Error deleting sprints:', sprintsError);
          throw sprintsError;
        }
      }
      
      const { error: backlogTasksError } = await supabase
        .from('tasks')
        .delete()
        .is('sprint_id', null)
        .eq('project_id', id)
        .eq('user_id', user.id);
        
      if (backlogTasksError) {
        console.error('Error deleting backlog tasks:', backlogTasksError);
        throw backlogTasksError;
      }
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      setSprints(prev => prev.filter(s => s.projectId !== id));
      setTasks(prev => prev.filter(t => !sprintIds.includes(t.sprintId) && t.projectId !== id));
      
      setBurndownData(prev => {
        const newData = { ...prev };
        delete newData[id];
        return newData;
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const addSprint = async (sprint: Omit<Sprint, "id">) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('sprints')
        .insert([{
          title: sprint.title,
          description: sprint.description,
          project_id: sprint.projectId,
          start_date: sprint.startDate,
          end_date: sprint.endDate,
          status: sprint.status,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      if (!data) throw new Error('Failed to create sprint');

      const newSprint: Sprint = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        projectId: data.project_id,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status as 'planned' | 'in-progress' | 'completed'
      };

      setSprints(prev => [...prev, newSprint]);
      
      return newSprint;
    } catch (error) {
      console.error('Error adding sprint:', error);
      throw error;
    }
  };

  const getSprint = (id: string) => sprints.find((s) => s.id === id);

  const updateSprint = async (id: string, sprint: Partial<Omit<Sprint, "id">>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('sprints')
        .update({
          title: sprint.title,
          description: sprint.description,
          start_date: sprint.startDate,
          end_date: sprint.endDate,
          status: sprint.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      const updatedSprint = {
        ...sprints.find(s => s.id === id)!,
        ...sprint,
      };

      setSprints(prev => prev.map(s => s.id === id ? updatedSprint : s));
      
      return updatedSprint;
    } catch (error) {
      console.error('Error updating sprint:', error);
      throw error;
    }
  };

  const deleteSprint = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSprints(prev => prev.filter(s => s.id !== id));
      
      setTasks(prev => prev.filter(t => t.sprintId !== id));
    } catch (error) {
      console.error('Error deleting sprint:', error);
      throw error;
    }
  };

  const getSprintsByProject = (projectId: string) => 
    sprints.filter((s) => s.projectId === projectId);

  const addTask = async (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const isBacklogTask = task.status === "backlog";
      const projectId = task.projectId;

      if (!projectId) throw new Error('Project ID is required');

      console.log('Adding task with data:', task);

      const taskData = {
        title: task.title,
        description: task.description,
        status: task.status,
        assign_to: task.assignedTo,
        story_points: task.storyPoints,
        priority: task.priority,
        sprint_id: isBacklogTask ? null : task.sprintId,
        project_id: projectId,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;

      if (!data) throw new Error('Failed to create task');

      console.log('Task created in database:', data);

      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        sprintId: data.sprint_id || '',
        status: data.status,
        assignedTo: data.assign_to,
        storyPoints: data.story_points,
        priority: data.priority as 'low' | 'medium' | 'high',
        createdAt: data.created_at,
        updatedAt: data.created_at,
        projectId: data.project_id
      };

      setTasks(prev => [...prev, newTask]);
      
      if (!isBacklogTask && projectId && task.storyPoints) {
        updateBurndownData(
          projectId,
          task.storyPoints,
          "add"
        );
      }
      
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const getTask = (id: string) => tasks.find((t) => t.id === id);

  const updateTask = async (id: string, task: Partial<Omit<Task, "id">>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const existingTask = tasks.find(t => t.id === id);
      if (!existingTask) throw new Error('Task not found');

      console.log('Updating task status from:', existingTask.status, 'to:', task.status);

      const { error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description,
          status: task.status,
          assign_to: task.assignedTo,
          story_points: task.storyPoints,
          sprint_id: task.sprintId
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      const updatedTask = {
        ...existingTask,
        ...task,
        updatedAt: new Date().toISOString(),
      };

      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      
      if (
        existingTask.status !== "done" && 
        updatedTask.status === "done" &&
        existingTask.storyPoints
      ) {
        const sprint = getSprint(existingTask.sprintId);
        if (sprint) {
          updateBurndownData(
            sprint.projectId,
            existingTask.storyPoints,
            "complete"
          );
        }
      }
      
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const taskToDelete = tasks.find(t => t.id === id);
      if (!taskToDelete) throw new Error('Task not found');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== id));
      
      const sprint = getSprint(taskToDelete.sprintId);
      if (sprint && taskToDelete.storyPoints) {
        updateBurndownData(
          sprint.projectId,
          taskToDelete.storyPoints,
          taskToDelete.status === "done" ? "complete" : "add"
        );
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const getTasksBySprint = (sprintId: string) => 
    tasks.filter((t) => t.sprintId === sprintId);

  const getBacklogTasks = (projectId: string) =>
    tasks.filter((t) => t.status === "backlog" && t.projectId === projectId && !t.sprintId);

  const generateDefaultBurndownData = (): BurndownData[] => {
    const data: BurndownData[] = [];
    const today = new Date();
    
    for (let i = 0; i < 21; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      data.push({
        date: date.toISOString().split("T")[0],
        ideal: 0,
        actual: 0,
      });
    }
    
    return data;
  };

  const updateBurndownData = (
    projectId: string,
    points: number,
    action: "add" | "complete" | "remove"
  ) => {
    if (!projectId || !points) return;
    
    setBurndownData((prev) => {
      const projectData = prev[projectId] || generateDefaultBurndownData();
      const today = new Date().toISOString().split("T")[0];
      
      const updatedData = projectData.map((item) => {
        if (item.date >= today) {
          if (action === "add") {
            return { ...item, ideal: item.ideal + points };
          } else if (action === "remove") {
            return { ...item, ideal: Math.max(0, item.ideal - points) };
          }
        }
        
        if (item.date === today) {
          if (action === "complete") {
            return { ...item, actual: item.actual + points };
          } else if (action === "remove" && item.actual > 0) {
            return { ...item, actual: Math.max(0, item.actual - points) };
          }
        }
        
        return item;
      });
      
      return { ...prev, [projectId]: updatedData };
    });
  };

  const getBurndownData = (projectId: string) => 
    burndownData[projectId] || generateDefaultBurndownData();

  const fetchCollaborativeProjects = async () => {
    if (!user) return;

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
            owner_id,
            owner:owner_id (username, email)
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching collaborative projects:', error);
        return;
      }

      if (data && data.length > 0) {
        // Extract the collaborative projects and format them
        const collaborativeProjects = data
          .filter(item => item.projects)
          .map(item => {
            const project = item.projects as any;
            return {
              id: project.id,
              title: project.title,
              description: project.description || '',
              endGoal: project.end_goal,
              createdAt: project.created_at,
              updatedAt: project.updated_at,
              ownerId: project.owner_id,
              ownerName: project.owner?.username || '',
              isCollaboration: true,
              role: item.role
            };
          });

        // Add collaborative projects to the projects state
        setProjects(prev => {
          // Filter out any duplicates (in case user is both owner and collaborator)
          const existingIds = prev.map(p => p.id);
          const newCollaborativeProjects = collaborativeProjects.filter(p => !existingIds.includes(p.id));
          return [...prev, ...newCollaborativeProjects];
        });

        // Fetch sprints and backlog tasks for collaborative projects
        collaborativeProjects.forEach(project => {
          fetchSprints(project.id);
          fetchBacklogTasks(project.id);
        });
      }
    } catch (error) {
      console.error('Error fetching collaborative projects:', error);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        sprints,
        tasks,
        burndownData,
        addProject,
        getProject,
        updateProject,
        deleteProject,
        addSprint,
        getSprint,
        updateSprint,
        deleteSprint,
        getSprintsByProject,
        addTask,
        getTask,
        updateTask,
        deleteTask,
        getTasksBySprint,
        getBacklogTasks,
        getBurndownData,
        fetchCollaborativeProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
