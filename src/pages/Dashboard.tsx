
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/context/ProjectContext";
import Navbar from "@/components/layout/Navbar";
import ProjectCard from "@/components/projects/ProjectCard";
import NewProjectButton from "@/components/projects/NewProjectButton";
import NavLink from "@/components/ui/NavLink";
import { Folder, Users, LayoutDashboard } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "collaborations">("overview");

  // Get the 3 most recent projects (for overview tab)
  const recentProjects = [...projects]
    .filter(p => !p.isCollaboration)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Get all owned projects (not collaborations)
  const ownedProjects = projects.filter(p => !p.isCollaboration);
  
  // Get collaborations
  const collaborativeProjects = projects.filter(p => p.isCollaboration === true);

  const renderTabContent = () => {
    if (activeTab === "overview") {
      return (
        <div className="bg-scrum-card border border-scrum-border rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold">Recent Projects</h2>
              <p className="text-scrum-text-secondary">Your most recently created projects</p>
            </div>
            <NewProjectButton />
          </div>

          {recentProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-scrum-text-secondary mb-4">You don't have any projects yet</p>
              <NewProjectButton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      );
    } else if (activeTab === "projects") {
      return (
        <div>
          {ownedProjects.length === 0 ? (
            <div className="text-center py-12 bg-scrum-card border border-scrum-border rounded-lg">
              <p className="text-scrum-text-secondary mb-4">You don't have any projects yet</p>
              <NewProjectButton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      );
    } else if (activeTab === "collaborations") {
      return (
        <div>
          {collaborativeProjects.length === 0 ? (
            <div className="text-center py-12 bg-scrum-card border border-scrum-border rounded-lg">
              <p className="text-scrum-text-secondary mb-4">You don't have any collaborative projects yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collaborativeProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen pt-16 animate-fade-in">
      <Navbar />
      
      <div className="container px-4 py-8">
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 bg-scrum-card rounded-md border border-scrum-border p-1 w-fit mb-6">
            <button 
              className={`flex items-center px-3 py-1.5 rounded text-sm ${activeTab === "overview" ? "bg-scrum-background text-scrum-text-primary" : "text-scrum-text-secondary"}`}
              onClick={() => setActiveTab("overview")}
            >
              <LayoutDashboard className="h-4 w-4 mr-1" />
              <span>Overview</span>
            </button>
            <button 
              className={`flex items-center px-3 py-1.5 rounded text-sm ${activeTab === "projects" ? "bg-scrum-background text-scrum-text-primary" : "text-scrum-text-secondary"}`}
              onClick={() => setActiveTab("projects")}
            >
              <Folder className="h-4 w-4 mr-1" />
              <span>My Projects</span>
            </button>
            <button 
              className={`flex items-center px-3 py-1.5 rounded text-sm ${activeTab === "collaborations" ? "bg-scrum-background text-scrum-text-primary" : "text-scrum-text-secondary"}`}
              onClick={() => setActiveTab("collaborations")}
            >
              <Users className="h-4 w-4 mr-1" />
              <span>My Collaborations</span>
            </button>
          </div>

          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
