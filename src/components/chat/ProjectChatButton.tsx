
import React, { useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";
import ProjectChat from "./ProjectChat";
import { Button } from "@/components/ui/button";

// Note: This component is kept for reference but is no longer used in the app
// The chat functionality has been moved to the Team tab

const ProjectChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close chat with escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);
  
  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-30 p-3 rounded-full shadow-lg transition-all`}
        title={isOpen ? "Close chat" : "Open project chat"}
        size="icon"
        variant={isOpen ? "destructive" : "scrum-black"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageSquare className="h-6 w-6 text-white" />
        )}
      </Button>
      
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-20 w-80 md:w-96 shadow-xl animate-fade-up">
          <ProjectChat />
        </div>
      )}
    </>
  );
};

export default ProjectChatButton;
