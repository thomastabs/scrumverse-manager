import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { Task } from "@/types";
import { Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ProductBacklog: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, getTasksBySprint, addTask } = useProjects();
  const navigate = useNavigate();
  
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPoints, setNewTaskPoints] = useState("");
  
  const project = getProject(projectId || "");
  const backlogTasks = getTasksBySprint("backlog");
  
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
  
  const isTaskInBacklog = (task: Task) => {
    return task.status === 'backlog';
  };
  
  const handleStatusChange = (taskId: string, newStatus: string) => {
    // Implement status change logic here
    console.log(`Task ${taskId} status changed to ${newStatus}`);
  };
  
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) return;
    
    try {
      await addTask({
        title: newTaskTitle,
        description: newTaskDescription,
        sprintId: "backlog", // Use a special ID for backlog tasks
        status: "backlog" as any, // Cast to any to satisfy TypeScript
        storyPoints: parseInt(newTaskPoints) || undefined,
      });
      
      toast.success("Task added to backlog");
      setIsAddingTask(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPoints("");
    } catch (error) {
      toast.error("Failed to add task");
      console.error(error);
    }
  };
  
  return (
    <div>
      <button 
        onClick={() => navigate(`/projects/${projectId}`)}
        className="flex items-center gap-1 text-scrum-text-secondary hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Project</span>
      </button>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Product Backlog</h2>
        <button
          onClick={() => setIsAddingTask(true)}
          className="scrum-button flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
      </div>
      
      {isAddingTask && (
        <form onSubmit={handleAddTask} className="mb-6 bg-scrum-card border border-scrum-border rounded-lg p-4">
          <div className="mb-4">
            <label className="block mb-2 text-sm">
              Task Title
            </label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="scrum-input"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm">
              Description
            </label>
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="scrum-input"
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm">
              Story Points (optional)
            </label>
            <input
              type="number"
              value={newTaskPoints}
              onChange={(e) => setNewTaskPoints(e.target.value)}
              className="scrum-input"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="scrum-button-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="scrum-button">
              Add Task
            </button>
          </div>
        </form>
      )}
      
      {backlogTasks.length === 0 ? (
        <div className="text-center py-12 bg-scrum-card border border-scrum-border rounded-lg">
          <p className="text-scrum-text-secondary mb-4">No tasks in backlog yet</p>
          <button
            onClick={() => setIsAddingTask(true)}
            className="scrum-button"
          >
            Add Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {backlogTasks.map((task) => (
            <div key={task.id} className="scrum-card">
              <h3 className="text-lg font-bold mb-2">{task.title}</h3>
              <p className="text-scrum-text-secondary mb-4">{task.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-scrum-text-secondary">
                  Story Points: {task.storyPoints || "N/A"}
                </span>
                {/* Implement task actions here */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductBacklog;
