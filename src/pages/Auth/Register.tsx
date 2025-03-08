
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Check } from "lucide-react";
import { toast } from "sonner";

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(email, password);
      navigate("/");
    } catch (error) {
      toast.error("Registration failed");
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
          <h2 className="text-2xl font-bold mb-2 text-center">Create Account</h2>
          <p className="text-scrum-text-secondary text-center mb-6">Sign up to start managing your projects</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-2 text-sm">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="scrum-input"
                placeholder="your@email.com"
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
                minLength={6}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block mb-2 text-sm">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="scrum-input"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              className="scrum-button w-full py-3"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-scrum-text-secondary">
              Already have an account?{" "}
              <Link to="/login" className="text-white hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
