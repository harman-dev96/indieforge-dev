import React from "react";
import { Link } from "react-router-dom";
import { Heart, Download, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function AssetCard({ asset }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative rounded-md overflow-hidden glass border border-slate-700/60 hover:border-teal-500/60 transition-colors"
      data-testid={`asset-card-${asset.id}`}
    >
      <Link to={`/assets/${asset.id}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-slate-800 relative">
          <img src={asset.thumbnail_url} alt={asset.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {(asset.engines || []).slice(0, 2).map((e) => (
              <span key={e} className="chip bg-slate-900/80 border-teal-500/30 text-teal-300">{e}</span>
            ))}
          </div>
          <div className="absolute top-2 right-2 chip bg-slate-900/80 border-amber-500/40 text-amber-300">
            ${asset.price?.toFixed?.(0) ?? asset.price}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2 group-hover:text-teal-300 transition-colors">
            {asset.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1">by {asset.creator_name}</p>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{asset.rating?.toFixed?.(1)}</span>
            <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" />{asset.downloads}</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{asset.likes}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
