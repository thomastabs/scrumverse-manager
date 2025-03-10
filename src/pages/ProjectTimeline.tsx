
import React from "react";
import { useParams } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { Calendar, CheckCircle, Circle, Clock, Users, ListTodo } from "lucide-react";

const ProjectTimeline: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, getSprintsByProject, getTasksBySprint } = useProjects();
  
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
        return "bg-purple-500";
      default:
        return "bg-purple-300";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-purple-500" />;
      default:
        return <Circle className="h-4 w-4 text-purple-300" />;
    }
  };

  // Get task count for a sprint
  const getSprintTaskCount = (sprintId: string) => {
    return getTasksBySprint(sprintId).length;
  };
  
  // Get completed task count for a sprint
  const getCompletedTaskCount = (sprintId: string) => {
    return getTasksBySprint(sprintId).filter(task => task.status === "done").length;
  };
  
  return (
    <div className="container mx-auto px-4">
      <h2 className="text-xl font-bold mb-6">Project Timeline</h2>
      
      {sortedSprints.length === 0 ? (
        <div className="text-center py-12 bg-scrum-card border border-scrum-border rounded-lg">
          <p className="text-scrum-text-secondary">No sprints created yet</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-scrum-card border border-scrum-border p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Sprint Timeline</h3>
            <div className="relative overflow-x-auto">
              <div className="min-w-[768px]">
                <div className="flex mb-8 border-b border-scrum-border pb-2">
                  <div className="w-1/4 font-medium text-sm">Sprint</div>
                  <div className="w-3/4 font-medium text-sm">Duration</div>
                </div>
                
                {sortedSprints.map((sprint, index) => {
                  // Find the earliest and latest dates across all sprints
                  const earliestDate = new Date(sortedSprints[0].startDate);
                  const latestDate = new Date(sortedSprints[sortedSprints.length - 1].endDate);
                  
                  // Calculate the total timeline duration
                  const totalDuration = differenceInDays(latestDate, earliestDate) + 1;
                  
                  // Calculate the position and width of the sprint bar
                  const startDate = new Date(sprint.startDate);
                  const endDate = new Date(sprint.endDate);
                  const offsetDays = differenceInDays(startDate, earliestDate);
                  const duration = differenceInDays(endDate, startDate) + 1;
                  
                  const offsetPercentage = (offsetDays / totalDuration) * 100;
                  const widthPercentage = (duration / totalDuration) * 100;
                  
                  return (
                    <div key={sprint.id} className="flex items-center mb-6">
                      <div className="w-1/4 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(sprint.status)}
                          <span className="font-medium">{sprint.title}</span>
                        </div>
                        <div className="flex items-center text-xs text-purple-400 mb-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>
                            {format(new Date(sprint.startDate), "MMM d")} - {format(new Date(sprint.endDate), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-purple-300">
                          <ListTodo className="h-3 w-3 mr-1" />
                          <span>
                            {getCompletedTaskCount(sprint.id)}/{getSprintTaskCount(sprint.id)} tasks completed
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-3/4 relative h-10 bg-scrum-background rounded-md">
                        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                          <div 
                            className={`absolute h-6 rounded-md ${getStatusColor(sprint.status)}`}
                            style={{ 
                              left: `${offsetPercentage}%`, 
                              width: `${widthPercentage}%`,
                              transition: 'all 0.3s ease'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {sortedSprints.map((sprint) => {
              const totalTasks = getSprintTaskCount(sprint.id);
              const completedTasks = getCompletedTaskCount(sprint.id);
              const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              
              return (
                <div key={sprint.id} className="p-4 bg-scrum-card border border-scrum-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{sprint.title}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full text-white flex items-center gap-1 ${getStatusColor(sprint.status)}`}>
                      {getStatusIcon(sprint.status)}
                      <span>
                        {sprint.status === "in-progress" ? "In Progress" : 
                          sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}
                      </span>
                    </span>
                  </div>
                  
                  <p className="text-sm text-scrum-text-secondary mb-3 line-clamp-2">
                    {sprint.description}
                  </p>
                  
                  <div className="flex items-center text-xs text-purple-400 mb-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {format(new Date(sprint.startDate), "MMMM d, yyyy")} - {format(new Date(sprint.endDate), "MMMM d, yyyy")}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-purple-300">{completedTasks}/{totalTasks} tasks</span>
                      <span className="text-purple-400">{progressPercentage}% completed</span>
                    </div>
                    <div className="w-full bg-scrum-background h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTimeline;
