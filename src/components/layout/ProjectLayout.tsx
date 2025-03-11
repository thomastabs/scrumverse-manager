import React, { useState, useEffect } from "react";
import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import NavLink from "@/components/ui/NavLink";
import { ArrowLeft, LayoutGrid, List, LineChart, Edit, Trash, Package, Users } from "lucide-react";
import { toast } from "sonner";
import { fetchProjectCollaborators } from "@/lib/supabase";
import { Collaborator } from "@/types";

const ProjectLayout: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, deleteProject } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOwner, setIsOwner] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const project = getProject(projectId || "");
  
  useEffect(() => {
    const checkProjectAccess = async () => {
      if (!project || !user) return;
      
      // Check if user is owner
      if (project.ownerId === user.id) {
        setIsOwner(true);
        return;
      }
      
      // Otherwise check collaborator role
      try {
        const collaborators = await fetchProjectCollaborators(project.id);
        const userCollaboration = collaborators.find(c => c.userId === user.id);
        
        if (userCollaboration) {
          setUserRole(userCollaboration.role);
        }
      } catch (error) {
        console.error("Error checking project access:", error);
      }
    };
    
    checkProjectAccess();
  }, [project, user]);
  
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <button 
            onClick={() => navigate("/")}
            className="scrum-button"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(project.id);
        toast.success("Project deleted successfully");
        navigate("/projects");
      } catch (error) {
        toast.error("Failed to delete project");
        console.error(error);
      }
    }
  };
  
  // Check if the user can edit the project
  const canEditProject = isOwner || userRole === 'admin';
  
  // Check if the user can access backlog
  const canAccessBacklog = isOwner || userRole === 'admin';
  
  return (
    <div className="pt-16 min-h-screen animate-fade-in">
      <div className="px-6 py-4">
        <button 
          onClick={() => navigate("/projects")}
          className="flex items-center gap-1 text-scrum-text-secondary hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </button>
        
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {project.title}
              {canEditProject && (
                <>
                  <button 
                    onClick={() => navigate(`/projects/${project.id}/edit`)}
                    className="text-scrum-text-secondary hover:text-white transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="text-scrum-text-secondary hover:text-destructive transition-colors"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </>
              )}
            </h1>
            <p className="text-scrum-text-secondary">{project.description}</p>
          </div>
        </div>
        
        {project.endGoal && (
          <div className="mb-4">
            <p className="text-xs text-scrum-text-secondary">End goal:</p>
            <p>{project.endGoal}</p>
          </div>
        )}
        
        <div className="flex gap-2 mb-4 bg-scrum-card rounded-md border border-scrum-border p-1 w-fit">
          <NavLink to={`/projects/${project.id}`} end={true}>
            <LayoutGrid className="h-4 w-4 mr-1" />
            <span>Sprints</span>
          </NavLink>
          
          {canAccessBacklog && (
            <NavLink to={`/projects/${project.id}/backlog`}>
              <Package className="h-4 w-4 mr-1" />
              <span>Product Backlog</span>
            </NavLink>
          )}
          
          <NavLink to={`/projects/${project.id}/timeline`}>
            <List className="h-4 w-4 mr-1" />
            <span>Timeline</span>
          </NavLink>
          
          <NavLink to={`/projects/${project.id}/burndown`}>
            <LineChart className="h-4 w-4 mr-1" />
            <span>Burndown Chart</span>
          </NavLink>
          
          {isOwner && (
            <NavLink to={`/projects/${project.id}/collaborators`}>
              <Users className="h-4 w-4 mr-1" />
              <span>Collaborators</span>
            </NavLink>
          )}
        </div>
        
        {userRole && (
          <div className="text-xs text-scrum-text-secondary mb-2">
            You have {userRole} access to this project
          </div>
        )}
      </div>
      
      <main className="px-6 py-2 pb-20">
        <Outlet />
      </main>
    </div>
  );
};

export default ProjectLayout;
