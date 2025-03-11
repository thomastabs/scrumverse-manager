import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Calendar, CheckSquare, ListTodo } from "lucide-react";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import RecentProjects from "@/components/dashboard/RecentProjects";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, sprints, tasks } = useProjects();
  
  const totalProjects = projects.length;
  const totalSprints = sprints.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === "done").length;
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">
        Welcome{user?.username ? `, ${user.username}` : ""}!
      </h1>
      <p className="text-muted-foreground mb-8">
        Here's a summary of your project activity
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sprints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSprints}</div>
            <p className="text-muted-foreground">Total Sprints</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-muted-foreground">Completed Tasks</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentProjects />
        
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No recent activity to display. Start working on your projects to
              see updates here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
