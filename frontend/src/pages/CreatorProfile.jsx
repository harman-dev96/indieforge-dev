import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Download, Heart, Box, MapPin, Briefcase, Globe } from "lucide-react";
import { api } from "../lib/api";
import AssetCard from "../components/AssetCard";

export default function CreatorProfile() {
  const { id } = useParams();
  const [creator, setCreator] = useState(null);
  const [tab, setTab] = useState("portfolio");

  useEffect(() => { api.get(`/creators/${id}`).then((r) => setCreator(r.data)); }, [id]);

  if (!creator) return <div className="p-10 text-slate-400">Loading creator…</div>;

  return (
    <div data-testid="creator-profile-page">
      {/* Banner */}
      <section className="relative grid-bg border-b border-slate-800">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/3 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl" />
          <div className="absolute top-10 right-10 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 relative">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-7 items-start md:items-end">
            <img
              data-testid="creator-avatar"
              src={creator.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${creator.id}`}
              alt={creator.name}
              className="w-32 h-32 rounded-md object-cover border border-teal-500/30 shadow-[0_0_40px_rgba(124,58,237,0.35)]"
            />
            <div className="flex-1">
              <span className="chip border-teal-400/40 text-teal-300">3D Creator</span>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter mt-2">{creator.name}</h1>
              <p className="text-slate-400 mt-2 max-w-2xl leading-relaxed">{creator.bio || "Pro 3D artist on IndieForge."}</p>
              <div className="flex flex-wrap gap-5 mt-4 text-sm text-slate-300">
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{creator.avg_asset_rating || creator.rating || 0} avg rating</span>
                <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-purple-400" />{creator.followers || 0} followers</span>
                <span className="flex items-center gap-1.5"><Box className="w-4 h-4 text-teal-400" />{creator.total_assets || 0} assets</span>
                <span className="flex items-center gap-1.5"><Download className="w-4 h-4 text-teal-400" />{(creator.total_downloads || 0).toLocaleString()} downloads</span>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Link to="/commission" data-testid="hire-creator-button" className="btn-primary h-11">
                <Briefcase className="w-4 h-4" /> Hire creator
              </Link>
              <button data-testid="follow-creator-button" className="btn-outline-teal h-11">+ Follow</button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: "Published", v: creator.total_assets || 0, c: "text-teal-300" },
            { l: "Downloads", v: (creator.total_downloads || 0).toLocaleString(), c: "text-purple-300" },
            { l: "Likes", v: (creator.total_likes || 0).toLocaleString(), c: "text-amber-300" },
            { l: "Plan", v: creator.plan || "pro", c: "text-teal-300" },
          ].map((s) => (
            <div key={s.l} className="glass-strong rounded-md p-4">
              <div className={`font-display font-bold text-2xl ${s.c} capitalize`}>{s.v}</div>
              <div className="text-xs uppercase tracking-widest text-slate-400 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="glass rounded-md p-2 inline-flex mb-6">
          {["portfolio", "about", "links"].map((t) => (
            <button key={t} data-testid={`creator-tab-${t}`} onClick={() => setTab(t)}
              className={`px-5 h-10 rounded text-sm font-medium capitalize transition-colors
                ${tab === t ? "bg-purple-600/20 text-purple-200" : "text-slate-300 hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "portfolio" && (
          <>
            {creator.portfolio?.length === 0 && <p className="text-slate-400">No published assets yet.</p>}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {creator.portfolio?.map((a) => <AssetCard key={a.id} asset={a} />)}
            </div>
          </>
        )}

        {tab === "about" && (
          <div className="glass rounded-md p-7 max-w-3xl">
            <h3 className="font-display text-xl font-semibold mb-3">About {creator.name}</h3>
            <p className="text-slate-300 leading-relaxed">{creator.bio || "This creator hasn't added a bio yet."}</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2 text-slate-300"><MapPin className="w-4 h-4 text-teal-400" />Available worldwide</div>
              <div className="flex items-center gap-2 text-slate-300"><Briefcase className="w-4 h-4 text-teal-400" />Open for commissions</div>
            </div>
          </div>
        )}

        {tab === "links" && (
          <div className="glass rounded-md p-7 max-w-2xl">
            <h3 className="font-display text-xl font-semibold mb-3">Portfolio links</h3>
            <ul className="space-y-3 text-sm">
              <li><a className="flex items-center gap-2 text-teal-300 hover:text-teal-200" href="#"><Globe className="w-4 h-4" />portfolio.{creator.name.toLowerCase().replace(/\s+/g, '')}.io</a></li>
              <li><a className="flex items-center gap-2 text-teal-300 hover:text-teal-200" href="#"><Globe className="w-4 h-4" />artstation.com/{creator.name.toLowerCase().replace(/\s+/g, '')}</a></li>
              <li><a className="flex items-center gap-2 text-teal-300 hover:text-teal-200" href="#"><Globe className="w-4 h-4" />sketchfab.com/{creator.name.toLowerCase().replace(/\s+/g, '')}</a></li>
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
