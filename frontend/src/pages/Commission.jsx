import React, { useEffect, useState } from "react";
import { Briefcase, DollarSign, Calendar, MessageSquare } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Commission() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", budget: 500, deadline_days: 30, category: "characters" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get("/commissions").then((r) => setJobs(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    setSubmitting(true);
    try {
      await api.post("/commissions", { ...form, budget: parseFloat(form.budget), deadline_days: parseInt(form.deadline_days) });
      toast.success("Commission posted!");
      setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e)); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10" data-testid="commission-page">
      <header className="flex items-end justify-between mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-teal-400">Commission</span>
          <h1 className="font-display text-4xl font-bold tracking-tighter">Hire pro 3D artists</h1>
          <p className="text-slate-400 mt-2 max-w-xl">Post a brief, set your budget, track milestones. Custom assets, delivered.</p>
        </div>
        <button data-testid="post-commission-button" onClick={() => setOpen(true)} className="btn-primary h-11"><Briefcase className="w-4 h-4" />Post a project</button>
      </header>

      <div className="grid lg:grid-cols-3 gap-5">
        {jobs.length === 0 && <p className="text-slate-400 col-span-full">No open commissions yet. Be the first to post.</p>}
        {jobs.map((j) => (
          <div key={j.id} className="glass rounded-md p-5 hover:border-teal-500/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="chip border-teal-400/40 text-teal-300">{j.category}</span>
              <span className="chip border-amber-400/40 text-amber-300">${j.budget}</span>
            </div>
            <h3 className="font-display font-semibold text-lg mt-3 line-clamp-1">{j.title}</h3>
            <p className="text-sm text-slate-400 mt-2 line-clamp-3 min-h-[60px]">{j.description}</p>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{j.deadline_days}d</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{j.proposals} proposals</span>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg glass-strong rounded-md p-7">
            <h2 className="font-display text-2xl font-bold mb-4">Post your commission</h2>
            <Field label="Title"><input data-testid="commission-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="inp" /></Field>
            <Field label="Description"><textarea data-testid="commission-description" required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="inp" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Budget (USD)"><input data-testid="commission-budget" type="number" min="50" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="inp" /></Field>
              <Field label="Deadline (days)"><input data-testid="commission-deadline" type="number" min="1" value={form.deadline_days} onChange={(e) => setForm({ ...form, deadline_days: e.target.value })} className="inp" /></Field>
            </div>
            <Field label="Category">
              <select data-testid="commission-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="inp">
                {["characters","environments","weapons","vehicles","props","animations"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setOpen(false)} className="btn-outline-teal h-10">Cancel</button>
              <button data-testid="commission-submit" type="submit" disabled={submitting} className="btn-primary h-10">{submitting ? "Posting…" : "Post project"}</button>
            </div>
            <style>{`.inp { width:100%; height:40px; padding:0 12px; border-radius:6px; background:#0F172A; border:1px solid #334155; font-size:13px; color:#E2E8F0; } .inp:focus { outline:none; border-color:#14B8A6; } textarea.inp { height:auto; padding-top:8px; padding-bottom:8px; }`}</style>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="text-xs uppercase tracking-widest text-slate-400 block mb-1">{label}</label>
      {children}
    </div>
  );
}
