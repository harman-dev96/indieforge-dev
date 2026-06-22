# IndieForge 3D — Product Requirements Document

## Problem Statement
Production-ready web platform for indie game developers to discover, preview, purchase, download, and commission high-quality 3D assets. Combines premium feel of Sketchfab, Fab, ArtStation Marketplace, and Unity Asset Store.

## Stack (delivered)
- Backend: FastAPI + MongoDB (motor)
- Frontend: React 19 + JS + TailwindCSS + Shadcn UI + Framer Motion + React Three Fiber 9 + Drei
- Auth: JWT (httpOnly cookie + Bearer)
- Payments: Stripe (via `emergentintegrations` — test key `sk_test_emergent`)
- Storage: Emergent object storage for 3D files + images

## Theme
Dark futuristic + glassmorphism + cyberpunk
- Purple #7C3AED · Teal #14B8A6 · Amber #F59E0B · BG #0F172A · Surface #1E293B
- Fonts: Space Grotesk (display) + Inter (body) + JetBrains Mono

## User personas
1. Indie game developer — browses, buys, downloads, hires
2. 3D artist / creator — uploads, sells, tracks analytics, takes commissions
3. Studio — subscribes to Studio plan, manages team usage

## What's implemented (2026-02)
- Sticky glassmorphic Navbar with logo, nav links, search, login/signup
- Hero section with R3F interactive 3D scene (spaceship, robot, sword, treasure chest), gradient text, stats
- 10-category grid (characters, environments, weapons, vehicles, buildings, nature, animals, animations, vfx, props)
- Trending assets carousel + AssetCards with engine/format/price/rating/downloads/likes
- Marketplace browse with advanced filters (search, category, price min/max, engine, format, art style, sort)
- Asset Detail page with Three.js viewer (wireframe + lighting presets), tabs (description/specs/reviews/changelog), buy + favorite
- JWT auth (register/login/logout/me) with bcrypt + httpOnly cookies
- Pricing page with Free, Pro $9, Studio $29 → Stripe checkout subscriptions
- Stripe one-time asset purchases + polling status flow + payment success page
- User Dashboard: purchases / favorites / invoices / notifications
- Creator Dashboard: upload modal (image upload via Emergent storage), analytics (Recharts line + bar), assets list
- Commission marketplace: post project + browse open commissions
- Community page: forums / jams / showcases / tutorials
- Blog page: 4 sample posts
- Footer with newsletter + social links
- Featured Creators section + creator profiles
- Sample data seeded (12 assets, 5 creators, demo user, admin)

## Backlog (P0/P1/P2)
P1
- Real Three.js GLTF/GLB viewer loading actual uploaded models (currently stylized placeholder geometry)
- Asset bulk download zip + signed file delivery to purchasers only
- Commission proposals + messaging UI (real-time)
- Creator profile detail page (currently only featured grid)
P2
- Game jam submissions + leaderboard
- Tutorials with progress tracking
- Per-asset reviews submission form (UI only — backend ready)
- Saved searches in dashboard

## Next Actions
- Add real-time messaging for commissions
- Connect Three.js viewer to user-uploaded GLB previews
- Add Stripe webhook signature verification in production
