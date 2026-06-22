import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Rocket } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const PLANS = [
  { id: "free",   name: "Free",   price: 0,  icon: Check,
    features: ["Browse 12k+ assets", "Buy individual assets", "Community forums", "Standard license"] },
  { id: "pro",    name: "Pro",    price: 9, icon: Rocket, highlight: true,
    features: ["Everything in Free", "10% off all assets", "Priority support", "Early access to new drops", "Commercial license"] },
  { id: "studio", name: "Studio", price: 29, icon: Crown,
    features: ["Everything in Pro", "Unlimited team seats", "20% off all assets", "Studio dashboard", "Dedicated account manager"] },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState("");

  const subscribe = async (plan) => {
    if (!user) return navigate("/login");
    setLoading(plan);
    try {
      const { data } = await api.post("/checkout/subscription", { plan, origin_url: window.location.origin });
      if (data.free) { toast.success("You're on Free plan."); navigate("/dashboard"); }
      else if (data.url) window.location.href = data.url;
    } catch (e) { toast.error(formatApiError(e)); }
    finally { setLoading(""); }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16" data-testid="pricing-page">
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-widest text-teal-400">Pricing</span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">Plans that scale with you</h1>
        <p className="text-slate-400 mt-3 max-w-2xl mx-auto">Cancel anytime. Every plan includes royalty-free commercial license on purchased assets.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {PLANS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.id} data-testid={`plan-${p.id}`}
              className={`glass rounded-md p-7 relative transition-all hover:-translate-y-1 ${p.highlight ? "border-purple-500/60 neon-purple" : ""}`}>
              {p.highlight && <span className="absolute -top-3 left-7 chip bg-purple-600 border-purple-400 text-white">Most popular</span>}
              <Icon className="w-7 h-7 text-teal-400 mb-4" />
              <div className="font-display text-2xl font-bold">{p.name}</div>
              <div className="mt-3"><span className="text-5xl font-display font-bold">${p.price}</span><span className="text-slate-400 text-sm">/month</span></div>
              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />{f}</li>)}
              </ul>
              <button data-testid={`select-plan-${p.id}`} onClick={() => subscribe(p.id)} disabled={loading === p.id}
                className={`${p.highlight ? "btn-primary" : "btn-outline-teal"} w-full mt-7 h-11`}>
                {loading === p.id ? "Redirecting…" : (p.id === "free" ? "Get started" : `Upgrade to ${p.name}`)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
