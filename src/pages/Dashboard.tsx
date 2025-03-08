
import React from "react";
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

  // Get the 3 most recent projects
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen pt-16 animate-fade-in">
      <Navbar />
      
      <div className="container px-4 py-8">
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 bg-scrum-card rounded-md border border-scrum-border p-1 w-fit mb-6">
            <NavLink to="/" end={true}>
              <LayoutDashboard className="h-4 w-4 mr-1" />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/projects">
              <Folder className="h-4 w-4 mr-1" />
              <span>My Projects</span>
            </NavLink>
            <NavLink to="/collaborations">
              <Users className="h-4 w-4 mr-1" />
              <span>My Collaborations</span>
            </NavLink>
          </div>

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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
