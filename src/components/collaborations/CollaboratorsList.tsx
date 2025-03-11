
import React, { useState, useEffect } from "react";
import { fetchProjectCollaborators, removeCollaborator, updateCollaboratorRole } from "@/lib/supabase";
import { Collaborator, ProjectRole } from "@/types";
import { Users, UserX, Shield, Edit, X, Check } from "lucide-react";
import { toast } from "sonner";

interface CollaboratorsListProps {
  projectId: string;
  onCollaboratorsChange?: () => void;
}

const CollaboratorsList: React.FC<CollaboratorsListProps> = ({ 
  projectId,
  onCollaboratorsChange = () => {}
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('viewer');
  
  const loadCollaborators = async () => {
    setLoading(true);
    try {
      const data = await fetchProjectCollaborators(projectId);
      setCollaborators(data);
    } catch (error) {
      console.error("Error loading collaborators:", error);
      toast.error("Failed to load collaborators");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadCollaborators();
  }, [projectId]);
  
  const handleRemove = async (collaboratorId: string) => {
    if (window.confirm("Are you sure you want to remove this collaborator?")) {
      try {
        const success = await removeCollaborator(collaboratorId);
        if (success) {
          toast.success("Collaborator removed successfully");
          setCollaborators(prevCollaborators => 
            prevCollaborators.filter(c => c.id !== collaboratorId)
          );
          onCollaboratorsChange();
        } else {
          toast.error("Failed to remove collaborator");
        }
      } catch (error) {
        console.error("Error removing collaborator:", error);
        toast.error("Failed to remove collaborator");
      }
    }
  };
  
  const startEditing = (collaborator: Collaborator) => {
    setEditingId(collaborator.id);
    setSelectedRole(collaborator.role);
  };
  
  const cancelEditing = () => {
    setEditingId(null);
  };
  
  const saveRoleChange = async (collaboratorId: string) => {
    try {
      const success = await updateCollaboratorRole(collaboratorId, selectedRole);
      if (success) {
        toast.success("Role updated successfully");
        setCollaborators(prevCollaborators => 
          prevCollaborators.map(c => 
            c.id === collaboratorId ? { ...c, role: selectedRole } : c
          )
        );
        onCollaboratorsChange();
      } else {
        toast.error("Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setEditingId(null);
    }
  };
  
  const getRoleBadge = (role: ProjectRole) => {
    let color = "";
    let icon = null;
    
    switch (role) {
      case "admin":
        color = "bg-destructive/80 text-white";
        icon = <Shield className="h-3 w-3" />;
        break;
      case "member":
        color = "bg-blue-500/80 text-white";
        break;
      case "viewer":
        color = "bg-scrum-accent/80 text-white";
        break;
    }
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${color}`}>
        {icon}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };
  
  if (loading && collaborators.length === 0) {
    return <div className="text-center py-8 animate-pulse">Loading collaborators...</div>;
  }
  
  if (collaborators.length === 0) {
    return (
      <div className="text-center py-8 text-scrum-text-secondary">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No collaborators yet. Add some to work together!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-scrum-text-secondary" />
        <h3 className="text-lg font-semibold">Project Collaborators</h3>
      </div>
      
      <div className="space-y-2">
        {collaborators.map(collaborator => (
          <div 
            key={collaborator.id} 
            className="bg-scrum-card border border-scrum-border rounded-md p-3 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{collaborator.username}</div>
              <div className="text-xs text-scrum-text-secondary">{collaborator.email}</div>
            </div>
            
            <div className="flex items-center gap-3">
              {editingId === collaborator.id ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
                    className="text-xs border border-scrum-border rounded bg-scrum-background p-1"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  <button 
                    onClick={() => saveRoleChange(collaborator.id)}
                    className="text-green-500 hover:text-green-400"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  
                  <button 
                    onClick={cancelEditing}
                    className="text-scrum-text-secondary hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  {getRoleBadge(collaborator.role)}
                  
                  <button 
                    onClick={() => startEditing(collaborator)}
                    className="text-scrum-text-secondary hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <button 
                    onClick={() => handleRemove(collaborator.id)}
                    className="text-scrum-text-secondary hover:text-destructive"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollaboratorsList;
