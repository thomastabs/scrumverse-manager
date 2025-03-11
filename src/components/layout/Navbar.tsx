
import React from "react";
import { Link } from "react-router-dom";
import { LogOut, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between z-10">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <Check className="h-6 w-6 text-white" />
          <h1 className="text-xl font-semibold text-white">Scrumify Hub</h1>
        </Link>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center font-semibold">
            {user.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
