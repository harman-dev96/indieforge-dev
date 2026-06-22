import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Box } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      toast.success("Welcome back!");
      navigate(location.state?.from?.pathname || "/dashboard");
    } else setError(res.error);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6" data-testid="login-page">
      <form onSubmit={submit} className="w-full max-w-md glass rounded-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#7C3AED] to-[#14B8A6] flex items-center justify-center"><Box className="w-5 h-5" /></div>
          <span className="font-display font-bold">Welcome back</span>
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Log in</h1>
        <p className="text-slate-400 text-sm mb-6">Continue your asset hunt.</p>

        <label className="text-xs uppercase tracking-widest text-slate-400">Email</label>
        <input data-testid="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 mb-4 h-11 px-3 rounded-md bg-slate-900 border border-slate-700 focus:outline-none focus:border-teal-500" />

        <label className="text-xs uppercase tracking-widest text-slate-400">Password</label>
        <input data-testid="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full mt-1 mb-2 h-11 px-3 rounded-md bg-slate-900 border border-slate-700 focus:outline-none focus:border-teal-500" />

        {error && <p data-testid="login-error" className="text-red-400 text-sm mt-2">{error}</p>}

        <button data-testid="login-submit" type="submit" disabled={loading} className="btn-primary w-full mt-5 h-11">
          {loading ? "Logging in…" : "Log in"}
        </button>
        <p className="text-sm text-slate-400 mt-5 text-center">
          New here? <Link to="/register" className="text-teal-300 hover:text-teal-200">Create an account</Link>
        </p>
        <div className="mt-6 text-xs text-slate-500 text-center">
          Demo: <span className="text-teal-300">demo@indieforge.dev</span> / Demo@2026
        </div>
      </form>
    </div>
  );
}
