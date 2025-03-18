
import React, { useState, useEffect } from "react";
import { useProjects } from "@/context/ProjectContext";
import { X, Edit, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ProjectRole, Collaborator } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface EditTaskModalProps {
  taskId: string;
  onClose: () => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ 
  taskId,
  onClose
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [storyPoints, setStoryPoints] = useState<number>(1);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [projectOwner, setProjectOwner] = useState<{id: string, username: string} | null>(null);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  
  const { getTask, updateTask } = useProjects();
  
  useEffect(() => {
    const task = getTask(taskId);
    
    if (task) {
      console.log("Loading task data:", task);
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority || "medium");
      setAssignedTo(task.assignedTo || task.assign_to || "");
      setStoryPoints(task.storyPoints || task.story_points || 1);
      setProjectId(task.projectId);
      
      // If we have the project ID, fetch collaborators
      if (task.projectId) {
        fetchCollaborators(task.projectId);
      }
    }
  }, [taskId, getTask]);
  
  const fetchCollaborators = async (projectId: string) => {
    setIsLoadingCollaborators(true);
    try {
      // Fetch project owner
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('owner_id, title')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      if (projectData) {
        // Get owner's username
        const { data: ownerData, error: ownerError } = await supabase
          .from('users')
          .select('id, username')
          .eq('id', projectData.owner_id)
          .single();
          
        if (!ownerError && ownerData) {
          setProjectOwner(ownerData);
        }
      }
      
      // Fetch collaborators
      const { data: collaboratorsData, error: collaboratorsError } = await supabase
        .from('collaborators')
        .select(`
          id,
          userId:user_id,
          role,
          createdAt:created_at,
          users:user_id (
            id,
            username,
            email
          )
        `)
        .eq('project_id', projectId);
      
      if (collaboratorsError) throw collaboratorsError;
      
      const formattedCollaborators = collaboratorsData?.map(collab => ({
        id: collab.id,
        userId: collab.userId,
        username: collab.users ? (collab.users as any).username || '' : '',
        email: collab.users ? (collab.users as any).email || '' : '',
        role: collab.role as ProjectRole,
        createdAt: collab.createdAt
      })) || [];
      
      setCollaborators(formattedCollaborators);
    } catch (error) {
      console.error("Error fetching collaborators:", error);
    } finally {
      setIsLoadingCollaborators(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    
    try {
      const updatedData = {
        title,
        description,
        priority,
        assignedTo,
        storyPoints
      };
      
      console.log("Updating task with:", updatedData);
      
      await updateTask(taskId, updatedData);
      
      toast.success("Task updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };
  
  // Build assignee options from owner and collaborators
  const assigneeOptions = [
    ...(projectOwner ? [{ id: projectOwner.id, name: projectOwner.username }] : []),
    ...collaborators.map(collab => ({ 
      id: collab.userId,
      name: collab.username 
    }))
  ];
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Edit className="h-4 w-4" />
            <span>Edit Task</span>
          </h2>
          <button
            onClick={onClose}
            className="text-scrum-text-secondary hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm">
              Task Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="scrum-input"
              required
              autoFocus
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="scrum-input"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 text-sm">
                Priority <span className="text-destructive">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="scrum-input"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-sm">
                Story Points <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={storyPoints}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setStoryPoints(isNaN(value) ? 1 : Math.max(1, value));
                }}
                className="scrum-input"
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm">
              Assigned To
            </label>
            {isLoadingCollaborators ? (
              <div className="scrum-input flex items-center">
                <div className="h-5 w-5 mr-2 rounded-full bg-scrum-accent/30 animate-pulse"></div>
                <span className="text-scrum-text-secondary">Loading collaborators...</span>
              </div>
            ) : (
              assigneeOptions.length > 0 ? (
                <Select 
                  value={assignedTo} 
                  onValueChange={setAssignedTo}
                >
                  <SelectTrigger className="bg-scrum-background border-scrum-border text-scrum-text focus:ring-scrum-accent focus:border-scrum-border">
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent className="bg-scrum-card border-scrum-border">
                    {assigneeOptions.map(option => (
                      <SelectItem 
                        key={option.id} 
                        value={option.name}
                        className="text-scrum-text focus:bg-scrum-accent/20 focus:text-scrum-text"
                      >
                        <div className="flex items-center">
                          <User className="h-3.5 w-3.5 mr-2 text-scrum-text-secondary" />
                          {option.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="scrum-input"
                  placeholder="Enter name or email"
                />
              )
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="scrum-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="scrum-button"
            >
              Update Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
