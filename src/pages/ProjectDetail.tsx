
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import SprintCard from "@/components/sprints/SprintCard";
import NewSprintButton from "@/components/sprints/NewSprintButton";
import { X, Edit } from "lucide-react";
import { toast } from "sonner";

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, getSprintsByProject, getSprint, updateSprint, deleteSprint } = useProjects();
  const navigate = useNavigate();
  
  const [editingSprint, setEditingSprint] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"planned" | "in-progress" | "completed">("planned");
  
  const project = getProject(projectId || "");
  const sprints = getSprintsByProject(projectId || "");
  
  // Redirect if project not found
  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Project not found</h2>
        <button
          onClick={() => navigate("/projects")}
          className="scrum-button"
        >
          Go to Projects
        </button>
      </div>
    );
  }
  
  const handleEditClick = (sprintId: string) => {
    const sprint = getSprint(sprintId);
    if (sprint) {
      setTitle(sprint.title);
      setDescription(sprint.description);
      setStartDate(sprint.startDate);
      setEndDate(sprint.endDate);
      setStatus(sprint.status);
      setEditingSprint(sprintId);
    }
  };
  
  const handleUpdateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSprint) return;
    
    try {
      await updateSprint(editingSprint, {
        title,
        description,
        startDate,
        endDate,
        status,
      });
      
      toast.success("Sprint updated successfully");
      setEditingSprint(null);
    } catch (error) {
      toast.error("Failed to update sprint");
      console.error(error);
    }
  };
  
  const handleDeleteSprint = async () => {
    if (!editingSprint) return;
    
    if (window.confirm("Are you sure you want to delete this sprint?")) {
      try {
        await deleteSprint(editingSprint);
        toast.success("Sprint deleted successfully");
        setEditingSprint(null);
      } catch (error) {
        toast.error("Failed to delete sprint");
        console.error(error);
      }
    }
  };
  
  const handleViewSprintBoard = (sprintId: string) => {
    navigate(`/projects/${project.id}/sprint/${sprintId}`);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Sprints</h2>
        {projectId && <NewSprintButton projectId={projectId} />}
      </div>

      {sprints.length === 0 ? (
        <div className="text-center py-12 bg-scrum-card border border-scrum-border rounded-lg">
          <p className="text-scrum-text-secondary mb-4">No sprints created yet</p>
          {projectId && <div className="flex justify-center"><NewSprintButton projectId={projectId} /></div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.map((sprint) => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              onEdit={() => handleEditClick(sprint.id)}
              onViewBoard={() => handleViewSprintBoard(sprint.id)}
            />
          ))}
        </div>
      )}
      
      {/* Edit Sprint Modal */}
      {editingSprint && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Edit className="h-4 w-4" />
                <span>Edit Sprint</span>
              </h2>
              <button
                onClick={() => setEditingSprint(null)}
                className="text-scrum-text-secondary hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSprint}>
              <div className="mb-4">
                <label className="block mb-2 text-sm">
                  Sprint Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="scrum-input"
                  required
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
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2 text-sm">
                    Start Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="scrum-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm">
                    End Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="scrum-input"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block mb-2 text-sm">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="scrum-input"
                >
                  <option value="planned">Planned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDeleteSprint}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                >
                  Delete Sprint
                </button>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSprint(null)}
                    className="scrum-button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="scrum-button"
                  >
                    Update Sprint
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
