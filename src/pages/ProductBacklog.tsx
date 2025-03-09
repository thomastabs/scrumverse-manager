
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Plus, Send, Package, ArrowRight, Trash } from "lucide-react";
import { toast } from "sonner";
import TaskCard from "@/components/tasks/TaskCard";
import EditTaskModal from "@/components/tasks/EditTaskModal";

const ProductBacklog: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, getSprintsByProject, getTasksBySprint, addTask, updateTask } = useProjects();
  const navigate = useNavigate();
  
  const [backlogTasks, setBacklogTasks] = useState<any[]>([]);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [movingTask, setMovingTask] = useState<string | null>(null);
  
  const project = projectId ? getProject(projectId) : undefined;
  const sprints = projectId ? getSprintsByProject(projectId) : [];
  const availableSprints = sprints.filter(sprint => sprint.status !== "completed");
  
  // Fetch all backlog tasks
  useEffect(() => {
    if (!projectId) return;
    
    // Find or create a virtual backlog sprint to hold backlog tasks
    const tasks = getTasksBySprint("backlog");
    setBacklogTasks(tasks.filter(task => task.status === "backlog"));
  }, [projectId, getTasksBySprint]);
  
  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId && 
      destination.index === source.index
    ) {
      return;
    }
    
    try {
      // Update the task status
      await updateTask(draggableId, {
        status: destination.droppableId === "backlog" ? "backlog" : destination.droppableId
      });
      
      // Refresh backlog tasks
      const tasks = getTasksBySprint("backlog");
      setBacklogTasks(tasks.filter(task => task.status === "backlog"));
      
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };
  
  const handleMoveToSprint = async (taskId: string, sprintId: string) => {
    if (!taskId || !sprintId) return;
    
    try {
      await updateTask(taskId, {
        sprintId,
        status: "todo"  // Default to todo when moving to a sprint
      });
      
      toast.success("Task moved to sprint");
      setMovingTask(null);
      
      // Refresh backlog tasks
      const tasks = getTasksBySprint("backlog");
      setBacklogTasks(tasks.filter(task => task.status === "backlog"));
    } catch (error) {
      console.error("Error moving task to sprint:", error);
      toast.error("Failed to move task to sprint");
    }
  };
  
  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Project not found</h2>
        <button
          onClick={() => navigate("/projects")}
          className="scrum-button"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Product Backlog</h2>
          <p className="text-scrum-text-secondary">
            Manage your project's backlog items and move them to sprints
          </p>
        </div>
        
        <button
          onClick={() => setIsAddingTask(true)}
          className="scrum-button flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          <span>Add Backlog Item</span>
        </button>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="bg-scrum-card border border-scrum-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="text-scrum-text-secondary h-5 w-5" />
            <h3 className="font-medium">Backlog Items</h3>
          </div>
          
          <Droppable droppableId="backlog">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-[200px] ${snapshot.isDraggingOver ? "bg-scrum-accent/10" : ""}`}
              >
                {backlogTasks.length === 0 ? (
                  <div className="text-center py-8 text-scrum-text-secondary">
                    <p>No items in the backlog</p>
                    <p className="text-sm mt-2">
                      Add tasks to your backlog to plan future work
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {backlogTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${snapshot.isDragging ? "opacity-70" : ""}`}
                          >
                            <div className="flex items-center">
                              <div className="flex-1">
                                <TaskCard
                                  task={task}
                                  onEdit={() => setEditingTask(task.id)}
                                  isSprintCompleted={false}
                                />
                              </div>
                              
                              <button
                                onClick={() => setMovingTask(task.id)}
                                className="ml-2 text-scrum-text-secondary hover:text-white transition-colors p-1"
                                title="Move to Sprint"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
      
      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          taskId={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
      
      {/* Add New Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg animate-fade-up">
            <NewBacklogTaskForm 
              projectId={projectId || ""}
              onClose={() => setIsAddingTask(false)}
            />
          </div>
        </div>
      )}
      
      {/* Move Task to Sprint Modal */}
      {movingTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Move to Sprint</h2>
              <button
                onClick={() => setMovingTask(null)}
                className="text-scrum-text-secondary hover:text-white"
              >
                <Trash className="h-5 w-5" />
              </button>
            </div>
            
            {availableSprints.length === 0 ? (
              <div className="text-center py-6">
                <p className="mb-4">No active sprints available</p>
                <button
                  onClick={() => setMovingTask(null)}
                  className="scrum-button"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-scrum-text-secondary">Select a sprint to move this task to:</p>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {availableSprints.map(sprint => (
                    <button
                      key={sprint.id}
                      onClick={() => handleMoveToSprint(movingTask, sprint.id)}
                      className="w-full text-left p-3 bg-scrum-background rounded-md border border-scrum-border hover:border-scrum-accent transition-colors"
                    >
                      <div className="font-medium">{sprint.title}</div>
                      <div className="text-xs text-scrum-text-secondary mt-1">
                        {new Date(sprint.startDate).toLocaleDateString()} to {new Date(sprint.endDate).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setMovingTask(null)}
                    className="scrum-button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// New Backlog Task Form Component
const NewBacklogTaskForm: React.FC<{
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
        sprintId: "backlog", // We use "backlog" as a virtual sprint ID
        status: "backlog",
        assignedTo: assignedTo || undefined,
        priority: priority || undefined,
        storyPoints: typeof storyPoints === 'number' ? storyPoints : undefined
      });
      
      toast.success("Task created successfully");
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    }
  };
  
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Add Backlog Item</h2>
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
            Create Task
          </button>
        </div>
      </form>
    </>
  );
};

export default ProductBacklog;
