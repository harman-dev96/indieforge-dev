import React from "react";
import { MessageCircle, Trophy, Lightbulb, GraduationCap } from "lucide-react";

const SECTIONS = [
  { icon: MessageCircle, title: "Forums", desc: "Discuss workflows, swap critiques and find collaborators.",
    threads: ["How to bake high-poly normals quickly?", "Best modular kit workflow for Unreal?", "Stylized hand-painted texture tips"] },
  { icon: Trophy, title: "Game Jams", desc: "48-hour challenges with cash prizes and asset rewards.",
    threads: ["IndieForge Sci-Fi Jam · 12 days", "Stylized Weapons Showdown · Live", "Hard Surface Mech Build · Ended"] },
  { icon: Lightbulb, title: "Showcases", desc: "Show off in-game shots — get featured on the homepage.",
    threads: ["Neon Highway — built in 14 days", "Forge Knight — final renders", "Cyber Ronin Demo"] },
  { icon: GraduationCap, title: "Tutorials", desc: "Free lessons from top creators.",
    threads: ["Substance Painter for game characters", "Retopo workflow in Blender 4.1", "Unreal Niagara VFX masterclass"] },
];

export default function Community() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10" data-testid="community-page">
      <header className="mb-10">
        <span className="text-xs uppercase tracking-widest text-teal-400">Community</span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter mt-2">Forge together.</h1>
        <p className="text-slate-400 mt-2 max-w-xl">Forums, game jams, showcases and tutorials — your indie dev hub.</p>
      </header>
      <div className="grid md:grid-cols-2 gap-5">
        {SECTIONS.map(({ icon: Icon, title, desc, threads }) => (
          <div key={title} className="glass rounded-md p-6 hover:border-teal-500/60 transition-colors">
            <Icon className="w-6 h-6 text-teal-400" />
            <h3 className="font-display text-xl font-semibold mt-3">{title}</h3>
            <p className="text-slate-400 text-sm mt-1">{desc}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {threads.map((t) => (
                <li key={t} className="text-slate-300 hover:text-teal-300 cursor-pointer flex items-start gap-2">
                  <span className="text-teal-500 mt-0.5">›</span>{t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
