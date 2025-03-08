
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("scrumUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Mock auth functions for now
  const login = async (email: string, password: string) => {
    // In a real app, you would validate credentials with a backend
    if (email && password) {
      const mockUser: User = {
        id: "user-1",
        email,
        name: email.split("@")[0],
      };
      setUser(mockUser);
      localStorage.setItem("scrumUser", JSON.stringify(mockUser));
    } else {
      throw new Error("Invalid credentials");
    }
  };

  const register = async (email: string, password: string) => {
    // In a real app, you would register with a backend
    if (email && password) {
      const mockUser: User = {
        id: "user-1",
        email,
        name: email.split("@")[0],
      };
      setUser(mockUser);
      localStorage.setItem("scrumUser", JSON.stringify(mockUser));
    } else {
      throw new Error("Invalid credentials");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("scrumUser");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
