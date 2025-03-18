import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Edit, Trash, CheckCircle, AlertTriangle, Plus, User } from "lucide-react";
import { toast } from "sonner";
import TaskCard from "@/components/tasks/TaskCard";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { ProjectRole, Collaborator } from "@/types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const SprintBoard: React.FC = () => {
  const { sprintId } = useParams<{ sprintId: string }>();
  const { updateSprint, updateTask } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [sprint, setSprint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const [tasks, setTasks] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  
  useEffect(() => {
    const fetchSprintData = async () => {
      if (!sprintId) return;
      
      try {
        console.log("Fetching sprint data for sprint ID:", sprintId);
        
        const { data: sprintData, error: sprintError } = await supabase
          .from('sprints')
          .select('*')
          .eq('id', sprintId)
          .single();
          
        if (sprintError) {
          console.error("Error fetching sprint:", sprintError);
          throw sprintError;
        }
        
        if (!sprintData) {
          console.error("Sprint not found");
          throw new Error('Sprint not found');
        }
        
        console.log("Sprint data fetched:", sprintData);
        setSprint(sprintData);
        setProjectId(sprintData.project_id);
        
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('sprint_id', sprintId);
          
        if (tasksError) throw tasksError;
        
        console.log("Tasks data fetched:", tasksData || []);
        setTasks(tasksData || []);
        
        const initialColumns: {[key: string]: {title: string, taskIds: string[]}} = {
          "todo": { title: "TO DO", taskIds: [] },
          "in-progress": { title: "IN PROGRESS", taskIds: [] },
          "done": { title: "DONE", taskIds: [] }
        };
        
        tasksData?.forEach(task => {
          if (initialColumns[task.status]) {
            initialColumns[task.status].taskIds.push(task.id);
          } else {
            initialColumns.todo.taskIds.push(task.id);
          }
        });
        
        setColumns(initialColumns);
        
        if (user) {
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', sprintData.project_id)
            .single();
            
          if (projectError) {
            console.error("Error fetching project:", projectError);
          } else if (projectData && projectData.owner_id === user.id) {
            console.log("User is project owner");
            setIsOwner(true);
            setUserRole('admin');
          } else {
            const { data: collaboratorData, error: collaboratorError } = await supabase
              .from('collaborators')
              .select('role')
              .eq('project_id', sprintData.project_id)
              .eq('user_id', user.id)
              .single();
              
            if (collaboratorError) {
              console.error("Error checking collaborator status:", collaboratorError);
            } else if (collaboratorData) {
              console.log("User is a collaborator with role:", collaboratorData.role);
              setUserRole(collaboratorData.role as ProjectRole);
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching sprint data:', error);
        setIsLoading(false);
      }
    };
    
    fetchSprintData();
  }, [sprintId, user]);

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
        const { error } = await supabase
          .from('tasks')
          .update({ status: destination.droppableId })
          .eq('id', draggableId);
          
        if (error) throw error;
        
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === draggableId ? { ...task, status: destination.droppableId } : task
          )
        );
        
        try {
          await updateTask(draggableId, {
            status: destination.droppableId
          });
        } catch (contextError) {
          console.log("Context update failed but Supabase update succeeded:", contextError);
        }
        
        if (destination.droppableId === "done") {
          const allTasks = tasks;
          const remainingTasks = allTasks.filter(
            task => task.id !== draggableId && task.status !== "done"
          );
          
          if (remainingTasks.length === 0 && sprint?.status === "in-progress") {
            if (window.confirm("All tasks are completed! Would you like to mark this sprint as completed?")) {
              await updateSprint(sprint.id, { status: "completed" });
              toast.success("Sprint marked as completed!");
            }
          }
        }
      } catch (error) {
        console.error("Error updating task status:", error);
        toast.error("Failed to update task status");
        
        setColumns({
          ...columns,
          [source.droppableId]: {
            ...sourceColumn,
            taskIds: Array.from(sourceColumn.taskIds),
          },
          [destination.droppableId]: {
            ...destColumn,
            taskIds: Array.from(destColumn.taskIds).filter(id => id !== draggableId),
          },
        });
      }
    }
  };
  
  const handleCreateTaskInColumn = (columnId: string) => {
    setCreatingTaskInColumn(columnId);
  };
  
  const handleTaskDeleted = (taskId: string) => {
    setColumns(prevColumns => {
      const newColumns = { ...prevColumns };
      
      Object.keys(newColumns).forEach(columnId => {
        const column = newColumns[columnId];
        const taskIndex = column.taskIds.indexOf(taskId);
        
        if (taskIndex !== -1) {
          newColumns[columnId] = {
            ...column,
            taskIds: column.taskIds.filter(id => id !== taskId)
          };
        }
      });
      
      return newColumns;
    });
    
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };
  
  const handleCompleteSprint = async () => {
    if (!isOwner && userRole !== 'admin') {
      toast.error("Only project owners and admins can complete sprints");
      return;
    }

    if (!allTasksCompleted) {
      setIsCompleteDialogOpen(true);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('sprints')
        .update({ status: 'completed' })
        .eq('id', sprint.id);
        
      if (error) throw error;
      
      setSprint({ ...sprint, status: 'completed' });
      toast.success("Sprint marked as completed!");
    } catch (error) {
      console.error("Error completing sprint:", error);
      toast.error("Failed to complete sprint");
    }
  };
  
  const confirmCompleteSprint = async () => {
    try {
      const { error } = await supabase
        .from('sprints')
        .update({ status: 'completed' })
        .eq('id', sprint.id);
        
      if (error) throw error;
      
      setSprint({ ...sprint, status: 'completed' });
      toast.success("Sprint marked as completed!");
      setIsCompleteDialogOpen(false);
    } catch (error) {
      console.error("Error completing sprint:", error);
      toast.error("Failed to complete sprint");
    }
  };
  
  const canAddTasks = isOwner || userRole === 'admin' || userRole === 'member';
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">Loading sprint...</div>
      </div>
    );
  }
  
  if (!sprint) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Sprint not found</h2>
        <p className="text-scrum-text-secondary mb-4">
          Either the sprint doesn't exist or you don't have access to it.
        </p>
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

  return (
    <div className="container mx-auto pb-20 px-4">
      <SprintHeader 
        sprint={sprint}
        onCompleteSprint={handleCompleteSprint}
        allTasksCompleted={allTasksCompleted}
        canComplete={isOwner || userRole === 'admin'}
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
                    {sprint.status !== "completed" && canAddTasks && (
                      <button
                        onClick={() => handleCreateTaskInColumn(columnId)}
                        className="text-scrum-text-secondary hover:text-white transition-colors"
                        title={`Add task to ${column.title}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <Droppable droppableId={columnId} isDropDisabled={sprint.status === "completed" || userRole === 'viewer'}>
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
                              isDragDisabled={sprint.status === "completed" || userRole === 'viewer'}
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
                                    onEdit={canAddTasks ? () => setEditingTask(task.id) : undefined}
                                    isSprintCompleted={sprint.status === "completed"}
                                    onTaskDeleted={handleTaskDeleted}
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
              projectId={projectId || ''}
              initialStatus={creatingTaskInColumn}
              onClose={() => setCreatingTaskInColumn(null)}
              setColumns={setColumns}
              setTasks={setTasks}
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
    description?: string;
    project_id: string;
    start_date: string;
    end_date: string;
    status: 'planned' | 'in-progress' | 'completed';
  };
  onCompleteSprint: () => void;
  allTasksCompleted: boolean;
  canComplete: boolean;
}

const SprintHeader: React.FC<SprintHeaderProps> = ({ 
  sprint, 
  onCompleteSprint,
  allTasksCompleted,
  canComplete
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
          {formatDateRange(sprint.start_date, sprint.end_date)}
        </div>
      </div>
      
      <div>
        {sprint.status !== "completed" && canComplete && (
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
  projectId: string;
  initialStatus: string;
  onClose: () => void;
  setColumns: React.Dispatch<React.SetStateAction<{[key: string]: {title: string, taskIds: string[]}}>>;
  setTasks: React.Dispatch<React.SetStateAction<any[]>>;
}> = ({ sprintId, projectId, initialStatus, onClose, setColumns, setTasks }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [storyPoints, setStoryPoints] = useState<number>(1);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [projectOwner, setProjectOwner] = useState<{id: string, username: string} | null>(null);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(true);
  
  const { addTask, getSprint } = useProjects();
  const { user } = useAuth();
  const sprint = getSprint(sprintId);
  
  useEffect(() => {
    const fetchCollaborators = async () => {
      setIsLoadingCollaborators(true);
      try {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('owner_id, title')
          .eq('id', projectId)
          .single();
          
        if (projectError) throw projectError;
        
        if (projectData) {
          const { data: ownerData, error: ownerError } = await supabase
            .from('users')
            .select('id, username')
            .eq('id', projectData.owner_id)
            .single();
            
          if (!ownerError && ownerData) {
            setProjectOwner(ownerData);
          }
        }
        
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
        
        if (user) {
          if (projectOwner && projectOwner.id === user.id) {
            setAssignedTo(projectOwner.username);
          } else {
            const currentUserAsCollaborator = formattedCollaborators.find(c => c.userId === user.id);
            if (currentUserAsCollaborator) {
              setAssignedTo(currentUserAsCollaborator.username);
            }
          }
        }
        
      } catch (error) {
        console.error("Error fetching collaborators:", error);
      } finally {
        setIsLoadingCollaborators(false);
      }
    };
    
    if (projectId) {
      fetchCollaborators();
    }
  }, [projectId, user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    
    if (!description.trim()) {
      toast.error("Task description is required");
      return;
    }
    
    if (!storyPoints || storyPoints < 1) {
      toast.error("Task must have at least 1 story point");
      return;
    }
    
    if (!sprint) {
      toast.error("Sprint not found");
      return;
    }
    
    try {
      const newTask = await addTask({
        title,
        description,
        sprintId,
        projectId: sprint.projectId,
        status: initialStatus as any,
        assignedTo: assignedTo,
        priority: priority,
        storyPoints: storyPoints
      });
      
      setColumns(prevColumns => {
        const column = prevColumns[initialStatus];
        if (column) {
          return {
            ...prevColumns,
            [initialStatus]: {
              ...column,
              taskIds: [...column.taskIds, newTask.id]
            }
          };
        }
        return prevColumns;
      });
      
      setTasks(prevTasks => [...prevTasks, newTask]);
      
      toast.success("Task created successfully");
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    }
  };
  
  const assigneeOptions = [
    ...(projectOwner ? [{ id: projectOwner.id, name: projectOwner.username }] : []),
    ...collaborators.map(collab => ({ 
      id: collab.userId,
      name: collab.username 
    }))
  ];
  
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
            Description <span className="text-destructive">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="scrum-input"
            placeholder="Task details and requirements"
            rows={3}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm">
              Priority <span className="text-destructive">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
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
                setStoryPoints(value < 1 ? 1 : value);
              }}
              className="scrum-input"
              placeholder="e.g. 5"
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 text-sm">
            Assigned To <span className="text-destructive">*</span>
          </label>
          {isLoadingCollaborators ? (
            <div className="scrum-input flex items-center">
              <div className="h-5 w-5 mr-2 rounded-full bg-scrum-accent/30 animate-pulse"></div>
              <span className="text-scrum-text-secondary">Loading collaborators...</span>
            </div>
          ) : (
            <Select 
              value={assignedTo} 
              onValueChange={setAssignedTo}
              required
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
            Create Task
          </button>
        </div>
      </form>
    </>
  );
};

export default SprintBoard;
