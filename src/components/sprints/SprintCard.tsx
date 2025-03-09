
import React from "react";
import { format } from "date-fns";
import { Sprint } from "@/types";
import { CalendarDays, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SprintCardProps {
  sprint: Sprint;
  onEdit?: () => void;
  onViewBoard?: () => void;
}

const SprintCard: React.FC<SprintCardProps> = ({ 
  sprint, 
  onEdit,
  onViewBoard 
}) => {
  const navigate = useNavigate();
  
  const getStatusColor = () => {
    switch (sprint.status) {
      case "completed":
        return "bg-success text-white";
      case "in-progress":
        return "bg-blue-500 text-white";
      default:
        return "bg-scrum-accent text-white";
    }
  };
  
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      navigate(`/projects/${sprint.projectId}/sprint/${sprint.id}/edit`);
    }
  };
  
  const handleViewBoard = () => {
    if (onViewBoard) {
      onViewBoard();
    } else {
      navigate(`/projects/${sprint.projectId}/sprint/${sprint.id}`);
    }
  };
  
  return (
    <div className={`scrum-card relative ${sprint.status === "completed" ? "border-green-500/30" : ""}`}>
      {sprint.status === "completed" && (
        <div className="absolute top-2 right-2">
          <span className="bg-success text-white text-xs px-2 py-1 rounded-full">
            Completed
          </span>
        </div>
      )}
      
      <h3 className="text-xl font-bold mb-2">{sprint.title}</h3>
      <p className="text-scrum-text-secondary mb-4 line-clamp-2">{sprint.description}</p>
      
      <div className="flex items-center gap-2 text-scrum-text-secondary mb-4">
        <CalendarDays className="h-4 w-4" />
        <span className="text-sm">
          {format(new Date(sprint.startDate), "MMM d, yyyy")} - {format(new Date(sprint.endDate), "MMM d, yyyy")}
        </span>
      </div>
      
      <div className="flex items-center justify-between gap-2 mt-4">
        <button
          onClick={handleEdit}
          className="scrum-button-secondary flex items-center gap-1"
        >
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </button>
        
        <button
          onClick={handleViewBoard}
          className="scrum-button"
        >
          View Board
        </button>
      </div>
    </div>
  );
};

export default SprintCard;
