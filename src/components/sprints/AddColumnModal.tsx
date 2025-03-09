
import React, { useState } from "react";
import { X } from "lucide-react";

interface AddColumnModalProps {
  onClose: () => void;
  onAdd: (columnName: string) => void;
}

const AddColumnModal: React.FC<AddColumnModalProps> = ({ onClose, onAdd }) => {
  const [columnName, setColumnName] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (columnName.trim()) {
      onAdd(columnName.trim());
      setColumnName("");
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-md animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add New Column</h2>
          <button
            onClick={onClose}
            className="text-scrum-text-secondary hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block mb-2 text-sm">
              Column Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className="scrum-input"
              placeholder="e.g. Review"
              required
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="scrum-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="scrum-button"
              disabled={!columnName.trim()}
            >
              Add Column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddColumnModal;
