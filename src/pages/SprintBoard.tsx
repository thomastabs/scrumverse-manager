
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import BacklogItemForm from "./BacklogItemForm";

const SprintBoard: React.FC = () => {
  const { projectId, sprintId } = useParams<{ projectId: string; sprintId: string }>();
  const navigate = useNavigate();
  const { sprints, tasks, getSprintsByProject, updateTask, deleteTask, updateSprint } = useProjects();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!projectId || !sprintId) {
    return <div>Project or Sprint ID is missing</div>;
  }

  const sprint = sprints.find((s) => s.id === sprintId);
  if (!sprint) {
    return <div>Sprint not found</div>;
  }

  const projectSprints = getSprintsByProject(projectId);
  const currentSprintIndex = projectSprints.findIndex((s) => s.id === sprintId);
  const prevSprint = currentSprintIndex > 0 ? projectSprints[currentSprintIndex - 1] : null;
  const nextSprint = currentSprintIndex < projectSprints.length - 1 ? projectSprints[currentSprintIndex + 1] : null;

  // Filter tasks by sprint and optional status filter
  const sprintTasks = tasks
    .filter((task) => task.sprintId === sprintId)
    .filter((task) => filterStatus === "all" || task.status === filterStatus)
    .filter((task) => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );

  // Group tasks by status
  const todoTasks = sprintTasks.filter((task) => task.status === "todo");
  const inProgressTasks = sprintTasks.filter((task) => task.status === "in-progress");
  const reviewTasks = sprintTasks.filter((task) => task.status === "review");
  const doneTasks = sprintTasks.filter((task) => task.status === "done");

  // Calculate sprint progress
  const totalTasks = sprintTasks.length;
  const completedTasks = doneTasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTask(taskId, { status: newStatus as any });
    toast.success(`Task moved to ${newStatus}`);
  };

  const handleEditTask = (task: any) => {
    setTaskToEdit(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    toast.success("Task deleted successfully");
  };

  const handleCompleteSprint = () => {
    if (sprint.status !== "completed") {
      updateSprint(sprintId, { status: "completed" });
      toast.success("Sprint marked as completed");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      case "done":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isSprintActive = sprint.status === "in-progress";
  const isSprintCompleted = sprint.status === "completed";

  return (
    <div className="p-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold">{sprint.title}</h2>
            <Badge variant="outline" className={
              sprint.status === "planned" ? "bg-gray-100 text-gray-800" :
              sprint.status === "in-progress" ? "bg-blue-100 text-blue-800" :
              "bg-green-100 text-green-800"
            }>
              {sprint.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-3.5 w-3.5 mr-1" />
              {completedTasks}/{totalTasks} tasks completed
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {prevSprint && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/sprints/${prevSprint.id}`)}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous Sprint
            </Button>
          )}
          {nextSprint && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/sprints/${nextSprint.id}`)}
            >
              Next Sprint
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Button>
          )}
          {/* Fix the comparison logic to include all non-completed statuses */}
          {sprint.status !== "completed" && (
            <Button
              variant={isSprintActive ? "destructive" : "default"}
              size="sm"
              onClick={handleCompleteSprint}
            >
              {isSprintActive ? (
                <>
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  End Sprint
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Complete Sprint
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {sprint.description && (
        <Card className="mb-6">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Sprint Description</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            <p className="text-sm">{sprint.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-44">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowTaskForm(true)} disabled={isSprintCompleted}>
          <PlusIcon className="h-4 w-4 mr-1" /> Add Task
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-1 text-sm">
          <span>Sprint Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {sprintTasks.length === 0 ? (
        <div className="text-center py-12 bg-accent/30 rounded-lg border border-border">
          <h3 className="text-xl font-medium mb-2">No Tasks</h3>
          <p className="text-muted-foreground mb-6">
            This sprint doesn't have any tasks yet. Add tasks to track your progress.
          </p>
          <Button onClick={() => setShowTaskForm(true)} disabled={isSprintCompleted}>
            <PlusIcon className="h-4 w-4 mr-1" /> Add First Task
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* To Do Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">To Do ({todoTasks.length})</h3>
            </div>
            {todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                isSprintCompleted={isSprintCompleted}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>

          {/* In Progress Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">In Progress ({inProgressTasks.length})</h3>
            </div>
            {inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                isSprintCompleted={isSprintCompleted}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>

          {/* Review Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Review ({reviewTasks.length})</h3>
            </div>
            {reviewTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                isSprintCompleted={isSprintCompleted}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>

          {/* Done Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Done ({doneTasks.length})</h3>
            </div>
            {doneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                isSprintCompleted={isSprintCompleted}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>
        </div>
      )}

      {showTaskForm && (
        <BacklogItemForm
          onClose={() => {
            setShowTaskForm(false);
            setTaskToEdit(null);
          }}
          itemToEdit={taskToEdit}
          projectId={projectId}
          sprintId={sprintId}
        />
      )}
    </div>
  );
};

interface TaskCardProps {
  task: any;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onEdit: (task: any) => void;
  onDelete: (taskId: string) => void;
  isSprintCompleted: boolean;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string | undefined) => string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  isSprintCompleted,
  getStatusColor,
  getPriorityColor,
}) => {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
          <div className="flex gap-1">
            {task.priority && (
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            )}
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {task.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 pb-2">
        {task.description && (
          <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
        )}
        {task.storyPoints && (
          <Badge variant="secondary" className="text-xs">
            SP: {task.storyPoints}
          </Badge>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 flex justify-between">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onEdit(task)}
            disabled={isSprintCompleted}
          >
            <PencilIcon className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive"
            onClick={() => onDelete(task.id)}
            disabled={isSprintCompleted}
          >
            <TrashIcon className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>

        {!isSprintCompleted && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                Move
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Change Status</DialogTitle>
                <DialogDescription>
                  Move this task to a different status column.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Select
                  defaultValue={task.status}
                  onValueChange={(value) => onStatusChange(task.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={() => document.querySelector('[role="dialog"]')?.closest('div[data-state="open"]')?.dispatchEvent(new Event('close', { bubbles: true }))}>
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
};

export default SprintBoard;
