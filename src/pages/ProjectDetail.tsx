
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { Sprint } from "@/types";
import SprintCard from "@/components/sprints/SprintCard";
import NewSprintButton from "@/components/sprints/NewSprintButton";

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getSprintsByProject } = useProjects();
  const navigate = useNavigate();
  
  if (!projectId) return null;
  
  const sprints = getSprintsByProject(projectId);
  
  const plannedSprints = sprints.filter(
    (sprint) => sprint.status === "planned"
  );
  const inProgressSprints = sprints.filter(
    (sprint) => sprint.status === "in-progress"
  );
  const completedSprints = sprints.filter(
    (sprint) => sprint.status === "completed"
  );
  
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Sprints</h2>
        <NewSprintButton projectId={projectId} />
      </div>
      
      {sprints.length === 0 ? (
        <div className="bg-scrum-card border border-scrum-border rounded-lg p-8 text-center">
          <p className="text-scrum-text-secondary mb-4">No sprints have been created yet</p>
          <NewSprintButton projectId={projectId} variant="default" size="default" />
        </div>
      ) : (
        <div className="space-y-8">
          {inProgressSprints.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 pl-1">In Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgressSprints.map((sprint) => (
                  <SprintCard key={sprint.id} sprint={sprint} />
                ))}
              </div>
            </div>
          )}
          
          {plannedSprints.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 pl-1">Planned</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plannedSprints.map((sprint) => (
                  <SprintCard key={sprint.id} sprint={sprint} />
                ))}
              </div>
            </div>
          )}
          
          {completedSprints.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 pl-1">Completed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedSprints.map((sprint) => (
                  <SprintCard key={sprint.id} sprint={sprint} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
