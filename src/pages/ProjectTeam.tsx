
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { fetchProjectCollaborators } from "@/lib/supabase";
import { Users, Mail, ChevronDown, CheckCircle, Clock, Star } from "lucide-react";
import { Collaborator, Task } from "@/types";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ProjectTeam: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, sprints, tasks, getSprintsByProject } = useProjects();
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [owner, setOwner] = useState<{id: string, username: string, email?: string} | null>(null);
  const [userTasks, setUserTasks] = useState<Record<string, Task[]>>({});
  const [userStats, setUserStats] = useState<Record<string, {
    assignedTasks: number,
    completedTasks: number,
    totalStoryPoints: number,
    completedStoryPoints: number
  }>>({});
  
  const project = getProject(projectId || "");
  
  useEffect(() => {
    const loadCollaborators = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      try {
        // Get collaborators
        const collaboratorsData = await fetchProjectCollaborators(projectId);
        setCollaborators(collaboratorsData);
        
        // Set owner data if available from project
        if (project?.ownerId && project?.ownerName) {
          setOwner({
            id: project.ownerId,
            username: project.ownerName,
            email: undefined
          });
        }
      } catch (error) {
        console.error("Error loading team data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCollaborators();
  }, [projectId, project]);
  
  // Load task statistics when tasks and collaborators are available
  useEffect(() => {
    if (!projectId) return;
    
    console.log("Processing task data for project:", projectId);
    console.log("Available tasks:", tasks.length);
    console.log("Available collaborators:", collaborators.length);
    console.log("Owner:", owner);
    
    // Get all sprints for this project
    const projectSprints = getSprintsByProject(projectId);
    console.log("Project sprints:", projectSprints.length);
    
    // Get all tasks for this project - both sprint tasks and backlog tasks
    const projectTasks = tasks.filter(task => {
      const isInSprint = projectSprints.some(sprint => sprint.id === task.sprintId);
      const isProjectBacklog = task.projectId === projectId && !task.sprintId;
      return isInSprint || isProjectBacklog;
    });
    
    console.log("Project tasks:", projectTasks.length);
    
    // Create a mapping of user IDs to their assigned tasks
    const tasksByUser: Record<string, Task[]> = {};
    const statsByUser: Record<string, {
      assignedTasks: number,
      completedTasks: number,
      totalStoryPoints: number,
      completedStoryPoints: number
    }> = {};
    
    // Initialize stats for owner if available
    if (owner) {
      tasksByUser[owner.id] = [];
      statsByUser[owner.id] = {
        assignedTasks: 0,
        completedTasks: 0,
        totalStoryPoints: 0,
        completedStoryPoints: 0
      };
    }
    
    // Initialize stats for all collaborators
    collaborators.forEach(collab => {
      tasksByUser[collab.userId] = [];
      statsByUser[collab.userId] = {
        assignedTasks: 0,
        completedTasks: 0,
        totalStoryPoints: 0,
        completedStoryPoints: 0
      };
    });
    
    // Process all tasks
    projectTasks.forEach(task => {
      if (!task.assignedTo) return;
      
      console.log(`Processing task ${task.id} assigned to ${task.assignedTo}`);
      
      // Check if this user exists in our mapping
      if (!tasksByUser[task.assignedTo]) {
        console.log(`Creating new entry for user ${task.assignedTo}`);
        tasksByUser[task.assignedTo] = [];
        statsByUser[task.assignedTo] = {
          assignedTasks: 0,
          completedTasks: 0,
          totalStoryPoints: 0,
          completedStoryPoints: 0
        };
      }
      
      // Add task to user's task list
      tasksByUser[task.assignedTo].push(task);
      
      // Update stats
      const storyPoints = task.storyPoints || 0;
      statsByUser[task.assignedTo].totalStoryPoints += storyPoints;
      
      if (task.status === 'done') {
        statsByUser[task.assignedTo].completedTasks++;
        statsByUser[task.assignedTo].completedStoryPoints += storyPoints;
      } else {
        statsByUser[task.assignedTo].assignedTasks++;
      }
    });
    
    console.log("Task mapping by user:", Object.keys(tasksByUser).map(id => `${id}: ${tasksByUser[id].length} tasks`));
    console.log("Stats by user:", statsByUser);
    
    setUserTasks(tasksByUser);
    setUserStats(statsByUser);
  }, [projectId, tasks, collaborators, owner, getSprintsByProject]);
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">Loading team information...</div>
      </div>
    );
  }
  
  const getRoleBadgeClass = (role: string) => {
    switch(role) {
      case 'scrum_master':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case 'product_owner':
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case 'team_member':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-400";
    }
  };
  
  const renderTaskDropdown = (userId: string) => {
    const userTaskList = userTasks[userId] || [];
    
    if (userTaskList.length === 0) {
      return (
        <div className="text-xs text-muted-foreground mt-1">
          No tasks assigned
        </div>
      );
    }
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="text-xs flex items-center gap-1 hover:text-primary transition-colors mt-1">
          <span>View {userTaskList.length} task{userTaskList.length !== 1 ? 's' : ''}</span>
          <ChevronDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-auto">
          {userTaskList.map(task => (
            <DropdownMenuItem key={task.id} className="flex flex-col items-start">
              <div className="font-medium truncate w-full">{task.title}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`px-1.5 py-0.5 rounded-full ${task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                  {task.status === 'done' ? 'Complete' : 'In Progress'}
                </span>
                {task.storyPoints && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3" />
                    {task.storyPoints}
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  
  const renderUserStats = (userId: string) => {
    const stats = userStats[userId];
    
    if (!stats) {
      console.log(`No stats available for user ${userId}`);
      return null;
    }
    
    return (
      <div className="flex flex-col gap-1 mt-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Active: {stats.assignedTasks}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <CheckCircle className="h-3 w-3" />
            <span>Completed: {stats.completedTasks}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Star className="h-3 w-3" />
            <span>Points: {stats.completedStoryPoints} / {stats.totalStoryPoints}</span>
          </div>
        </div>
        {renderTaskDropdown(userId)}
      </div>
    );
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Team</h2>
      
      <div className="space-y-4">
        <div className="scrum-card p-6">
          <h3 className="text-lg font-semibold mb-4">Project Owner</h3>
          {owner ? (
            <div className="flex items-center gap-3 p-3 bg-background rounded-md border border-border">
              <div className="h-10 w-10 bg-accent/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold">{owner.username.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="font-medium">{owner.username}</div>
                {owner.email && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    <span>{owner.email}</span>
                  </div>
                )}
                <div className="text-xs px-2 py-1 rounded-full inline-block bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 mt-1">
                  Owner
                </div>
                {renderUserStats(owner.id)}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Owner information not available</div>
          )}
        </div>
        
        <div className="scrum-card p-6">
          <h3 className="text-lg font-semibold mb-4">Team Members</h3>
          {collaborators.length > 0 ? (
            <div className="space-y-3">
              {collaborators.map(collab => (
                <div key={collab.id} className="flex items-center gap-3 p-3 bg-background rounded-md border border-border">
                  <div className="h-10 w-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold">{collab.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{collab.username}</div>
                    {collab.email && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        <span>{collab.email}</span>
                      </div>
                    )}
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${getRoleBadgeClass(collab.role)} mt-1`}>
                      {collab.role === 'scrum_master' ? 'Scrum Master' : 
                       collab.role === 'product_owner' ? 'Product Owner' : 
                       'Team Member'}
                    </div>
                    {renderUserStats(collab.userId)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No team members yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTeam;
