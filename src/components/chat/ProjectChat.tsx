
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Send, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { fetchProjectChatMessages, sendProjectChatMessage } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

const ProjectChat: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch initial messages
  useEffect(() => {
    fetchMessages();
    
    // Set up realtime subscription via the supabase client
    const channel = supabase
      .channel('chat-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(current => [...current, newMessage]);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const fetchMessages = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const data = await fetchProjectChatMessages(projectId);
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load chat messages");
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !projectId) return;
    
    setIsSending(true);
    try {
      await sendProjectChatMessage(
        projectId,
        user.id,
        user.username || user.email,
        newMessage.trim()
      );
      
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  // Group messages by date
  const groupedMessages: { [date: string]: ChatMessage[] } = {};
  messages.forEach(message => {
    const date = formatDate(message.created_at);
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  return (
    <div className="scrum-card h-[500px] max-h-[calc(100vh-220px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Project Chat</h2>
        <button 
          onClick={fetchMessages} 
          className="text-scrum-text-secondary hover:text-scrum-text-primary"
          title="Refresh messages"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 border-t border-b border-scrum-border">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-scrum-text-secondary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-scrum-text-secondary">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="p-4">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date} className="mb-4">
                <div className="text-xs text-center text-scrum-text-secondary bg-scrum-background py-1 rounded-md mb-2">
                  {date}
                </div>
                
                {dateMessages.map((msg) => (
                  <div key={msg.id} className={`mb-2 flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-md ${
                      msg.user_id === user?.id 
                        ? 'bg-scrum-accent text-white rounded-tr-none' 
                        : 'bg-scrum-card border border-scrum-border rounded-tl-none'
                    }`}>
                      {msg.user_id !== user?.id && (
                        <div className="text-xs font-semibold mb-1">{msg.username}</div>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <div className={`text-xs mt-1 text-right ${
                        msg.user_id === user?.id ? 'text-white/70' : 'text-scrum-text-secondary'
                      }`}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="scrum-input flex-1"
          disabled={isSending}
        />
        <button
          type="submit"
          className="scrum-button flex items-center justify-center w-10"
          disabled={isSending || !newMessage.trim()}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
};

export default ProjectChat;
