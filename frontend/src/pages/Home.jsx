import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Shield, Star } from "lucide-react";
import HeroScene from "../components/HeroScene";
import AssetCard from "../components/AssetCard";
import { api } from "../lib/api";

const CAT_ICONS = {
  characters: "👤", environments: "🏞️", weapons: "⚔️", vehicles: "🚀",
  buildings: "🏛️", nature: "🌲", animals: "🐾", animations: "🎬", vfx: "✨", props: "📦",
};

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [creators, setCreators] = useState([]);
  const [stats, setStats] = useState({ assets: 0, creators: 0, downloads: 0 });

  useEffect(() => {
    api.get("/assets/trending").then((r) => setTrending(r.data));
    api.get("/categories").then((r) => setCategories(r.data));
    api.get("/creators/featured").then((r) => setCreators(r.data));
    api.get("/stats").then((r) => setStats(r.data));
  }, []);

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative overflow-hidden grid-bg">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
          <div className="absolute top-40 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="chip border-purple-500/40 text-purple-300 bg-purple-500/10 mb-5">
              <Sparkles className="w-3.5 h-3.5" /> 12,400+ assets · 1,800 creators
            </span>
            <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tighter">
              Build <span className="text-gradient">Amazing</span><br />Worlds Faster.
            </h1>
            <p className="text-slate-300 text-lg mt-6 leading-relaxed max-w-lg">
              Premium 3D assets, characters, environments and VFX — engineered for indie game devs.
              Preview in-browser, download instantly, ship games quicker.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/marketplace" data-testid="hero-cta-browse" className="btn-primary">
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/register" data-testid="hero-cta-signup" className="btn-outline-teal">
                Start Selling — It's Free
              </Link>
            </div>
            <div className="flex items-center gap-8 mt-10 text-sm">
              <div><div className="font-display font-bold text-2xl text-white">{stats.assets}+</div><div className="text-slate-400">Assets</div></div>
              <div><div className="font-display font-bold text-2xl text-white">{stats.creators}+</div><div className="text-slate-400">Creators</div></div>
              <div><div className="font-display font-bold text-2xl text-white">{stats.downloads || 0}+</div><div className="text-slate-400">Downloads</div></div>
            </div>
          </motion.div>
          <div className="relative aspect-square w-full max-w-xl mx-auto">
            <HeroScene />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-teal-400">Categories</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-1">Browse by category</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((c) => (
            <Link key={c.slug} to={`/marketplace?category=${c.slug}`}
              data-testid={`category-${c.slug}`}
              className="glass rounded-md p-5 hover:border-teal-500/60 hover:-translate-y-1 transition-all group">
              <div className="text-3xl mb-2">{CAT_ICONS[c.slug] || "🎮"}</div>
              <div className="font-display font-semibold group-hover:text-teal-300 transition-colors">{c.name}</div>
              <div className="text-xs text-slate-400 mt-1">{c.count} assets</div>
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-teal-400">Trending Now</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-1">Hot this week</h2>
          </div>
          <Link to="/marketplace" className="text-sm text-teal-300 hover:text-teal-200">View all →</Link>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {trending.map((a) => <AssetCard key={a.id} asset={a} />)}
        </div>
      </section>

      {/* CREATORS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-teal-400">Featured Creators</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-1">Hire top 3D artists</h2>
          </div>
          <Link to="/commission" className="text-sm text-teal-300 hover:text-teal-200">Post a job →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {creators.map((c) => (
            <div key={c.id} data-testid={`creator-card-${c.id}`} className="glass rounded-md p-5 hover:border-purple-500/50 transition-colors">
              <div className="flex items-center gap-3">
                <img src={c.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.id}`}
                  alt={c.name} className="w-14 h-14 rounded-md object-cover border border-slate-700" />
                <div>
                  <div className="font-display font-semibold">{c.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />{c.rating?.toFixed?.(1)} · {c.followers} followers
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-300 mt-3 line-clamp-2 min-h-[40px]">{c.bio}</p>
              <Link to="/commission" className="btn-outline-teal w-full mt-4 h-9 text-sm">Hire</Link>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE TRIO */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Zap, t: "Instant preview", d: "Inspect every asset in our in-browser Three.js viewer before you pay." },
            { icon: Shield, t: "Royalty-free", d: "Commercial license included. No surprise fees, ever." },
            { icon: Sparkles, t: "Engine ready", d: "Unity, Unreal, Godot, Blender — all formats one click away." },
          ].map(({ icon: Icon, t, d }, i) => (
            <div key={i} className="glass rounded-md p-6">
              <Icon className="w-6 h-6 text-teal-400 mb-3" />
              <h3 className="font-display text-xl font-semibold">{t}</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
