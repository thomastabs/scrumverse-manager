import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/context/ProjectContext";
import { Project } from "@/types";
import { Plus, ListChecks, Flame, Users } from "lucide-react";
import RecentProjects from "@/components/dashboard/RecentProjects";
import CollaborativeProjectsList from "@/components/collaborations/CollaborativeProjectsList";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (projects && projects.length > 0) {
      // Sort projects by creation date and get the 5 most recent
      const sortedProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentProjects(sortedProjects.slice(0, 5));
    } else {
      setRecentProjects([]);
    }
  }, [projects]);

  return (
    <div className="min-h-screen pt-16 animate-fade-in">
      <div className="container px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {user?.username}!
            </h1>
            <p className="text-scrum-text-secondary">
              Here's what's happening with your projects today.
            </p>
          </div>
          <Link
            to="/create-project"
            className="scrum-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="scrum-card flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3 text-blue-500">
              <ListChecks className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-scrum-text-secondary">Total Projects</p>
              <p className="text-xl font-semibold">{projects?.length || 0}</p>
            </div>
          </div>

          <div className="scrum-card flex items-center gap-4">
            <div className="rounded-full bg-green-100 p-3 text-green-500">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-scrum-text-secondary">Sprints Active</p>
              <p className="text-xl font-semibold">4</p>
            </div>
          </div>

          <div className="scrum-card flex items-center gap-4">
            <div className="rounded-full bg-red-100 p-3 text-red-500">
              <ListChecks className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-scrum-text-secondary">Tasks Due</p>
              <p className="text-xl font-semibold">12</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-scrum-text-secondary" />
              <span>My Projects</span>
            </h2>
            <Link
              to="/projects"
              className="text-sm text-blue-500 hover:underline"
            >
              View All
            </Link>
          </div>
          {projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 3).map((project) => (
                <div key={project.id} className="scrum-card">
                  <Link to={`/projects/${project.id}`}>
                    <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                    <p className="text-scrum-text-secondary text-sm">{project.description}</p>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-scrum-card border border-scrum-border rounded-md">
              <ListChecks className="h-12 w-12 mx-auto mb-4 text-scrum-text-secondary opacity-50" />
              <p className="text-scrum-text-secondary">You don't have any projects yet. Create one to get started!</p>
            </div>
          )}
        </div>

        <RecentProjects recentProjects={recentProjects} />
        
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-scrum-text-secondary" />
              <span>My Collaborations</span>
            </h2>
          </div>
          
          <CollaborativeProjectsList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
