
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { fetchProjectCollaborators } from "@/lib/supabase";
import { Users, Mail } from "lucide-react";
import { Collaborator } from "@/types";

const ProjectTeam: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject } = useProjects();
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [owner, setOwner] = useState<{id: string, username: string, email?: string} | null>(null);
  
  const project = getProject(projectId || "");
  
  useEffect(() => {
    const loadCollaborators = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      try {
        // Get collaborators
        const collaboratorsData = await fetchProjectCollaborators(projectId);
        setCollaborators(collaboratorsData);
        
        // Set owner data if available from project
        if (project?.ownerId && project?.ownerName) {
          setOwner({
            id: project.ownerId,
            username: project.ownerName,
            email: undefined
          });
        }
      } catch (error) {
        console.error("Error loading team data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCollaborators();
  }, [projectId, project]);
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">Loading team information...</div>
      </div>
    );
  }
  
  const getRoleBadgeClass = (role: string) => {
    switch(role) {
      case 'scrum_master':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case 'product_owner':
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case 'team_member':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-400";
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Team</h2>
      
      <div className="space-y-4">
        <div className="scrum-card p-6">
          <h3 className="text-lg font-semibold mb-4">Project Owner</h3>
          {owner ? (
            <div className="flex items-center gap-3 p-3 bg-background rounded-md border border-border">
              <div className="h-10 w-10 bg-accent/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold">{owner.username.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="font-medium">{owner.username}</div>
                {owner.email && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    <span>{owner.email}</span>
                  </div>
                )}
                <div className="text-xs px-2 py-1 rounded-full inline-block bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 mt-1">
                  Owner
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Owner information not available</div>
          )}
        </div>
        
        <div className="scrum-card p-6">
          <h3 className="text-lg font-semibold mb-4">Team Members</h3>
          {collaborators.length > 0 ? (
            <div className="space-y-3">
              {collaborators.map(collab => (
                <div key={collab.id} className="flex items-center gap-3 p-3 bg-background rounded-md border border-border">
                  <div className="h-10 w-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold">{collab.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{collab.username}</div>
                    {collab.email && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        <span>{collab.email}</span>
                      </div>
                    )}
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${getRoleBadgeClass(collab.role)} mt-1`}>
                      {collab.role === 'scrum_master' ? 'Scrum Master' : 
                       collab.role === 'product_owner' ? 'Product Owner' : 
                       'Team Member'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No team members yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTeam;
