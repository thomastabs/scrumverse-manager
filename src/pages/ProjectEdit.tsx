import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ProjectEdit: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, updateProject } = useProjects();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endGoal, setEndGoal] = useState("");
  
  useEffect(() => {
    if (!projectId) return;
    
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setTitle(project.title);
      setDescription(project.description);
      setEndGoal(project.endGoal || "");
    }
  }, [projectId, projects]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) return;
    
    if (!title.trim()) {
      toast.error("Project title is required");
      return;
    }
    
    updateProject(projectId, {
      title,
      description,
      endGoal
    });
    
    toast.success("Project updated successfully");
    navigate(`/projects/${projectId}`);
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Edit Project</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Project Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title"
              className="w-full"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project"
              className="w-full min-h-[150px]"
            />
          </div>
          
          <div>
            <label htmlFor="endGoal" className="block text-sm font-medium mb-2">
              End Goal
            </label>
            <Textarea
              id="endGoal"
              value={endGoal}
              onChange={(e) => setEndGoal(e.target.value)}
              placeholder="What is the end goal of this project?"
              className="w-full min-h-[100px]"
            />
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button 
            type="button"
            variant="outline"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectEdit;
