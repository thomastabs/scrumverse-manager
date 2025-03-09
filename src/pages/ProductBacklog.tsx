
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { Plus, AlignJustify, Edit, Trash, MoveRight } from "lucide-react";
import { toast } from "sonner";
import { Task } from "@/types";

const ProductBacklog: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { 
    getProject, 
    addTask, 
    updateTask, 
    deleteTask, 
    tasks, 
    getSprintsByProject 
  } = useProjects();
  const navigate = useNavigate();
  
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  
  const project = getProject(projectId || "");
  const availableSprints = getSprintsByProject(projectId || "")
    .filter(s => s.status !== "completed");
    
  // Filter backlog tasks (those with no sprintId or with "backlog" as sprintId)
  useEffect(() => {
    const backlogItems = tasks.filter(t => 
      t.sprintId === "backlog" || 
      (t.sprintId === projectId && t.status === "backlog")
    );
    setBacklogTasks(backlogItems);
  }, [tasks, projectId]);
  
  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Project not found</h2>
        <button
          onClick={() => navigate(-1)}
          className="scrum-button"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  const handleMoveToSprint = async (taskId: string, sprintId: string) => {
    try {
      await updateTask(taskId, {
        sprintId,
        status: "todo" // Always move to TODO column
      });
      
      toast.success("Task moved to sprint");
      setMovingTaskId(null);
    } catch (error) {
      console.error("Error moving task to sprint:", error);
      toast.error("Failed to move task");
    }
  };
  
  return (
    <div className="container mx-auto px-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Product Backlog</h2>
          <p className="text-scrum-text-secondary">
            Tasks waiting to be assigned to a sprint
          </p>
        </div>
        
        <button
          onClick={() => setIsAddingTask(true)}
          className="scrum-button flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
      </div>
      
      <div className="bg-scrum-card border border-scrum-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-scrum-border flex items-center justify-between">
          <h3 className="font-medium">Backlog Items</h3>
          <span className="text-sm text-scrum-text-secondary">
            {backlogTasks.length} {backlogTasks.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        {backlogTasks.length === 0 ? (
          <div className="p-8 text-center text-scrum-text-secondary">
            <AlignJustify className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No tasks in the backlog</p>
            <p className="text-sm mt-1">
              Add tasks to track work that needs to be done
            </p>
          </div>
        ) : (
          <div className="divide-y divide-scrum-border">
            {backlogTasks.map(task => (
              <div 
                key={task.id} 
                className="p-4 hover:bg-scrum-background/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-scrum-text-secondary mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {task.priority && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          task.priority === 'high' ? 'bg-destructive/80 text-white' :
                          task.priority === 'medium' ? 'bg-orange-500/80 text-white' :
                          'bg-blue-500/80 text-white'
                        }`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      )}
                      
                      {task.storyPoints && (
                        <span className="bg-scrum-accent/30 text-xs px-2 py-0.5 rounded-full">
                          {task.storyPoints} {task.storyPoints === 1 ? "point" : "points"}
                        </span>
                      )}
                      
                      {task.assignedTo && (
                        <span className="bg-scrum-card text-xs px-2 py-0.5 rounded-full border border-scrum-border">
                          {task.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => setEditingTask(task.id)}
                      className="text-scrum-text-secondary hover:text-white transition-colors p-1"
                      title="Edit task"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => setMovingTaskId(task.id)}
                      className="text-scrum-text-secondary hover:text-blue-400 transition-colors p-1"
                      title="Move to sprint"
                      disabled={availableSprints.length === 0}
                    >
                      <MoveRight className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to delete this task?")) {
                          try {
                            await deleteTask(task.id);
                            toast.success("Task deleted");
                          } catch (error) {
                            console.error("Error deleting task:", error);
                            toast.error("Failed to delete task");
                          }
                        }
                      }}
                      className="text-scrum-text-secondary hover:text-destructive transition-colors p-1"
                      title="Delete task"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {movingTaskId === task.id && availableSprints.length > 0 && (
                  <div className="mt-4 border-t border-scrum-border pt-3">
                    <h5 className="text-sm font-medium mb-2">Move to Sprint:</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableSprints.map(sprint => (
                        <button
                          key={sprint.id}
                          onClick={() => handleMoveToSprint(task.id, sprint.id)}
                          className="text-xs border border-scrum-border rounded px-2 py-1 hover:bg-scrum-accent/20 transition-colors text-left overflow-hidden whitespace-nowrap overflow-ellipsis"
                          title={sprint.title}
                        >
                          {sprint.title}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setMovingTaskId(null)}
                      className="text-xs text-scrum-text-secondary hover:text-white mt-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {isAddingTask && (
        <BacklogTaskForm 
          projectId={project.id}
          onClose={() => setIsAddingTask(false)}
        />
      )}
      
      {editingTask && (
        <EditBacklogTaskForm
          taskId={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
};

const BacklogTaskForm: React.FC<{
  projectId: string;
  onClose: () => void;
}> = ({ projectId, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">("");
  const [assignedTo, setAssignedTo] = useState("");
  const [storyPoints, setStoryPoints] = useState<number | "">("");
  
  const { addTask } = useProjects();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    
    try {
      await addTask({
        title,
        description,
        sprintId: "backlog", // Using "backlog" to indicate it's a backlog item
        status: "backlog",
        assignedTo: assignedTo || undefined,
        priority: priority || undefined,
        storyPoints: typeof storyPoints === 'number' ? storyPoints : undefined
      });
      
      toast.success("Task added to backlog");
      onClose();
    } catch (error) {
      console.error("Error creating backlog task:", error);
      toast.error("Failed to create task");
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Backlog Task</h2>
          <button
            onClick={onClose}
            className="text-scrum-text-secondary hover:text-white"
          >
            <Trash className="h-5 w-5" />
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
              placeholder="e.g. Implement login functionality"
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
              placeholder="Task details and requirements"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 text-sm">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="scrum-input"
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-sm">
                Story Points
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={storyPoints}
                onChange={(e) => {
                  const value = e.target.value;
                  setStoryPoints(value === "" ? "" : parseInt(value));
                }}
                className="scrum-input"
                placeholder="e.g. 5"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm">
              Assigned To
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="scrum-input"
              placeholder="e.g. John Doe"
            />
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
              Add to Backlog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditBacklogTaskForm: React.FC<{
  taskId: string;
  onClose: () => void;
}> = ({ taskId, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">("");
  const [assignedTo, setAssignedTo] = useState("");
  const [storyPoints, setStoryPoints] = useState<number | "">("");
  
  const { getTask, updateTask } = useProjects();
  
  useEffect(() => {
    const task = getTask(taskId);
    
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority || "");
      setAssignedTo(task.assignedTo || "");
      setStoryPoints(task.storyPoints || "");
    }
  }, [taskId, getTask]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    
    try {
      await updateTask(taskId, {
        title,
        description,
        priority: priority || undefined,
        assignedTo: assignedTo || undefined,
        storyPoints: typeof storyPoints === 'number' ? storyPoints : undefined
      });
      
      toast.success("Task updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Edit Backlog Task</h2>
          <button
            onClick={onClose}
            className="text-scrum-text-secondary hover:text-white"
          >
            <Trash className="h-5 w-5" />
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
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="scrum-input"
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-sm">
                Story Points
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={storyPoints}
                onChange={(e) => {
                  const value = e.target.value;
                  setStoryPoints(value === "" ? "" : parseInt(value));
                }}
                className="scrum-input"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm">
              Assigned To
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="scrum-input"
            />
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

export default ProductBacklog;
