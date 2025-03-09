
import React, { useState } from "react";
import { useProjects } from "@/context/ProjectContext";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface NewSprintButtonProps {
  projectId: string;
}

const NewSprintButton: React.FC<NewSprintButtonProps> = ({ projectId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { addSprint } = useProjects();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Sprint title is required");
      return;
    }
    
    if (!startDate) {
      toast.error("Start date is required");
      return;
    }
    
    if (!endDate) {
      toast.error("End date is required");
      return;
    }
    
    try {
      await addSprint({
        title,
        description,
        projectId,
        startDate,
        endDate,
        status: "planned",
      });
      
      toast.success("Sprint created successfully");
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
    } catch (error) {
      toast.error("Failed to create sprint");
      console.error(error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="scrum-button flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        <span>New Sprint</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create New Sprint</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-scrum-text-secondary hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-2 text-sm">
                  Sprint Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="scrum-input"
                  placeholder="e.g. Sprint 1"
                  required
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="scrum-input"
                  placeholder="Sprint goals and objectives"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-2 text-sm">
                    Start Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="scrum-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm">
                    End Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="scrum-input"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="scrum-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="scrum-button"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default NewSprintButton;
