import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Box } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await register(form.email, form.password, form.name);
    setLoading(false);
    if (res.ok) { toast.success("Account created!"); navigate("/dashboard"); }
    else setError(res.error);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6" data-testid="register-page">
      <form onSubmit={submit} className="w-full max-w-md glass rounded-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#7C3AED] to-[#14B8A6] flex items-center justify-center"><Box className="w-5 h-5" /></div>
          <span className="font-display font-bold">Join IndieForge</span>
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Create account</h1>
        <p className="text-slate-400 text-sm mb-6">Start shipping faster — it's free.</p>

        <label className="text-xs uppercase tracking-widest text-slate-400">Name</label>
        <input data-testid="register-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full mt-1 mb-4 h-11 px-3 rounded-md bg-slate-900 border border-slate-700 focus:outline-none focus:border-teal-500" />

        <label className="text-xs uppercase tracking-widest text-slate-400">Email</label>
        <input data-testid="register-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full mt-1 mb-4 h-11 px-3 rounded-md bg-slate-900 border border-slate-700 focus:outline-none focus:border-teal-500" />

        <label className="text-xs uppercase tracking-widest text-slate-400">Password</label>
        <input data-testid="register-password" type="password" required minLength={6}
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full mt-1 mb-2 h-11 px-3 rounded-md bg-slate-900 border border-slate-700 focus:outline-none focus:border-teal-500" />

        {error && <p data-testid="register-error" className="text-red-400 text-sm mt-2">{error}</p>}

        <button data-testid="register-submit" type="submit" disabled={loading} className="btn-primary w-full mt-5 h-11">
          {loading ? "Creating…" : "Create account"}
        </button>
        <p className="text-sm text-slate-400 mt-5 text-center">
          Already a member? <Link to="/login" className="text-teal-300 hover:text-teal-200">Log in</Link>
        </p>
      </form>
    </div>
  );
}
