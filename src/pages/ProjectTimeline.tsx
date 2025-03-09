
import React from "react";
import { useParams } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { Calendar } from "lucide-react";

const ProjectTimeline: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, getSprintsByProject } = useProjects();
  
  const project = getProject(projectId || "");
  const sprints = getSprintsByProject(projectId || "");
  
  // Sort sprints by start date
  const sortedSprints = [...sprints].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  
  if (!project) {
    return <div className="text-center py-12">Project not found</div>;
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success";
      case "in-progress":
        return "bg-blue-500";
      default:
        return "bg-scrum-accent";
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Project Timeline</h2>
      
      {sortedSprints.length === 0 ? (
        <div className="text-center py-12 bg-scrum-card border border-scrum-border rounded-lg">
          <p className="text-scrum-text-secondary">No sprints created yet</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="relative overflow-x-auto">
            <div className="min-w-[768px]">
              <div className="flex items-center mb-4">
                <div className="w-1/4 pr-4">
                  <h3 className="text-sm font-medium">Sprint</h3>
                </div>
                <div className="w-3/4 bg-scrum-card rounded-md p-2">
                  <h3 className="text-sm font-medium">Timeline</h3>
                </div>
              </div>
              
              {sortedSprints.map((sprint) => {
                const startDate = new Date(sprint.startDate);
                const endDate = new Date(sprint.endDate);
                const duration = differenceInDays(endDate, startDate) + 1;
                
                // Find the earliest and latest dates across all sprints
                const earliestDate = new Date(sortedSprints[0].startDate);
                const latestDate = new Date(
                  sortedSprints[sortedSprints.length - 1].endDate
                );
                
                // Calculate the total timeline duration
                const totalDuration = differenceInDays(latestDate, earliestDate) + 1;
                
                // Calculate the position and width of the sprint bar
                const offsetDays = differenceInDays(startDate, earliestDate);
                const offsetPercentage = (offsetDays / totalDuration) * 100;
                const widthPercentage = (duration / totalDuration) * 100;
                
                return (
                  <div key={sprint.id} className="flex items-center mb-6">
                    <div className="w-1/4 pr-4">
                      <div className="mb-1">
                        <span className="font-medium">{sprint.title}</span>
                        <span className={`ml-2 inline-block w-3 h-3 rounded-full ${getStatusColor(sprint.status)}`}></span>
                      </div>
                      <div className="flex items-center text-xs text-scrum-text-secondary">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {format(new Date(sprint.startDate), "MMM d")} - {format(new Date(sprint.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-3/4 bg-scrum-card rounded-md p-2 relative h-12">
                      <div 
                        className={`absolute top-2 bottom-2 rounded-md ${getStatusColor(sprint.status)}`}
                        style={{ 
                          left: `${offsetPercentage}%`, 
                          width: `${widthPercentage}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Sprints Overview</h3>
            <div className="space-y-4">
              {sortedSprints.map((sprint) => (
                <div key={sprint.id} className="p-4 bg-scrum-card border border-scrum-border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{sprint.title}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full text-white ${getStatusColor(sprint.status)}`}>
                      {sprint.status === "in-progress" ? "In Progress" : 
                        sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-scrum-text-secondary mb-3">
                    {sprint.description}
                  </p>
                  
                  <div className="flex items-center text-xs text-scrum-text-secondary">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {format(new Date(sprint.startDate), "MMMM d, yyyy")} - {format(new Date(sprint.endDate), "MMMM d, yyyy")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTimeline;
