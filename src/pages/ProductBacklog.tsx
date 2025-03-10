import React, { useState } from "react";
import { useProject } from "@/context/ProjectContext";
import { BacklogItem, Sprint } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, TrashIcon, PlusIcon, ArrowRightIcon } from "lucide-react";
import BacklogItemForm from "./BacklogItemForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface BacklogProps {
  projectId: string;
}

const Backlog: React.FC<BacklogProps> = ({ projectId }) => {
  const { backlogItems, sprints, deleteBacklogItem, moveBacklogItemToSprint } = useProject();
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<BacklogItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Filter backlog items for the current project
  const projectBacklogItems = backlogItems
    .filter((item) => item.projectId === projectId)
    .filter((item) => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    )
    .filter((item) => 
      priorityFilter === "all" || item.priority === priorityFilter
    );

  // Get active sprints for this project (not completed)
  const activeSprints = sprints.filter(
    (sprint) => sprint.projectId === projectId && !sprint.isCompleted
  );

  const handleEditItem = (item: BacklogItem) => {
    setItemToEdit(item);
    setShowItemForm(true);
  };

  const handleMoveToSprint = (itemId: string, sprintId: string) => {
    moveBacklogItemToSprint(itemId, sprintId);
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-4 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Product Backlog</h2>
        <Button onClick={() => setShowItemForm(true)}>
          <PlusIcon className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search backlog items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-44">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {projectBacklogItems.length === 0 ? (
        <div className="text-center py-12 bg-accent/30 rounded-lg border border-border">
          <h3 className="text-xl font-medium mb-2">No Backlog Items</h3>
          <p className="text-muted-foreground mb-6">
            Your product backlog is empty. Add items to prioritize your work.
          </p>
          <Button onClick={() => setShowItemForm(true)}>
            <PlusIcon className="h-4 w-4 mr-1" /> Add First Item
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {projectBacklogItems.map((item) => (
            <Card key={item.id} className="hover:shadow-sm transition-shadow">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <Badge variant="outline" className={getPriorityClass(item.priority || "")}>
                    {item.priority || "none"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm text-muted-foreground mb-2">{item.description || ""}</p>
                <Badge variant="secondary">SP: {item.storyPoints || 0}</Badge>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleEditItem(item)}
                  >
                    <PencilIcon className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive"
                    onClick={() => deleteBacklogItem(item.id)}
                  >
                    <TrashIcon className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>

                {activeSprints.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8">
                        <ArrowRightIcon className="h-3.5 w-3.5 mr-1" />
                        Move to Sprint
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Move to Sprint</DialogTitle>
                        <DialogDescription>
                          Select a sprint to move this backlog item into.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        {activeSprints.map((sprint) => (
                          <Button
                            key={sprint.id}
                            variant="outline"
                            className="justify-start h-auto py-3"
                            onClick={() => handleMoveToSprint(item.id, sprint.id)}
                          >
                            <div className="text-left">
                              <p className="font-medium">{sprint.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </Button>
                        ))}
                      </div>

                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {showItemForm && (
        <BacklogItemForm
          onClose={() => {
            setShowItemForm(false);
            setItemToEdit(null);
          }}
          itemToEdit={itemToEdit}
          projectId={projectId}
        />
      )}
    </div>
  );
};

export default Backlog;
