
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, ProjectRole } from "@/types";
import { supabase, withRetry } from "@/lib/supabase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOwner: boolean;
  userRole: ProjectRole | null;
  setIsOwner: (isOwner: boolean) => void;
  setUserRole: (role: ProjectRole | null) => void;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isOwner: false,
  userRole: null,
  setIsOwner: () => {},
  setUserRole: () => {},
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);

  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const savedUser = localStorage.getItem("scrumUser");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Error loading user from storage:", error);
        localStorage.removeItem("scrumUser");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserFromStorage();
  }, []);

  const register = async (username: string, email: string, password: string) => {
    try {
      const { data: existingEmail } = await withRetry(async () => {
        return await supabase
          .from('users')
          .select('email')
          .eq('email', email)
          .single();
      });

      if (existingEmail) {
        throw new Error('Email already in use');
      }

      const { data: existingUsername } = await withRetry(async () => {
        return await supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .single();
      });

      if (existingUsername) {
        throw new Error('Username already taken');
      }

      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('users')
          .insert([{ username, email, password }])
          .select()
          .single();
      });

      if (error) throw error;

      if (data) {
        const newUser: User = {
          id: data.id,
          email: data.email,
          username: data.username,
        };
        
        setUser(newUser);
        localStorage.setItem("scrumUser", JSON.stringify(newUser));
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Failed to register');
    }
  };

  const login = async (emailOrUsername: string, password: string) => {
    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('users')
          .select('*')
          .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
          .eq('password', password)
          .single();
      });

      if (error || !data) {
        throw new Error('Invalid credentials');
      }

      const loggedInUser: User = {
        id: data.id,
        email: data.email,
        username: data.username,
      };
      
      setUser(loggedInUser);
      localStorage.setItem("scrumUser", JSON.stringify(loggedInUser));
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    setIsOwner(false);
    setUserRole(null);
    localStorage.removeItem("scrumUser");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isOwner,
        userRole,
        setIsOwner,
        setUserRole,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
