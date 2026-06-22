import React from "react";

const POSTS = [
  { title: "Optimizing 3D assets for mobile games", cat: "Performance", time: "8 min read",
    img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
    excerpt: "Practical workflow for reducing draw calls, LOD strategy, and texture atlasing for low-end devices." },
  { title: "Mastering PBR materials in Substance Painter", cat: "Tutorial", time: "12 min read",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
    excerpt: "From base color to roughness — the complete pipeline used by top IndieForge creators." },
  { title: "Interview: how Cyber Forge ships 12 packs a year", cat: "Interview", time: "5 min read",
    img: "https://images.unsplash.com/photo-1635805737707-575885ab0820?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
    excerpt: "Behind-the-scenes of one of our top mech creators — tools, schedule and burnout strategy." },
  { title: "Unity vs Unreal: where indies should bet in 2026", cat: "Engines", time: "9 min read",
    img: "https://images.unsplash.com/photo-1681924101087-922416cba14e?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
    excerpt: "We compare licensing, asset workflow and shipped indie titles to settle the debate." },
];

export default function Blog() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10" data-testid="blog-page">
      <header className="mb-8">
        <span className="text-xs uppercase tracking-widest text-teal-400">Blog</span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter mt-2">Stories, tutorials & insights.</h1>
      </header>
      <div className="grid md:grid-cols-2 gap-6">
        {POSTS.map((p) => (
          <article key={p.title} className="glass rounded-md overflow-hidden group hover:border-teal-500/60 transition-colors cursor-pointer">
            <img src={p.img} className="w-full aspect-[16/9] object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
            <div className="p-5">
              <div className="flex gap-2 items-center text-xs">
                <span className="chip border-purple-400/40 text-purple-300">{p.cat}</span>
                <span className="text-slate-500">{p.time}</span>
              </div>
              <h3 className="font-display text-xl font-semibold mt-2 group-hover:text-teal-300 transition-colors">{p.title}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{p.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
