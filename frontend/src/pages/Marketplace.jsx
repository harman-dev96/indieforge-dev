import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AssetCard from "../components/AssetCard";
import { api } from "../lib/api";

const ENGINES = ["Unity", "Unreal", "Godot", "Blender"];
const FORMATS = ["FBX", "OBJ", "GLTF", "BLEND", "ZIP"];
const STYLES = ["Realistic", "Stylized", "Sci-Fi", "Cartoon", "Low Poly"];

export default function Marketplace() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: params.get("category") || "all",
    search: params.get("search") || "",
    min_price: "",
    max_price: "",
    art_style: "",
    engine: "",
    file_format: "",
    sort: "trending",
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => { api.get("/categories").then((r) => setCategories(r.data)); }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setLoading(true);
    const q = {};
    Object.entries(filters).forEach(([k, v]) => { if (v !== "" && v !== "all") q[k] = v; });
    api.get("/assets", { params: q }).then((r) => {
      setItems(r.data.items); setTotal(r.data.total); setLoading(false);
    });
    const p = {};
    if (filters.category !== "all") p.category = filters.category;
    if (filters.search) p.search = filters.search;
    setParams(p, { replace: true });
  }, [filters]);

  const update = (k, v) => setFilters((s) => ({ ...s, [k]: v }));

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10" data-testid="marketplace-page">
      <header className="mb-8">
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">Marketplace</h1>
        <p className="text-slate-400 mt-2">{total} assets ready for your next project</p>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="space-y-6">
          <div className="glass rounded-md p-4">
            <label className="text-xs uppercase tracking-widest text-slate-400">Search</label>
            <input data-testid="filter-search" value={filters.search}
              onChange={(e) => update("search", e.target.value)}
              className="w-full mt-2 h-9 px-3 rounded bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-teal-500" />
          </div>

          <FilterBlock title="Category">
            <select data-testid="filter-category" value={filters.category} onChange={(e) => update("category", e.target.value)}
              className="select-styled">
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </FilterBlock>

          <FilterBlock title="Price">
            <div className="flex gap-2">
              <input data-testid="filter-min-price" type="number" placeholder="Min" value={filters.min_price}
                onChange={(e) => update("min_price", e.target.value)} className="input-styled" />
              <input data-testid="filter-max-price" type="number" placeholder="Max" value={filters.max_price}
                onChange={(e) => update("max_price", e.target.value)} className="input-styled" />
            </div>
          </FilterBlock>

          <FilterBlock title="Engine">
            <select data-testid="filter-engine" value={filters.engine} onChange={(e) => update("engine", e.target.value)}
              className="select-styled">
              <option value="">Any engine</option>
              {ENGINES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </FilterBlock>

          <FilterBlock title="File format">
            <select data-testid="filter-format" value={filters.file_format} onChange={(e) => update("file_format", e.target.value)}
              className="select-styled">
              <option value="">Any format</option>
              {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </FilterBlock>

          <FilterBlock title="Art style">
            <select data-testid="filter-style" value={filters.art_style} onChange={(e) => update("art_style", e.target.value)}
              className="select-styled">
              <option value="">Any style</option>
              {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FilterBlock>

          <button data-testid="filter-reset"
            onClick={() => setFilters({ category: "all", search: "", min_price: "", max_price: "", art_style: "", engine: "", file_format: "", sort: "trending" })}
            className="btn-outline-teal w-full h-9 text-sm">Reset filters</button>
        </aside>

        <main>
          <div className="flex justify-between items-center mb-5">
            <div className="text-sm text-slate-400">{loading ? "Loading…" : `${items.length} of ${total} results`}</div>
            <select data-testid="filter-sort" value={filters.sort} onChange={(e) => update("sort", e.target.value)}
              className="select-styled w-44">
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="price_low">Price: low → high</option>
              <option value="price_high">Price: high → low</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((a) => <AssetCard key={a.id} asset={a} />)}
          </div>
          {!loading && items.length === 0 && (
            <div className="text-center py-24 text-slate-400" data-testid="empty-results">No assets match these filters.</div>
          )}
        </main>
      </div>

      <style>{`
        .input-styled, .select-styled { width:100%; height:36px; padding:0 12px; border-radius:6px; background:#0F172A; border:1px solid #334155; font-size:13px; color:#E2E8F0; }
        .input-styled:focus, .select-styled:focus { outline:none; border-color:#14B8A6; }
      `}</style>
    </div>
  );
}

function FilterBlock({ title, children }) {
  return (
    <div className="glass rounded-md p-4">
      <label className="text-xs uppercase tracking-widest text-slate-400">{title}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
