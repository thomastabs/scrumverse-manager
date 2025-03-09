
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Plus, Edit, Trash, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import TaskCard from "@/components/tasks/TaskCard";
import NewTaskButton from "@/components/tasks/NewTaskButton";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import AddColumnModal from "@/components/sprints/AddColumnModal";

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
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  
  const sprint = getSprint(sprintId || "");
  const tasks = getTasksBySprint(sprintId || "");
  
  useEffect(() => {
    if (!sprint) return;
    
    // Initialize columns
    const initialColumns: {[key: string]: {title: string, taskIds: string[]}} = {
      "todo": { title: "TO DO", taskIds: [] },
      "in-progress": { title: "IN PROGRESS", taskIds: [] },
      "done": { title: "DONE", taskIds: [] },
    };
    
    // Group tasks by status
    tasks.forEach(task => {
      if (initialColumns[task.status]) {
        initialColumns[task.status].taskIds.push(task.id);
      } else {
        initialColumns[task.status] = {
          title: task.status.toUpperCase(),
          taskIds: [task.id]
        };
        
        if (!columnOrder.includes(task.status)) {
          setColumnOrder(prev => [...prev, task.status]);
        }
      }
    });
    
    setColumns(initialColumns);
  }, [sprint, tasks, columnOrder]);
  
  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId && 
      destination.index === source.index
    ) {
      return;
    }
    
    // Get source and destination column
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    
    // Moving within the same column
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
    // Moving to a different column
    else {
      // Remove from source column
      const sourceTaskIds = Array.from(sourceColumn.taskIds);
      sourceTaskIds.splice(source.index, 1);
      
      // Add to destination column
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
      
      // Update task status in database
      try {
        await updateTask(draggableId, {
          status: destination.droppableId
        });
        
        // Check if all tasks are in DONE column
        if (destination.droppableId === "done") {
          const allTasks = tasks;
          const remainingTasks = allTasks.filter(
            task => task.id !== draggableId && task.status !== "done"
          );
          
          // If all tasks are now done, prompt to complete the sprint
          if (remainingTasks.length === 0 && sprint?.status !== "completed") {
            if (window.confirm("All tasks are completed! Would you like to mark this sprint as completed?")) {
              await updateSprint(sprint.id, { status: "completed" });
              toast.success("Sprint marked as completed!");
            }
          }
        }
      } catch (error) {
        console.error("Error updating task status:", error);
        toast.error("Failed to update task status");
      }
    }
  };
  
  const handleAddColumn = (columnName: string) => {
    const columnId = columnName.toLowerCase().replace(/\s+/g, '-');
    
    // Check if column already exists
    if (columns[columnId]) {
      toast.error("A column with this name already exists");
      return;
    }
    
    setColumns({
      ...columns,
      [columnId]: {
        title: columnName,
        taskIds: []
      }
    });
    
    setColumnOrder([...columnOrder, columnId]);
    setIsAddColumnModalOpen(false);
    toast.success(`Column "${columnName}" added`);
  };
  
  const handleRemoveColumn = (columnId: string) => {
    // Cannot remove default columns
    if (["todo", "in-progress", "done"].includes(columnId)) {
      toast.error("Cannot remove default columns");
      return;
    }
    
    // Check if column has tasks
    if (columns[columnId]?.taskIds.length > 0) {
      toast.error("Cannot remove a column that contains tasks");
      return;
    }
    
    const newColumns = { ...columns };
    delete newColumns[columnId];
    
    setColumns(newColumns);
    setColumnOrder(columnOrder.filter(id => id !== columnId));
    toast.success("Column removed");
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
  
  const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.status === "done");
  
  const handleCompleteSprint = async () => {
    if (!allTasksCompleted) {
      if (!window.confirm("Not all tasks are completed. Are you sure you want to complete this sprint?")) {
        return;
      }
    }
    
    try {
      await updateSprint(sprint.id, { status: "completed" });
      toast.success("Sprint marked as completed!");
    } catch (error) {
      console.error("Error completing sprint:", error);
      toast.error("Failed to complete sprint");
    }
  };
  
  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{sprint.title}</h2>
            {sprint.status === "completed" && (
              <span className="bg-success text-white text-xs px-2 py-1 rounded-full">
                Completed
              </span>
            )}
          </div>
          <p className="text-scrum-text-secondary">{sprint.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {sprint.status !== "completed" && (
            <>
              <button
                onClick={() => navigate(`/projects/${sprint.projectId}/sprint/${sprint.id}/edit`)}
                className="scrum-button-secondary flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Sprint</span>
              </button>
              
              <button
                onClick={handleCompleteSprint}
                className={`scrum-button ${allTasksCompleted ? "bg-success hover:bg-success/90" : ""}`}
                disabled={sprint.status === "completed"}
              >
                Complete Sprint
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Sprint Board</h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddColumnModalOpen(true)}
            className="scrum-button-secondary flex items-center gap-1 text-sm"
            disabled={sprint.status === "completed"}
          >
            <Plus className="h-4 w-4" />
            <span>Add Column</span>
          </button>
          
          {sprint.status !== "completed" && (
            <NewTaskButton sprintId={sprint.id} initialStatus="in-progress" />
          )}
        </div>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto">
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            
            if (!column) return null;
            
            const columnTasks = column.taskIds.map(taskId => 
              tasks.find(task => task.id === taskId)
            ).filter(Boolean);
            
            return (
              <div key={columnId} className="min-w-[280px]">
                <div className="bg-scrum-card border border-scrum-border rounded-md">
                  <div className="flex items-center justify-between p-3 border-b border-scrum-border">
                    <h4 className="font-medium">{column.title}</h4>
                    {!["todo", "in-progress", "done"].includes(columnId) && (
                      <button
                        onClick={() => handleRemoveColumn(columnId)}
                        className="text-scrum-text-secondary hover:text-destructive transition-colors"
                        disabled={sprint.status === "completed"}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <Droppable droppableId={columnId} isDropDisabled={sprint.status === "completed"}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 min-h-[400px] ${snapshot.isDraggingOver ? "bg-scrum-accent/10" : ""}`}
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
                                  className={`mb-2 ${snapshot.isDragging ? "opacity-75" : ""}`}
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
      
      {isAddColumnModalOpen && (
        <AddColumnModal
          onClose={() => setIsAddColumnModalOpen(false)}
          onAdd={handleAddColumn}
        />
      )}
    </div>
  );
};

export default SprintBoard;
