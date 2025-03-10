
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
  getBurndownData: (projectId: string) => BurndownData[];
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
  getBurndownData: () => [],
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
        .select('*')
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
          updatedAt: project.updated_at
        }));

        setProjects(formattedProjects);
        
        formattedProjects.forEach(project => {
          fetchSprints(project.id);
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
        const formattedTasks: Task[] = data.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          sprintId: task.sprint_id || '',
          status: task.status as 'todo' | 'in-progress' | 'review' | 'done',
          assignedTo: task.assign_to,
          storyPoints: task.story_points,
          createdAt: task.created_at,
          updatedAt: task.created_at
        }));

        setTasks(prev => {
          const filtered = prev.filter(t => t.sprintId !== sprintId);
          return [...filtered, ...formattedTasks];
        });
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
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
        .select()
        .single();

      if (error) throw error;

      if (!data) throw new Error('Failed to create project');

      const newProject: Project = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        endGoal: data.end_goal,
        createdAt: data.created_at,
        updatedAt: data.updated_at
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
      // First, get all sprints for this project
      const projectSprints = sprints.filter(s => s.projectId === id);
      const sprintIds = projectSprints.map(s => s.id);
      
      // Then delete all tasks related to these sprints
      if (sprintIds.length > 0) {
        // Delete tasks associated with the sprints
        const { error: tasksError } = await supabase
          .from('tasks')
          .delete()
          .in('sprint_id', sprintIds)
          .eq('user_id', user.id);
          
        if (tasksError) {
          console.error('Error deleting tasks:', tasksError);
          throw tasksError;
        }
        
        // Delete all sprints for this project
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
      
      // Finally delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      setSprints(prev => prev.filter(s => s.projectId !== id));
      setTasks(prev => prev.filter(t => !sprintIds.includes(t.sprintId)));
      
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
      // Handle special case for backlog tasks
      const isBacklogTask = task.sprintId === "backlog";
      const projectId = isBacklogTask 
        ? task.projectId // Use provided projectId for backlog tasks
        : getSprint(task.sprintId)?.projectId; // Get projectId from sprint
        
      if (!projectId && !isBacklogTask) throw new Error('Sprint not found');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: task.title,
          description: task.description,
          status: task.status,
          assign_to: task.assignedTo,
          story_points: task.storyPoints,
          sprint_id: task.sprintId,
          project_id: projectId,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      if (!data) throw new Error('Failed to create task');

      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        sprintId: data.sprint_id,
        status: data.status as 'todo' | 'in-progress' | 'review' | 'done',
        assignedTo: data.assign_to,
        storyPoints: data.story_points,
        createdAt: data.created_at,
        updatedAt: data.created_at
      };

      setTasks(prev => [...prev, newTask]);
      
      if (!isBacklogTask && projectId) {
        updateBurndownData(
          projectId,
          task.storyPoints || 0,
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

      if (error) throw error;

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
        getBurndownData,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
