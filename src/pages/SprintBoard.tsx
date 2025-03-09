import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useProjects } from "@/context/ProjectContext";
import { Task } from "@/types";
import { toast } from "sonner";
import { Edit, Plus, Loader2, CheckCircle2, XCircle } from "lucide-react";

const SprintBoard: React.FC = () => {
  const { projectId, sprintId } = useParams<{ projectId: string; sprintId: string }>();
  const { 
    getProject, 
    getSprint, 
    getTasksBySprint, 
    updateTask,
  } = useProjects();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  
  const project = getProject(projectId || "");
  const sprint = getSprint(sprintId || "");
  
  useEffect(() => {
    if (!sprintId) return;
    
    setIsLoading(true);
    const fetchedTasks = getTasksBySprint(sprintId);
    setTasks(fetchedTasks);
    setIsLoading(false);
  }, [sprintId, getTasksBySprint]);
  
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
  
  if (!sprint) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Sprint not found</h2>
        <button
          onClick={() => navigate(`/project/${projectId}`)}
          className="scrum-button"
        >
          Go Back to Project
        </button>
      </div>
    );
  }
  
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    const taskId = draggableId;
    const newStatus = destination.droppableId as Task['status'];
    
    try {
      await updateTask(taskId, { status: newStatus });
      
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => {
          if (task.id === taskId) {
            return { ...task, status: newStatus };
          }
          return task;
        });
        return updatedTasks;
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };
  
  const getTasksForColumn = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };
  
  const columnTitles = {
    todo: "To Do",
    'in-progress': "In Progress",
    review: "Review",
    done: "Done"
  };
  
  return (
    <div className="container mx-auto px-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{sprint.title} Board</h2>
          <p className="text-scrum-text-secondary">
            Manage tasks within the sprint
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
      
      {sprint && sprint.status === 'completed' ? (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-md mb-4">
          <p className="text-center">
            This sprint has been completed. Tasks are in read-only mode.
          </p>
        </div>
      ) : null}
      
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-scrum-text-secondary" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {['todo', 'in-progress', 'review', 'done'].map(status => (
              <Droppable droppableId={status} key={status}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`bg-scrum-card rounded-md p-3 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-scrum-background' : ''}`}
                  >
                    <h3 className="font-medium mb-3 text-sm">{columnTitles[status as keyof typeof columnTitles]}</h3>
                    {getTasksForColumn(status as Task['status']).length === 0 && (
                      <div className="text-center text-scrum-text-secondary py-4">
                        No tasks in {columnTitles[status as keyof typeof columnTitles]}
                      </div>
                    )}
                    
                    {getTasksForColumn(status as Task['status']).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-2 rounded-md shadow-sm transition-colors ${snapshot.isDragging ? 'bg-scrum-background' : 'bg-scrum-card'}`}
                          >
                            <TaskCard 
                              task={task} 
                              onEdit={() => setEditingTask(task.id)}
                              isSprintCompleted={sprint.status === 'completed'}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
      
      {isAddingTask && (
        <TaskForm 
          sprintId={sprint.id}
          onClose={() => setIsAddingTask(false)}
        />
      )}
      
      {editingTask && (
        <EditTaskForm
          taskId={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
};

const TaskForm: React.FC<{
  sprintId: string;
  onClose: () => void;
}> = ({ sprintId, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task['status']>("todo");
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
        sprintId,
        status,
        assignedTo: assignedTo || undefined,
        priority: priority || undefined,
        storyPoints: typeof storyPoints === 'number' ? storyPoints : undefined
      });
      
      toast.success("Task added successfully");
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Task</h2>
          <button
            onClick={onClose}
            className="text-scrum-text-secondary hover:text-white"
          >
            <XCircle className="h-5 w-5" />
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
              placeholder="e.g. Implement user authentication"
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
              placeholder="Detailed explanation of the task"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 text-sm">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="scrum-input"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            
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
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
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
                placeholder="e.g. 3"
              />
            </div>
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
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditTaskForm: React.FC<{
  taskId: string;
  onClose: () => void;
}> = ({ taskId, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task['status']>("todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">("");
  const [assignedTo, setAssignedTo] = useState("");
  const [storyPoints, setStoryPoints] = useState<number | "">("");
  
  const { getTask, updateTask } = useProjects();
  
  useEffect(() => {
    const task = getTask(taskId);
    
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
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
        status,
        assignedTo: assignedTo || undefined,
        priority: priority || undefined,
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
          <h2 className="text-xl font-bold">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-scrum-text-secondary hover:text-white"
          >
            <XCircle className="h-5 w-5" />
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
              placeholder="e.g. Implement user authentication"
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
              placeholder="Detailed explanation of the task"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 text-sm">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="scrum-input"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            
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
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
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
                placeholder="e.g. 3"
              />
            </div>
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

import TaskCard from "@/components/tasks/TaskCard";

export default SprintBoard;
