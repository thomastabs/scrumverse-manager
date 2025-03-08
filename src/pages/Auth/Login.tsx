
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Check } from "lucide-react";
import { toast } from "sonner";

const Login: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(emailOrUsername, password);
      navigate("/");
    } catch (error) {
      toast.error("Invalid credentials");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-scrum-default py-12 px-4">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Check className="h-6 w-6 text-white" />
          <h1 className="text-xl font-semibold text-white">Agile Sprint Manager</h1>
        </div>
        
        <div className="bg-scrum-card border border-scrum-border rounded-lg p-8 shadow-lg animate-fade-up">
          <h2 className="text-2xl font-bold mb-2 text-center">Welcome Back</h2>
          <p className="text-scrum-text-secondary text-center mb-6">Sign in to your account to continue</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="emailOrUsername" className="block mb-2 text-sm">
                Email or Username
              </label>
              <input
                id="emailOrUsername"
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="scrum-input"
                placeholder="your@email.com or username"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block mb-2 text-sm">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="scrum-input"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              className="scrum-button w-full py-3"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-scrum-text-secondary">
              Don't have an account?{" "}
              <Link to="/register" className="text-white hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
