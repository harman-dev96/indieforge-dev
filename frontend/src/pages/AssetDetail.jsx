import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart, Download, Star, Eye, ShoppingCart, Box } from "lucide-react";
import AssetViewer from "../components/AssetViewer";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [asset, setAsset] = useState(null);
  const [wireframe, setWireframe] = useState(false);
  const [lighting, setLighting] = useState("purple");
  const [tab, setTab] = useState("description");
  const [purchasing, setPurchasing] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => { api.get(`/assets/${id}`).then((r) => setAsset(r.data)); }, [id]);

  const purchase = async () => {
    if (!user) return navigate("/login");
    setPurchasing(true);
    try {
      const { data } = await api.post("/checkout/asset", { asset_id: id, origin_url: window.location.origin });
      if (data.free) { toast.success("Added to your library!"); navigate("/dashboard"); }
      else if (data.url) window.location.href = data.url;
    } catch (e) { toast.error(formatApiError(e)); }
    finally { setPurchasing(false); }
  };

  const toggleFav = async () => {
    if (!user) return navigate("/login");
    try {
      const { data } = await api.post(`/favorites/${id}`);
      setFavorited(data.favorited);
      toast.success(data.favorited ? "Saved to favorites" : "Removed from favorites");
    } catch (e) { toast.error(formatApiError(e)); }
  };

  if (!asset) return <div className="p-10 text-slate-400">Loading…</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10" data-testid="asset-detail-page">
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
        <div>
          <div className="aspect-square rounded-md overflow-hidden glass relative">
            <AssetViewer wireframe={wireframe} lighting={lighting} modelUrl={asset.preview_model_url} />
            <div className="absolute top-3 left-3 flex gap-2">
              <button data-testid="viewer-wireframe-toggle" onClick={() => setWireframe((w) => !w)}
                className={`chip ${wireframe ? "border-teal-400 text-teal-300" : ""}`}>Wireframe</button>
              <button data-testid="viewer-lighting-purple" onClick={() => setLighting("purple")}
                className={`chip ${lighting === "purple" ? "border-purple-400 text-purple-300" : ""}`}>Purple</button>
              <button data-testid="viewer-lighting-teal" onClick={() => setLighting("teal")}
                className={`chip ${lighting === "teal" ? "border-teal-400 text-teal-300" : ""}`}>Teal</button>
              <button data-testid="viewer-lighting-amber" onClick={() => setLighting("amber")}
                className={`chip ${lighting === "amber" ? "border-amber-400 text-amber-300" : ""}`}>Amber</button>
            </div>
          </div>

          <div className="mt-6 glass rounded-md p-2 flex flex-wrap">
            {["description", "specs", "reviews", "changelog"].map((t) => (
              <button key={t} data-testid={`tab-${t}`} onClick={() => setTab(t)}
                className={`flex-1 min-w-[100px] h-10 px-4 rounded-md text-sm font-medium capitalize transition-colors
                  ${tab === t ? "bg-purple-600/20 text-purple-200" : "text-slate-300 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="glass rounded-md p-6 mt-3 min-h-[180px]">
            {tab === "description" && <p className="text-slate-300 leading-relaxed">{asset.description}</p>}
            {tab === "specs" && (
              <ul className="text-sm grid grid-cols-2 gap-y-2 gap-x-6 text-slate-300">
                <li><span className="text-slate-500">Polygons:</span> {asset.polygon_count?.toLocaleString()}</li>
                <li><span className="text-slate-500">Art style:</span> {asset.art_style}</li>
                <li><span className="text-slate-500">Engines:</span> {asset.engines?.join(", ")}</li>
                <li><span className="text-slate-500">Formats:</span> {asset.formats?.join(", ")}</li>
                <li><span className="text-slate-500">Software:</span> {asset.software?.join(", ") || "—"}</li>
                <li><span className="text-slate-500">License:</span> Royalty-free commercial</li>
              </ul>
            )}
            {tab === "reviews" && (
              <div className="space-y-4">
                {(asset.reviews || []).length === 0 && <p className="text-slate-400">No reviews yet.</p>}
                {(asset.reviews || []).map((r) => (
                  <div key={r.id} className="border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.user_name}</span>
                      <span className="flex items-center text-amber-400">
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={`star-${r.id}-${i}`} className="w-3 h-3 fill-amber-400" />)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
            {tab === "changelog" && (
              <ul className="text-sm space-y-2 text-slate-300">
                <li><span className="chip border-teal-400 text-teal-300 mr-2">v1.2</span>Added GLTF export and LOD variants.</li>
                <li><span className="chip border-purple-400 text-purple-300 mr-2">v1.1</span>Improved PBR textures, rigging.</li>
                <li><span className="chip mr-2">v1.0</span>Initial release.</li>
              </ul>
            )}
          </div>
        </div>

        <aside>
          <div className="glass rounded-md p-6">
            <h1 className="font-display text-3xl font-bold tracking-tight">{asset.title}</h1>
            <Link to={`/creators/${asset.creator_id}`} className="flex items-center gap-2 mt-2 text-slate-400 hover:text-teal-300">
              <img src={asset.creator_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${asset.creator_id}`}
                className="w-7 h-7 rounded object-cover" alt="" /> {asset.creator_name}
            </Link>

            <div className="grid grid-cols-3 gap-4 text-center mt-5 py-4 border-y border-slate-800">
              <div><div className="text-amber-300 font-display font-bold flex items-center justify-center gap-1"><Star className="w-4 h-4 fill-amber-300" />{asset.rating?.toFixed(1)}</div><div className="text-xs text-slate-500">{asset.reviews_count} reviews</div></div>
              <div><div className="text-teal-300 font-display font-bold flex items-center justify-center gap-1"><Download className="w-4 h-4" />{asset.downloads}</div><div className="text-xs text-slate-500">downloads</div></div>
              <div><div className="text-purple-300 font-display font-bold flex items-center justify-center gap-1"><Eye className="w-4 h-4" />{asset.views}</div><div className="text-xs text-slate-500">views</div></div>
            </div>

            <div className="mt-5">
              <div className="text-3xl font-display font-bold">${asset.price}</div>
              <div className="text-xs text-slate-500">One-time purchase · royalty-free</div>
            </div>

            <button data-testid="buy-button" onClick={purchase} disabled={purchasing}
              className="btn-primary w-full mt-5 h-12 text-base">
              <ShoppingCart className="w-5 h-5" />
              {purchasing ? "Redirecting…" : (asset.price > 0 ? "Buy now" : "Get free asset")}
            </button>
            <button data-testid="favorite-button" onClick={toggleFav} className="btn-outline-teal w-full mt-2 h-11 text-sm">
              <Heart className={`w-4 h-4 ${favorited ? "fill-teal-400" : ""}`} /> {favorited ? "Saved" : "Add to favorites"}
            </button>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Compatible with</div>
              <div className="flex flex-wrap gap-2">
                {asset.engines?.map((e) => <span key={e} className="chip border-teal-400/40 text-teal-300">{e}</span>)}
                {asset.formats?.map((f) => <span key={f} className="chip border-purple-400/40 text-purple-300">.{f}</span>)}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
