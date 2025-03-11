
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Edit, Trash, Play, CheckCircle, AlertTriangle, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import TaskCard from "@/components/tasks/TaskCard";
import EditTaskModal from "@/components/tasks/EditTaskModal";

const SprintBoard: React.FC = () => {
  const { sprintId } = useParams<{ sprintId: string }>();
  const { getSprint, getTasksBySprint, updateSprint, updateTask } = useProjects();
  const navigate = useNavigate();
  
  const [columns, setColumns] = useState<{[key: string]: {title: string, taskIds: string[]}}>(
    {
      "todo": { title: "TO DO", taskIds: [] },
      "in-progress": { title: "IN PROGRESS", taskIds: [] },
      "done": { title: "DONE", taskIds: [] }
    }
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(["todo", "in-progress", "done"]);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [creatingTaskInColumn, setCreatingTaskInColumn] = useState<string | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  
  const sprint = getSprint(sprintId || "");
  const tasks = getTasksBySprint(sprintId || "");
  
  useEffect(() => {
    if (!sprint) return;
    
    const initialColumns: {[key: string]: {title: string, taskIds: string[]}} = {};
    
    ["todo", "in-progress", "done"].forEach(colId => {
      initialColumns[colId] = {
        title: colId === "todo" ? "TO DO" : 
               colId === "in-progress" ? "IN PROGRESS" : 
               "DONE",
        taskIds: []
      };
    });
    
    tasks.forEach(task => {
      if (initialColumns[task.status]) {
        initialColumns[task.status].taskIds.push(task.id);
      } else {
        initialColumns["todo"].taskIds.push(task.id);
      }
    });
    
    setColumns(initialColumns);
    setColumnOrder(["todo", "in-progress", "done"]);
  }, [sprint, tasks]);
  
  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId && 
      destination.index === source.index
    ) {
      return;
    }
    
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    
    if (source.droppableId === destination.droppableId) {
      const newTaskIds = Array.from(sourceColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      
      const newColumn = {
        ...sourceColumn,
        taskIds: newTaskIds,
      };
      
      setColumns({
        ...columns,
        [source.droppableId]: newColumn,
      });
    } 
    else {
      const sourceTaskIds = Array.from(sourceColumn.taskIds);
      sourceTaskIds.splice(source.index, 1);
      
      const destTaskIds = Array.from(destColumn.taskIds);
      destTaskIds.splice(destination.index, 0, draggableId);
      
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          taskIds: sourceTaskIds,
        },
        [destination.droppableId]: {
          ...destColumn,
          taskIds: destTaskIds,
        },
      });
      
      try {
        await updateTask(draggableId, {
          status: destination.droppableId
        });
        
        if (destination.droppableId === "done") {
          const allTasks = tasks;
          const remainingTasks = allTasks.filter(
            task => task.id !== draggableId && task.status !== "done"
          );
          
          if (remainingTasks.length === 0 && sprint?.status === "in-progress") {
            if (window.confirm("All tasks are completed! Would you like to mark this sprint as completed?")) {
              await updateSprint(sprint.id, { status: "completed" });
              toast({
                title: "Success",
                description: "Sprint marked as completed!",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error updating task status:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update task status",
        });
      }
    }
  };
  
  const handleCreateTaskInColumn = (columnId: string) => {
    setCreatingTaskInColumn(columnId);
  };
  
  const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.status === "done");
  
  const handleCompleteSprint = async () => {
    if (!allTasksCompleted) {
      setIsCompleteDialogOpen(true);
      return;
    }
    
    try {
      await updateSprint(sprint.id, { status: "completed" });
      toast({
        title: "Success",
        description: "Sprint marked as completed!",
      });
    } catch (error) {
      console.error("Error completing sprint:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete sprint",
      });
    }
  };
  
  const confirmCompleteSprint = async () => {
    try {
      await updateSprint(sprint.id, { status: "completed" });
      toast({
        title: "Success",
        description: "Sprint marked as completed!",
      });
      setIsCompleteDialogOpen(false);
    } catch (error) {
      console.error("Error completing sprint:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete sprint",
      });
    }
  };
  
  if (!sprint) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Sprint not found</h2>
        <button
          onClick={() => navigate(-1)}
          className="scrum-button"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto pb-20 px-4">
      <SprintHeader 
        sprint={sprint}
        onCompleteSprint={handleCompleteSprint}
        allTasksCompleted={allTasksCompleted}
      />
      
      <div className="flex items-center justify-between mb-4 mt-8">
        <h3 className="text-lg font-medium">Sprint Board</h3>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 pb-4 overflow-x-auto">
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            
            if (!column) return null;
            
            const columnTasks = column.taskIds.map(taskId => 
              tasks.find(task => task.id === taskId)
            ).filter(Boolean);
            
            return (
              <div key={columnId} className="min-w-[270px] max-w-[270px] flex-shrink-0">
                <div className="bg-scrum-card border border-scrum-border rounded-md h-full flex flex-col">
                  <div className="flex items-center justify-between p-3 border-b border-scrum-border">
                    <h4 className="font-medium text-sm">{column.title}</h4>
                    {sprint.status !== "completed" && (
                      <button
                        onClick={() => handleCreateTaskInColumn(columnId)}
                        className="text-scrum-text-secondary hover:text-white transition-colors"
                        title={`Add task to ${column.title}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <Droppable droppableId={columnId} isDropDisabled={sprint.status === "completed"}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 flex-1 min-h-[300px] overflow-y-auto ${snapshot.isDraggingOver ? "bg-scrum-accent/10" : ""}`}
                      >
                        {columnTasks.map((task, index) => (
                          task && (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={sprint.status === "completed"}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-2 transition-transform duration-200 ${snapshot.isDragging ? "scale-105 shadow-lg opacity-90 z-10" : ""}`}
                                >
                                  <TaskCard
                                    task={task}
                                    onEdit={() => setEditingTask(task.id)}
                                    isSprintCompleted={sprint.status === "completed"}
                                  />
                                </div>
                              )}
                            </Draggable>
                          )
                        ))}
                        {provided.placeholder}
                        
                        {columnTasks.length === 0 && (
                          <div className="text-center py-4 text-scrum-text-secondary text-sm italic">
                            No tasks
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>
      
      {editingTask && (
        <EditTaskModal
          taskId={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
      
      {creatingTaskInColumn && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg animate-fade-up">
            <NewTaskForm 
              sprintId={sprint.id}
              initialStatus={creatingTaskInColumn}
              onClose={() => setCreatingTaskInColumn(null)}
            />
          </div>
        </div>
      )}
      
      {isCompleteDialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-md animate-fade-up">
            <div className="mb-6 flex items-start gap-3">
              <AlertTriangle className="text-yellow-500 h-5 w-5 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Complete Sprint</h3>
                <p className="text-scrum-text-secondary">
                  Not all tasks are in the "DONE" column. Do you still want to complete this sprint?
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsCompleteDialogOpen(false)}
                className="scrum-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmCompleteSprint}
                className="scrum-button-warning"
              >
                Complete Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SprintHeaderProps {
  sprint: {
    id: string;
    title: string;
    description: string;
    projectId: string;
    startDate: string;
    endDate: string;
    status: 'planned' | 'in-progress' | 'completed';
  };
  onCompleteSprint: () => void;
  allTasksCompleted: boolean;
}

const SprintHeader: React.FC<SprintHeaderProps> = ({ 
  sprint, 
  onCompleteSprint,
  allTasksCompleted
}) => {
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };
  
  return (
    <div className="flex items-center justify-between p-4 border-b border-scrum-border">
      <div>
        <h1 className="font-bold text-xl">{sprint.title}</h1>
        <div className="text-sm text-scrum-text-secondary">
          {formatDateRange(sprint.startDate, sprint.endDate)}
        </div>
      </div>
      
      <div>
        {sprint.status !== "completed" && (
          <button
            onClick={onCompleteSprint}
            className={`flex items-center gap-1 ${allTasksCompleted ? 'scrum-button-success' : 'scrum-button-warning'}`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Complete Sprint</span>
          </button>
        )}
      </div>
    </div>
  );
};

const NewTaskForm: React.FC<{
  sprintId: string;
  initialStatus: string;
  onClose: () => void;
}> = ({ sprintId, initialStatus, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">("");
  const [assignedTo, setAssignedTo] = useState("");
  const [storyPoints, setStoryPoints] = useState<number | "">("");
  
  const { addTask, getSprint } = useProjects();
  const sprint = getSprint(sprintId);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    
    if (!sprint) {
      toast.error("Sprint not found");
      return;
    }
    
    try {
      await addTask({
        title,
        description,
        sprintId,
        projectId: sprint.projectId,
        status: initialStatus as any,
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
        <h2 className="text-xl font-bold">Create New Task</h2>
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

export default SprintBoard;
