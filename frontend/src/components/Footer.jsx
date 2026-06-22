import React from "react";
import { Link } from "react-router-dom";
import { Box, Twitter, Github, Youtube, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 mt-24 bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#7C3AED] to-[#14B8A6] flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg">Indie<span className="text-gradient">Forge</span> 3D</span>
          </div>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
            The premium 3D asset marketplace built for indie game developers. Discover, preview, purchase, and commission stunning models.
          </p>
          <form className="mt-5 flex gap-2 max-w-sm" onSubmit={(e) => e.preventDefault()}>
            <input data-testid="footer-newsletter-input" placeholder="your@email.dev"
              className="flex-1 h-10 px-3 rounded-md bg-slate-900/70 border border-slate-700 text-sm focus:outline-none focus:border-teal-500" />
            <button data-testid="footer-newsletter-submit" className="btn-primary h-10 text-sm">Subscribe</button>
          </form>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-widest mb-3">Explore</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link to="/marketplace" className="hover:text-teal-300">Marketplace</Link></li>
            <li><Link to="/commission" className="hover:text-teal-300">Commission</Link></li>
            <li><Link to="/community" className="hover:text-teal-300">Community</Link></li>
            <li><Link to="/pricing" className="hover:text-teal-300">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-widest mb-3">Creators</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link to="/dashboard/creator" className="hover:text-teal-300">Sell Assets</Link></li>
            <li><Link to="/blog" className="hover:text-teal-300">Tutorials</Link></li>
            <li><Link to="/pricing" className="hover:text-teal-300">Royalty Plans</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-widest mb-3">Connect</h4>
          <div className="flex gap-3 text-slate-400">
            <a className="hover:text-teal-300" href="#"><Twitter className="w-5 h-5" /></a>
            <a className="hover:text-teal-300" href="#"><Github className="w-5 h-5" /></a>
            <a className="hover:text-teal-300" href="#"><Youtube className="w-5 h-5" /></a>
            <a className="hover:text-teal-300" href="#"><Mail className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        © 2026 IndieForge 3D. Built for indie developers, by indie developers.
      </div>
    </footer>
  );
}
