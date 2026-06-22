import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Download, Bell, Folder, Receipt } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export default function UserDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("purchases");
  const [purchases, setPurchases] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    api.get("/my/purchases").then((r) => setPurchases(r.data));
    api.get("/my/favorites").then((r) => setFavorites(r.data));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10" data-testid="user-dashboard-page">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tighter">Welcome, {user?.name}</h1>
          <p className="text-slate-400 mt-1">Manage your library, favorites and account.</p>
        </div>
        <Link to="/dashboard/creator" className="btn-outline-teal h-10 text-sm">Creator Studio →</Link>
      </header>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <Stat icon={Download} label="Purchases" value={purchases.length} color="text-teal-300" />
        <Stat icon={Heart} label="Favorites" value={favorites.length} color="text-purple-300" />
        <Stat icon={Folder} label="Collections" value={0} color="text-amber-300" />
        <Stat icon={Bell} label="Plan" value={user?.plan || "free"} color="text-teal-300" />
      </div>

      <div className="glass rounded-md p-2 flex flex-wrap mb-5">
        {["purchases", "favorites", "invoices", "notifications"].map((t) => (
          <button key={t} data-testid={`user-tab-${t}`} onClick={() => setTab(t)}
            className={`flex-1 min-w-[120px] h-10 px-4 rounded text-sm font-medium capitalize transition-colors
              ${tab === t ? "bg-purple-600/20 text-purple-200" : "text-slate-300 hover:text-white"}`}>{t}</button>
        ))}
      </div>

      {tab === "purchases" && (
        <Grid items={purchases.map((p) => p.asset).filter(Boolean)} empty="No purchases yet — explore the marketplace." />
      )}
      {tab === "favorites" && <Grid items={favorites} empty="No favorites yet." />}
      {tab === "invoices" && (
        <div className="glass rounded-md p-6">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Receipt className="w-5 h-5 text-teal-400" />Invoices</h3>
          {purchases.length === 0 && <p className="text-slate-400 text-sm">No invoices yet.</p>}
          <ul className="text-sm divide-y divide-slate-800">
            {purchases.map((p) => (
              <li key={p.id} className="py-3 flex justify-between">
                <span>{p.asset?.title}</span>
                <span className="text-amber-300">${p.amount?.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === "notifications" && (
        <div className="glass rounded-md p-6 text-sm text-slate-300 space-y-3">
          <div>📦 Welcome to IndieForge 3D!</div>
          <div>🎁 You unlocked Free plan benefits.</div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="glass rounded-md p-5">
      <Icon className={`w-5 h-5 ${color}`} />
      <div className="font-display font-bold text-2xl mt-2 capitalize">{value}</div>
      <div className="text-xs text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function Grid({ items, empty }) {
  if (!items.length) return <p className="text-slate-400 text-sm">{empty}</p>;
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {items.map((a) => (
        <Link key={a.id} to={`/assets/${a.id}`} className="glass rounded-md overflow-hidden hover:border-teal-500/60 transition-colors">
          <img src={a.thumbnail_url} className="w-full aspect-[4/3] object-cover" alt="" />
          <div className="p-4">
            <div className="font-display font-semibold text-sm line-clamp-1">{a.title}</div>
            <div className="text-xs text-slate-400 mt-1">by {a.creator_name}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
