
import React from "react";
import { useProjects } from "@/context/ProjectContext";
import { Edit, Trash, AlertTriangle, Star } from "lucide-react";
import { Task } from "@/types";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  isSprintCompleted?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, isSprintCompleted = false }) => {
  const { deleteTask } = useProjects();

  const getPriorityBadge = () => {
    if (!task.priority) return null;
    
    let color = "";
    let icon = null;
    
    switch (task.priority) {
      case "high":
        color = "bg-destructive/80 text-white";
        icon = <AlertTriangle className="h-3 w-3" />;
        break;
      case "medium":
        color = "bg-orange-500/80 text-white";
        icon = <Star className="h-3 w-3" />;
        break;
      case "low":
        color = "bg-blue-500/80 text-white";
        break;
      default:
        return null;
    }
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${color}`}>
        {icon}
        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
      </span>
    );
  };
  
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(task.id);
        toast.success("Task deleted successfully");
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error("Failed to delete task");
      }
    }
  };
  
  return (
    <div className="bg-scrum-background border border-scrum-border rounded-md p-3 hover:border-scrum-highlight transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
        
        {!isSprintCompleted && (
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={onEdit}
              className="text-scrum-text-secondary hover:text-white transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="text-scrum-text-secondary hover:text-destructive transition-colors"
            >
              <Trash className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      
      {task.description && (
        <p className="text-scrum-text-secondary text-xs mb-2 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {getPriorityBadge()}
        
        {task.storyPoints && (
          <span className="bg-scrum-accent/30 text-xs px-2 py-0.5 rounded-full">
            {task.storyPoints} {task.storyPoints === 1 ? "point" : "points"}
          </span>
        )}
        
        {task.assignedTo && (
          <span className="bg-scrum-card text-xs px-2 py-0.5 rounded-full">
            {task.assignedTo}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
