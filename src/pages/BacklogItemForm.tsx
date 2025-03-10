
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BacklogItemFormData } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProject } from "@/context/ProjectContext";
import { X } from "lucide-react";
import { useParams } from "react-router-dom";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high"]),
  storyPoints: z.coerce.number().min(1).max(100),
});

interface BacklogItemFormProps {
  onClose: () => void;
  itemToEdit?: {
    id: string;
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    storyPoints?: number;
  } | null;
  projectId?: string;
}

const BacklogItemForm: React.FC<BacklogItemFormProps> = ({ 
  onClose, 
  itemToEdit,
  projectId: propProjectId
}) => {
  const { createBacklogItem, updateBacklogItem } = useProject();
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const isEditMode = !!itemToEdit;
  
  // Use the projectId from props if provided, otherwise from URL params
  const projectId = propProjectId || routeProjectId;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: itemToEdit?.title || "",
      description: itemToEdit?.description || "",
      priority: itemToEdit?.priority || "medium",
      storyPoints: itemToEdit?.storyPoints || 1,
    },
  });

  const onSubmit = (data: BacklogItemFormData) => {
    if (isEditMode && itemToEdit) {
      updateBacklogItem(itemToEdit.id, data);
    } else {
      // Include the projectId when creating a new backlog item
      createBacklogItem({
        ...data,
        projectId
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 animate-slide-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {isEditMode ? "Edit Backlog Item" : "Create Backlog Item"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter item description"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storyPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Points</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Update Item" : "Create Item"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default BacklogItemForm;
