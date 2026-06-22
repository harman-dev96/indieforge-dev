import React, { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts";
import { Upload, DollarSign, Eye, Download, Plus } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const ENGINES = ["Unity", "Unreal", "Godot", "Blender"];
const FORMATS = ["FBX", "OBJ", "GLTF", "BLEND", "ZIP"];

export default function CreatorDashboard() {
  const { user, refresh } = useAuth();
  const [assets, setAssets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "characters", price: 9, polygon_count: 5000,
    art_style: "Realistic", engines: ["Unity"], formats: ["FBX"], thumbnail_url: "", preview_model_url: "", tags: "",
  });

  const load = () => {
    api.get("/my/assets").then((r) => setAssets(r.data));
    api.get("/my/analytics").then((r) => setAnalytics(r.data));
  };
  useEffect(() => { load(); }, []);

  const onUploadThumb = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file); fd.append("kind", "image");
    try {
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, thumbnail_url: `${process.env.REACT_APP_BACKEND_URL}${data.url}` }));
      toast.success("Thumbnail uploaded");
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const onUploadModel = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file); fd.append("kind", "model");
    try {
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, preview_model_url: `${process.env.REACT_APP_BACKEND_URL}${data.url}` }));
      toast.success("3D model uploaded");
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), polygon_count: parseInt(form.polygon_count || 0), tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean) };
      await api.post("/assets", payload);
      toast.success("Asset published!"); setOpen(false);
      setForm({ ...form, title: "", description: "", thumbnail_url: "", tags: "" });
      refresh(); load();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setSubmitting(false); }
  };

  const toggle = (key, value) => setForm((f) => ({
    ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value]
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10" data-testid="creator-dashboard-page">
      <header className="flex items-end justify-between mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-teal-400">Creator Studio</span>
          <h1 className="font-display text-4xl font-bold tracking-tighter">Your assets</h1>
        </div>
        <button data-testid="open-upload-button" onClick={() => setOpen(true)} className="btn-primary h-11"><Plus className="w-4 h-4" />Upload asset</button>
      </header>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <Stat icon={Upload} label="Assets"     value={analytics?.total_assets ?? 0} color="text-teal-300" />
        <Stat icon={Download} label="Downloads" value={analytics?.total_downloads ?? 0} color="text-purple-300" />
        <Stat icon={DollarSign} label="Revenue" value={`$${(analytics?.total_revenue ?? 0).toFixed(2)}`} color="text-amber-300" />
        <Stat icon={Eye} label="Views"          value={analytics?.total_views ?? 0} color="text-teal-300" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-10">
        <div className="glass rounded-md p-5">
          <h3 className="font-display font-semibold mb-3">Revenue last 7 days</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #14B8A6" }} />
                <Line type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} dot={{ fill: "#14B8A6", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-md p-5">
          <h3 className="font-display font-semibold mb-3">Downloads by asset</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assets.slice(0, 6).map((a) => ({ name: a.title.slice(0, 12), downloads: a.downloads }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #14B8A6" }} />
                <Bar dataKey="downloads" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h2 className="font-display text-2xl font-bold mb-4">My assets</h2>
      {assets.length === 0 && <p className="text-slate-400">You haven't published anything yet. Upload your first asset to start earning.</p>}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
        {assets.map((a) => (
          <div key={a.id} className="glass rounded-md overflow-hidden">
            <img src={a.thumbnail_url} className="w-full aspect-[4/3] object-cover" alt="" />
            <div className="p-4">
              <div className="font-display font-semibold text-sm line-clamp-1">{a.title}</div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>${a.price}</span><span>{a.downloads} downloads</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)} data-testid="upload-modal">
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-2xl glass-strong rounded-md p-7 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-2xl font-bold mb-5">Upload new asset</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Title"><input data-testid="upload-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="inp" /></Field>
              <Field label="Price (USD)"><input data-testid="upload-price" type="number" min="0" step="0.5" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="inp" /></Field>
              <Field label="Category">
                <select data-testid="upload-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="inp">
                  {["characters","environments","weapons","vehicles","buildings","nature","animals","animations","vfx","props"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Art style">
                <select data-testid="upload-style" value={form.art_style} onChange={(e) => setForm({ ...form, art_style: e.target.value })} className="inp">
                  {["Realistic","Stylized","Sci-Fi","Cartoon","Low Poly"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Polygon count"><input data-testid="upload-poly" type="number" value={form.polygon_count} onChange={(e) => setForm({ ...form, polygon_count: e.target.value })} className="inp" /></Field>
              <Field label="Tags (comma separated)"><input data-testid="upload-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="inp" /></Field>
            </div>
            <Field label="Description"><textarea data-testid="upload-description" required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="inp" /></Field>

            <Field label="Engines">
              <div className="flex flex-wrap gap-2">
                {ENGINES.map((e) => (
                  <button key={e} type="button" onClick={() => toggle("engines", e)}
                    className={`chip ${form.engines.includes(e) ? "border-teal-400 text-teal-300" : ""}`}>{e}</button>
                ))}
              </div>
            </Field>
            <Field label="Formats">
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <button key={f} type="button" onClick={() => toggle("formats", f)}
                    className={`chip ${form.formats.includes(f) ? "border-purple-400 text-purple-300" : ""}`}>.{f}</button>
                ))}
              </div>
            </Field>

            <Field label="Thumbnail image">
              <input data-testid="upload-thumbnail" type="file" accept="image/*" onChange={onUploadThumb}
                className="text-sm text-slate-300" />
              {form.thumbnail_url && <img src={form.thumbnail_url} alt="" className="mt-3 w-32 aspect-[4/3] object-cover rounded" />}
            </Field>

            <Field label="3D preview model (GLB/GLTF, optional)">
              <input data-testid="upload-model" type="file" accept=".glb,.gltf" onChange={onUploadModel}
                className="text-sm text-slate-300" />
              {form.preview_model_url && <p className="text-xs text-teal-300 mt-2">Model ready · will load in viewer.</p>}
            </Field>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setOpen(false)} className="btn-outline-teal h-10">Cancel</button>
              <button data-testid="upload-submit" type="submit" disabled={submitting} className="btn-primary h-10">{submitting ? "Publishing…" : "Publish asset"}</button>
            </div>

            <style>{`
              .inp { width:100%; height:40px; padding:0 12px; border-radius:6px; background:#0F172A; border:1px solid #334155; font-size:13px; color:#E2E8F0; }
              .inp:focus { outline:none; border-color:#14B8A6; }
              textarea.inp { height:auto; padding-top:8px; padding-bottom:8px; }
            `}</style>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="glass rounded-md p-5">
      <Icon className={`w-5 h-5 ${color}`} />
      <div className="font-display font-bold text-2xl mt-2">{value}</div>
      <div className="text-xs text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div className="mt-3 sm:mt-0 col-span-full sm:col-span-1">
      <label className="text-xs uppercase tracking-widest text-slate-400 block mb-1">{label}</label>
      {children}
    </div>
  );
}
