import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Box, LogOut, User, LayoutGrid } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/marketplace${q ? `?search=${encodeURIComponent(q)}` : ""}`);
  };

  const linkCls = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? "text-teal-300" : "text-slate-300 hover:text-white"}`;

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-teal-500/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">
        <Link to="/" data-testid="logo-link" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#7C3AED] to-[#14B8A6] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] group-hover:scale-105 transition-transform">
            <Box className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Indie<span className="text-gradient">Forge</span> 3D
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-5">
          <NavLink to="/marketplace" data-testid="nav-marketplace" className={linkCls}>Marketplace</NavLink>
          <NavLink to="/commission" data-testid="nav-commission" className={linkCls}>Commission</NavLink>
          <NavLink to="/community" data-testid="nav-community" className={linkCls}>Community</NavLink>
          <NavLink to="/pricing" data-testid="nav-pricing" className={linkCls}>Pricing</NavLink>
          <NavLink to="/blog" data-testid="nav-blog" className={linkCls}>Blog</NavLink>
        </nav>

        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            data-testid="nav-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search assets, creators, tags…"
            className="w-full h-10 pl-10 pr-4 rounded-md bg-slate-900/70 border border-slate-700 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </form>

        <div className="ml-auto lg:ml-0 flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" data-testid="nav-dashboard">
                <Link to="/dashboard"><LayoutGrid className="w-4 h-4 mr-1" />Dashboard</Link>
              </Button>
              <Button onClick={logout} variant="ghost" size="sm" data-testid="nav-logout">
                <LogOut className="w-4 h-4 mr-1" />Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" data-testid="nav-login">
                <Link to="/login"><User className="w-4 h-4 mr-1" />Login</Link>
              </Button>
              <Link to="/register" data-testid="nav-signup" className="btn-primary h-9 px-4 text-sm rounded-md">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
