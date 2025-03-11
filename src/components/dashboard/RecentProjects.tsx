
import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Users } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/context/ProjectContext";
import { Project } from "@/types";

const RecentProjects: React.FC = () => {
  const { projects } = useProjects();
  
  // Get the 3 most recently updated projects
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  if (recentProjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center flex-col">
          <p className="text-muted-foreground text-center mb-4">
            You haven't created any projects yet
          </p>
          <Link to="/projects">
            <Button>Create Your First Project</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentProjects.map((project) => (
          <Link 
            key={project.id} 
            to={`/projects/${project.id}`}
            className="block"
          >
            <Card className="hover:bg-accent/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{project.title}</CardTitle>
                  {project.isCollaboration && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      Collaboration
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-2 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              </CardContent>
              <CardFooter className="pt-0 text-xs text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {project.isCollaboration && (
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      <span>Team Project</span>
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </CardContent>
      <CardFooter>
        <Link to="/projects" className="w-full">
          <Button variant="outline" className="w-full">View All Projects</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default RecentProjects;
