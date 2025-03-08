
import React, { createContext, useContext, useState, useEffect } from "react";
import { Project, Sprint, Task, BurndownData } from "@/types";
import { useAuth } from "./AuthContext";

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
    // Load any saved data from localStorage when user changes
    if (user) {
      const savedProjects = localStorage.getItem(`scrumProjects_${user.id}`);
      const savedSprints = localStorage.getItem(`scrumSprints_${user.id}`);
      const savedTasks = localStorage.getItem(`scrumTasks_${user.id}`);
      const savedBurndown = localStorage.getItem(`scrumBurndown_${user.id}`);

      if (savedProjects) setProjects(JSON.parse(savedProjects));
      if (savedSprints) setSprints(JSON.parse(savedSprints));
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedBurndown) setBurndownData(JSON.parse(savedBurndown));
    } else {
      // Clear data when logged out
      setProjects([]);
      setSprints([]);
      setTasks([]);
      setBurndownData({});
    }
  }, [user]);

  // Helper to save data to localStorage
  const saveData = () => {
    if (!user) return;
    
    localStorage.setItem(`scrumProjects_${user.id}`, JSON.stringify(projects));
    localStorage.setItem(`scrumSprints_${user.id}`, JSON.stringify(sprints));
    localStorage.setItem(`scrumTasks_${user.id}`, JSON.stringify(tasks));
    localStorage.setItem(`scrumBurndown_${user.id}`, JSON.stringify(burndownData));
  };

  // Generate a random ID
  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Project CRUD operations
  const addProject = async (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newProject: Project = {
      id: generateId(),
      ...project,
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [...prev, newProject]);
    
    // Create default burndown data for the project
    setBurndownData((prev) => ({
      ...prev,
      [newProject.id]: generateDefaultBurndownData(),
    }));
    
    saveData();
    return newProject;
  };

  const getProject = (id: string) => projects.find((p) => p.id === id);

  const updateProject = async (id: string, project: Partial<Omit<Project, "id">>) => {
    const updatedProject = {
      ...projects.find((p) => p.id === id)!,
      ...project,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) => (p.id === id ? updatedProject : p)));
    saveData();
    return updatedProject;
  };

  const deleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    // Also delete associated sprints and tasks
    const projectSprints = sprints.filter((s) => s.projectId === id);
    const sprintIds = projectSprints.map((s) => s.id);
    
    setSprints((prev) => prev.filter((s) => s.projectId !== id));
    setTasks((prev) => prev.filter((t) => !sprintIds.includes(t.sprintId)));
    
    // Delete burndown data
    setBurndownData((prev) => {
      const newData = { ...prev };
      delete newData[id];
      return newData;
    });
    
    saveData();
  };

  // Sprint CRUD operations
  const addSprint = async (sprint: Omit<Sprint, "id">) => {
    const newSprint: Sprint = {
      id: generateId(),
      ...sprint,
    };
    setSprints((prev) => [...prev, newSprint]);
    saveData();
    return newSprint;
  };

  const getSprint = (id: string) => sprints.find((s) => s.id === id);

  const updateSprint = async (id: string, sprint: Partial<Omit<Sprint, "id">>) => {
    const updatedSprint = {
      ...sprints.find((s) => s.id === id)!,
      ...sprint,
    };
    setSprints((prev) => prev.map((s) => (s.id === id ? updatedSprint : s)));
    saveData();
    return updatedSprint;
  };

  const deleteSprint = async (id: string) => {
    setSprints((prev) => prev.filter((s) => s.id !== id));
    // Also delete associated tasks
    setTasks((prev) => prev.filter((t) => t.sprintId !== id));
    saveData();
  };

  const getSprintsByProject = (projectId: string) => 
    sprints.filter((s) => s.projectId === projectId);

  // Task CRUD operations
  const addTask = async (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: generateId(),
      ...task,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [...prev, newTask]);
    
    // Update burndown data
    updateBurndownData(
      getSprint(task.sprintId)?.projectId || "",
      task.storyPoints || 0,
      "add"
    );
    
    saveData();
    return newTask;
  };

  const getTask = (id: string) => tasks.find((t) => t.id === id);

  const updateTask = async (id: string, task: Partial<Omit<Task, "id">>) => {
    const existingTask = tasks.find((t) => t.id === id)!;
    const updatedTask = {
      ...existingTask,
      ...task,
      updatedAt: new Date().toISOString(),
    };
    
    setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    
    // Update burndown data if status changed to done
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
    
    saveData();
    return updatedTask;
  };

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    
    if (taskToDelete) {
      const sprint = getSprint(taskToDelete.sprintId);
      
      // Update burndown data
      if (sprint && taskToDelete.storyPoints) {
        updateBurndownData(
          sprint.projectId,
          taskToDelete.storyPoints,
          taskToDelete.status === "done" ? "complete" : "add"
        );
      }
    }
    
    setTasks((prev) => prev.filter((t) => t.id !== id));
    saveData();
  };

  const getTasksBySprint = (sprintId: string) => 
    tasks.filter((t) => t.sprintId === sprintId);

  // Burndown chart functions
  const generateDefaultBurndownData = (): BurndownData[] => {
    const data: BurndownData[] = [];
    const today = new Date();
    
    // Generate 21 days of data (3 weeks)
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
      
      // Update data based on action
      const updatedData = projectData.map((item) => {
        // For future dates, update ideal line
        if (item.date >= today) {
          if (action === "add") {
            return { ...item, ideal: item.ideal + points };
          } else if (action === "remove") {
            return { ...item, ideal: Math.max(0, item.ideal - points) };
          }
        }
        
        // For today, update actual line
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
