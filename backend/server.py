from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import secrets
import bcrypt
import jwt
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, UploadFile, File, Form, Query, Header
from fastapi.responses import JSONResponse, Response as FastAPIResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse, CheckoutStatusResponse,
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
APP_NAME = os.environ.get("APP_NAME", "indieforge3d")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"

SUBSCRIPTION_PLANS = {
    "free":   {"name": "Free",   "price": 0.0,  "interval": "month"},
    "pro":    {"name": "Pro",    "price": 9.0,  "interval": "month"},
    "studio": {"name": "Studio", "price": 29.0, "interval": "month"},
}

app = FastAPI(title="IndieForge 3D API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("indieforge")

# ---------------------------------------------------------------------------
# Object Storage
# ---------------------------------------------------------------------------
_storage_key: Optional[str] = None


def init_storage() -> Optional[str]:
    global _storage_key
    if _storage_key:
        return _storage_key
    if not EMERGENT_LLM_KEY:
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        return _storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> Dict[str, Any]:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not configured")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not configured")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, "email": email, "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def serialize_user(u: dict) -> dict:
    uid = u.get("id") or (str(u["_id"]) if "_id" in u else None)
    return {
        "id": uid,
        "email": u["email"],
        "name": u.get("name", ""),
        "role": u.get("role", "user"),
        "avatar_url": u.get("avatar_url"),
        "bio": u.get("bio", ""),
        "is_creator": u.get("is_creator", False),
        "plan": u.get("plan", "free"),
        "followers": u.get("followers", 0),
        "rating": u.get("rating", 0),
        "created_at": u.get("created_at"),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class AssetCreate(BaseModel):
    title: str
    description: str
    category: str
    price: float
    polygon_count: Optional[int] = 0
    art_style: Optional[str] = "Realistic"
    engines: List[str] = []
    formats: List[str] = []
    software: List[str] = []
    thumbnail_url: Optional[str] = None
    preview_model_url: Optional[str] = None
    tags: List[str] = []

class CheckoutAssetIn(BaseModel):
    asset_id: str
    origin_url: str

class CheckoutSubscriptionIn(BaseModel):
    plan: str
    origin_url: str

class CommissionCreate(BaseModel):
    title: str
    description: str
    budget: float
    deadline_days: int = 30
    category: str = "Characters"


# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------
def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token", value=token, httponly=True,
        secure=True, samesite="none", max_age=604800, path="/",
    )


@api_router.post("/auth/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "role": "user",
        "is_creator": False,
        "plan": "free",
        "avatar_url": None,
        "bio": "",
        "followers": 0,
        "rating": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    return {"user": serialize_user(user_doc), "token": token}


@api_router.post("/auth/login")
async def login(data: LoginIn, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["id"], email)
    set_auth_cookie(response, token)
    return {"user": serialize_user(user), "token": token}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return serialize_user(user)


@api_router.post("/auth/become-creator")
async def become_creator(user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$set": {"is_creator": True}})
    user["is_creator"] = True
    return serialize_user(user)


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
CATEGORIES = [
    {"slug": "characters",   "name": "Characters",   "icon": "User"},
    {"slug": "environments", "name": "Environments", "icon": "Mountain"},
    {"slug": "weapons",      "name": "Weapons",      "icon": "Swords"},
    {"slug": "vehicles",     "name": "Vehicles",     "icon": "Car"},
    {"slug": "buildings",    "name": "Buildings",    "icon": "Building2"},
    {"slug": "nature",       "name": "Nature",       "icon": "TreePine"},
    {"slug": "animals",      "name": "Animals",      "icon": "Cat"},
    {"slug": "animations",   "name": "Animations",   "icon": "Activity"},
    {"slug": "vfx",          "name": "VFX",          "icon": "Sparkles"},
    {"slug": "props",        "name": "Props",        "icon": "Package"},
]


@api_router.get("/categories")
async def list_categories():
    counts = {}
    pipeline = [{"$group": {"_id": "$category", "n": {"$sum": 1}}}]
    async for row in db.assets.aggregate(pipeline):
        counts[row["_id"]] = row["n"]
    return [{**c, "count": counts.get(c["slug"], 0)} for c in CATEGORIES]


# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------
def asset_to_dict(a: dict) -> dict:
    a.pop("_id", None)
    return a


@api_router.get("/assets")
async def list_assets(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    art_style: Optional[str] = None,
    engine: Optional[str] = None,
    file_format: Optional[str] = None,
    sort: Optional[str] = "trending",
    limit: int = 24,
    skip: int = 0,
):
    q: Dict[str, Any] = {}
    if category and category != "all":
        q["category"] = category
    if search:
        q["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
        ]
    if min_price is not None:
        q.setdefault("price", {})["$gte"] = min_price
    if max_price is not None:
        q.setdefault("price", {})["$lte"] = max_price
    if art_style:
        q["art_style"] = art_style
    if engine:
        q["engines"] = engine
    if file_format:
        q["formats"] = file_format

    sort_key = {
        "trending": [("downloads", -1)],
        "newest":   [("created_at", -1)],
        "price_low": [("price", 1)],
        "price_high": [("price", -1)],
        "rating":  [("rating", -1)],
    }.get(sort, [("downloads", -1)])

    total = await db.assets.count_documents(q)
    cursor = db.assets.find(q, {"_id": 0}).sort(sort_key).skip(skip).limit(limit)
    items = [asset_to_dict(a) async for a in cursor]
    return {"items": items, "total": total}


@api_router.get("/assets/trending")
async def trending_assets():
    cursor = db.assets.find({}, {"_id": 0}).sort([("downloads", -1)]).limit(8)
    return [asset_to_dict(a) async for a in cursor]


@api_router.get("/assets/{asset_id}")
async def asset_detail(asset_id: str):
    a = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")
    # Reviews
    reviews_cur = db.reviews.find({"asset_id": asset_id}, {"_id": 0}).sort([("created_at", -1)]).limit(20)
    a["reviews"] = [r async for r in reviews_cur]
    return a


@api_router.post("/assets")
async def create_asset(data: AssetCreate, user: dict = Depends(get_current_user)):
    asset_id = str(uuid.uuid4())
    doc = {
        "id": asset_id,
        "creator_id": user["id"],
        "creator_name": user.get("name"),
        "creator_avatar": user.get("avatar_url"),
        **data.model_dump(),
        "rating": 4.5,
        "reviews_count": 0,
        "downloads": 0,
        "likes": 0,
        "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.assets.insert_one(doc)
    await db.users.update_one({"id": user["id"]}, {"$set": {"is_creator": True}})
    return asset_to_dict(dict(doc))


@api_router.get("/my/assets")
async def my_assets(user: dict = Depends(get_current_user)):
    cur = db.assets.find({"creator_id": user["id"]}, {"_id": 0}).sort([("created_at", -1)])
    return [asset_to_dict(a) async for a in cur]


@api_router.get("/my/analytics")
async def my_analytics(user: dict = Depends(get_current_user)):
    cur = db.assets.find({"creator_id": user["id"]}, {"_id": 0})
    assets = [a async for a in cur]
    total_downloads = sum(a.get("downloads", 0) for a in assets)
    total_revenue = sum(a.get("downloads", 0) * a.get("price", 0) * 0.7 for a in assets)
    total_views = sum(a.get("views", 0) for a in assets)
    # Build last 7 days revenue chart (synthetic distribution)
    today = datetime.now(timezone.utc).date()
    chart = []
    base = max(total_revenue / 14, 5)
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        chart.append({"date": d.isoformat(), "revenue": round(base * (0.6 + (i % 5) * 0.2), 2)})
    return {
        "total_assets": len(assets),
        "total_downloads": total_downloads,
        "total_revenue": round(total_revenue, 2),
        "total_views": total_views,
        "chart": chart,
    }


# ---------------------------------------------------------------------------
# Favorites & Purchases
# ---------------------------------------------------------------------------
@api_router.post("/favorites/{asset_id}")
async def toggle_favorite(asset_id: str, user: dict = Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": user["id"], "asset_id": asset_id})
    if existing:
        await db.favorites.delete_one({"_id": existing["_id"]})
        await db.assets.update_one({"id": asset_id}, {"$inc": {"likes": -1}})
        return {"favorited": False}
    await db.favorites.insert_one({
        "user_id": user["id"], "asset_id": asset_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.assets.update_one({"id": asset_id}, {"$inc": {"likes": 1}})
    return {"favorited": True}


@api_router.get("/my/favorites")
async def my_favorites(user: dict = Depends(get_current_user)):
    favs = [f["asset_id"] async for f in db.favorites.find({"user_id": user["id"]})]
    if not favs:
        return []
    cur = db.assets.find({"id": {"$in": favs}}, {"_id": 0})
    return [asset_to_dict(a) async for a in cur]


@api_router.get("/my/purchases")
async def my_purchases(user: dict = Depends(get_current_user)):
    cur = db.purchases.find({"user_id": user["id"]}, {"_id": 0}).sort([("created_at", -1)])
    purchases = [p async for p in cur]
    asset_ids = list({p["asset_id"] for p in purchases})
    assets_map = {}
    if asset_ids:
        async for a in db.assets.find({"id": {"$in": asset_ids}}, {"_id": 0}):
            assets_map[a["id"]] = asset_to_dict(a)
    for p in purchases:
        p["asset"] = assets_map.get(p["asset_id"])
    return purchases


# ---------------------------------------------------------------------------
# Featured Creators
# ---------------------------------------------------------------------------
@api_router.get("/creators/featured")
async def featured_creators():
    cur = db.users.find({"is_creator": True}, {"_id": 0, "password_hash": 0}).sort([("followers", -1)]).limit(6)
    return [serialize_user(u) async for u in cur]


@api_router.get("/creators/{creator_id}")
async def creator_detail(creator_id: str):
    u = await db.users.find_one({"id": creator_id})
    if not u:
        raise HTTPException(status_code=404, detail="Creator not found")
    portfolio_cur = db.assets.find({"creator_id": creator_id}, {"_id": 0})
    portfolio = [asset_to_dict(a) async for a in portfolio_cur]
    total_downloads = sum(a.get("downloads", 0) for a in portfolio)
    total_likes = sum(a.get("likes", 0) for a in portfolio)
    avg_rating = round(sum(a.get("rating", 0) for a in portfolio) / max(len(portfolio), 1), 2)
    return {
        **serialize_user(u),
        "portfolio": portfolio,
        "total_downloads": total_downloads,
        "total_likes": total_likes,
        "total_assets": len(portfolio),
        "avg_asset_rating": avg_rating,
    }


# ---------------------------------------------------------------------------
# Commissions
# ---------------------------------------------------------------------------
@api_router.post("/commissions")
async def create_commission(data: CommissionCreate, user: dict = Depends(get_current_user)):
    cid = str(uuid.uuid4())
    doc = {
        "id": cid,
        "client_id": user["id"],
        "client_name": user.get("name"),
        **data.model_dump(),
        "status": "open",
        "proposals": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.commissions.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/commissions")
async def list_commissions():
    cur = db.commissions.find({}, {"_id": 0}).sort([("created_at", -1)]).limit(50)
    return [c async for c in cur]


# ---------------------------------------------------------------------------
# File Upload (object storage)
# ---------------------------------------------------------------------------
ALLOWED_3D = {"fbx", "obj", "blend", "gltf", "glb", "zip"}
ALLOWED_IMG = {"png", "jpg", "jpeg", "webp"}


@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), kind: str = Form("model"),
                       user: dict = Depends(get_current_user)):
    ext = (file.filename.rsplit(".", 1)[-1] or "bin").lower()
    if kind == "image" and ext not in ALLOWED_IMG:
        raise HTTPException(400, "Invalid image format")
    if kind == "model" and ext not in ALLOWED_3D:
        raise HTTPException(400, "Invalid 3D model format")
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{user['id']}/{file_id}.{ext}"
    data = await file.read()
    try:
        result = put_object(path, data, file.content_type or "application/octet-stream")
    except Exception as e:
        logger.error(f"upload failed: {e}")
        raise HTTPException(500, "Upload failed")
    backend_base = os.environ.get("PUBLIC_BACKEND_URL", "")
    public_url = f"/api/files/{result['path']}"
    await db.files.insert_one({
        "id": file_id,
        "user_id": user["id"],
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "kind": kind,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": file_id, "url": public_url, "path": result["path"]}


@api_router.get("/files/{path:path}")
async def download_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(404, "File not found")
    data, ctype = get_object(path)
    return FastAPIResponse(content=data, media_type=record.get("content_type", ctype))


# ---------------------------------------------------------------------------
# Payments (Stripe)
# ---------------------------------------------------------------------------
def make_stripe(request: Request) -> StripeCheckout:
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    return StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)


@api_router.post("/checkout/asset")
async def checkout_asset(data: CheckoutAssetIn, request: Request, user: dict = Depends(get_current_user)):
    asset = await db.assets.find_one({"id": data.asset_id})
    if not asset:
        raise HTTPException(404, "Asset not found")
    amount = float(asset["price"])
    if amount <= 0:
        # Free asset → grant immediately
        await db.purchases.insert_one({
            "id": str(uuid.uuid4()), "user_id": user["id"], "asset_id": asset["id"],
            "amount": 0.0, "session_id": None, "status": "paid",
            "kind": "asset",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.assets.update_one({"id": asset["id"]}, {"$inc": {"downloads": 1}})
        return {"free": True, "url": None}

    origin = data.origin_url.rstrip("/")
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/assets/{asset['id']}"
    stripe = make_stripe(request)
    req = CheckoutSessionRequest(
        amount=amount, currency="usd",
        success_url=success_url, cancel_url=cancel_url,
        metadata={"kind": "asset", "asset_id": asset["id"], "user_id": user["id"]},
    )
    session: CheckoutSessionResponse = await stripe.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["id"],
        "kind": "asset",
        "asset_id": asset["id"],
        "amount": amount,
        "currency": "usd",
        "payment_status": "initiated",
        "status": "open",
        "metadata": {"asset_id": asset["id"]},
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": session.url, "session_id": session.session_id}


@api_router.post("/checkout/subscription")
async def checkout_subscription(data: CheckoutSubscriptionIn, request: Request, user: dict = Depends(get_current_user)):
    plan = data.plan.lower()
    if plan not in SUBSCRIPTION_PLANS:
        raise HTTPException(400, "Invalid plan")
    info = SUBSCRIPTION_PLANS[plan]
    if info["price"] <= 0:
        await db.users.update_one({"id": user["id"]}, {"$set": {"plan": "free"}})
        return {"free": True, "url": None}

    origin = data.origin_url.rstrip("/")
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing"
    stripe = make_stripe(request)
    req = CheckoutSessionRequest(
        amount=info["price"], currency="usd",
        success_url=success_url, cancel_url=cancel_url,
        metadata={"kind": "subscription", "plan": plan, "user_id": user["id"]},
    )
    session: CheckoutSessionResponse = await stripe.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["id"],
        "kind": "subscription",
        "plan": plan,
        "amount": info["price"],
        "currency": "usd",
        "payment_status": "initiated",
        "status": "open",
        "metadata": {"plan": plan},
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": session.url, "session_id": session.session_id}


@api_router.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx:
        raise HTTPException(404, "Transaction not found")
    if tx.get("payment_status") == "paid":
        return {"payment_status": "paid", "status": tx.get("status", "complete"), "kind": tx.get("kind")}
    stripe = make_stripe(request)
    status: CheckoutStatusResponse = await stripe.get_checkout_status(session_id)
    update = {"payment_status": status.payment_status, "status": status.status}
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update})

    # Grant entitlement (idempotent: only if not already paid)
    if status.payment_status == "paid" and tx.get("payment_status") != "paid":
        if tx["kind"] == "asset":
            await db.purchases.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": tx["user_id"],
                "asset_id": tx["asset_id"],
                "amount": tx["amount"],
                "session_id": session_id,
                "status": "paid",
                "kind": "asset",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            await db.assets.update_one({"id": tx["asset_id"]}, {"$inc": {"downloads": 1}})
        elif tx["kind"] == "subscription":
            await db.users.update_one({"id": tx["user_id"]}, {"$set": {"plan": tx["plan"]}})

    return {
        "payment_status": status.payment_status,
        "status": status.status,
        "kind": tx.get("kind"),
        "amount": status.amount_total / 100 if status.amount_total else tx["amount"],
    }


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    stripe = make_stripe(request)
    try:
        await stripe.handle_webhook(body, sig)
    except Exception as e:
        logger.error(f"webhook error: {e}")
    return {"received": True}


# ---------------------------------------------------------------------------
# Seed sample data
# ---------------------------------------------------------------------------
SAMPLE_CREATORS = [
    {"name": "Neon Architect", "email": "neon@indieforge.dev", "bio": "Cyberpunk specialist crafting futuristic environments and props.",
     "avatar_url": "https://images.unsplash.com/photo-1707636920649-09a0ba44187a?crop=entropy&cs=srgb&fm=jpg&w=400&q=80",
     "followers": 12400, "rating": 4.9},
    {"name": "Cyber Forge", "email": "forge@indieforge.dev", "bio": "Industrial mechs and combat vehicles.",
     "avatar_url": "https://images.pexels.com/photos/7676504/pexels-photo-7676504.jpeg?auto=compress&cs=tinysrgb&w=400",
     "followers": 8900, "rating": 4.8},
    {"name": "Void Models", "email": "void@indieforge.dev", "bio": "Stylized characters and animations.",
     "avatar_url": "https://images.unsplash.com/photo-1601637155580-ac6c49428450?crop=entropy&cs=srgb&fm=jpg&w=400&q=80",
     "followers": 6200, "rating": 4.7},
    {"name": "Quantum Sculpt", "email": "quantum@indieforge.dev", "bio": "Hard-surface weapons, ships and exotic props.",
     "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=srgb&fm=jpg&w=400&q=80",
     "followers": 5400, "rating": 4.7},
]

SAMPLE_ASSETS = [
    {"title": "Mech Striker MK-VII", "category": "vehicles", "price": 49.0, "polygon_count": 78000,
     "art_style": "Realistic", "engines": ["Unity", "Unreal"], "formats": ["FBX", "OBJ"],
     "tags": ["mech", "robot", "combat"],
     "thumbnail_url": "https://images.unsplash.com/photo-1712971724897-a9ae95e0ec44?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
     "description": "AAA-grade hard-surface mech with PBR textures, rigged for Unity and Unreal."},
    {"title": "Plasma Rifle Pack", "category": "weapons", "price": 19.0, "polygon_count": 12000,
     "art_style": "Sci-Fi", "engines": ["Unity", "Unreal", "Godot"], "formats": ["FBX", "OBJ", "GLTF"],
     "tags": ["weapon", "sci-fi", "rifle"],
     "thumbnail_url": "https://images.unsplash.com/photo-1634585738250-09ee92cae0f8?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
     "description": "12 modular plasma weapons with PBR textures and animations."},
    {"title": "Neon City Modular Kit", "category": "environments", "price": 89.0, "polygon_count": 350000,
     "art_style": "Stylized", "engines": ["Unreal", "Unity"], "formats": ["FBX", "BLEND"],
     "tags": ["city", "cyberpunk", "modular"],
     "thumbnail_url": "https://images.unsplash.com/photo-1681924101087-922416cba14e?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
     "description": "120+ modular cyberpunk pieces to build entire city blocks."},
    {"title": "Sentinel Drone", "category": "props", "price": 12.0, "polygon_count": 8400,
     "art_style": "Sci-Fi", "engines": ["Unity", "Unreal"], "formats": ["FBX", "GLTF"],
     "tags": ["drone", "prop", "scifi"],
     "thumbnail_url": "https://images.pexels.com/photos/18998511/pexels-photo-18998511.jpeg?auto=compress&cs=tinysrgb&w=800",
     "description": "Sentinel surveillance drone, animated and game-ready."},
    {"title": "Cyber Warrior Pack", "category": "characters", "price": 39.0, "polygon_count": 45000,
     "art_style": "Realistic", "engines": ["Unreal", "Unity"], "formats": ["FBX", "BLEND"],
     "tags": ["character", "warrior", "cyber"],
     "thumbnail_url": "https://images.unsplash.com/photo-1635805737707-575885ab0820?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
     "description": "Fully rigged cyber warrior with 14 animations."},
    {"title": "Volumetric Smoke VFX", "category": "vfx", "price": 9.0, "polygon_count": 1000,
     "art_style": "Realistic", "engines": ["Unity", "Unreal"], "formats": ["GLTF", "FBX"],
     "tags": ["vfx", "smoke", "particle"],
     "thumbnail_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
     "description": "Volumetric smoke VFX system with 8 presets."},
    {"title": "Ancient Treasure Chest", "category": "props", "price": 7.0, "polygon_count": 6200,
     "art_style": "Stylized", "engines": ["Unity", "Unreal", "Godot"], "formats": ["FBX", "OBJ", "GLTF"],
     "tags": ["chest", "treasure", "prop"],
     "thumbnail_url": "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
     "description": "Stylized treasure chest with opening animation."},
    {"title": "Dragon Hatchling", "category": "animals", "price": 24.0, "polygon_count": 18000,
     "art_style": "Stylized", "engines": ["Unity", "Unreal"], "formats": ["FBX", "BLEND"],
     "tags": ["dragon", "creature", "animal"],
     "thumbnail_url": "https://images.unsplash.com/photo-1599582909646-2b4fe6c0fb8d?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
     "description": "Rigged dragon hatchling with 8 animations."},
    {"title": "Hover Bike Neo", "category": "vehicles", "price": 32.0, "polygon_count": 22000,
     "art_style": "Sci-Fi", "engines": ["Unreal", "Unity"], "formats": ["FBX", "OBJ"],
     "tags": ["hoverbike", "vehicle"],
     "thumbnail_url": "https://images.unsplash.com/photo-1485463611174-f302f6a5c1c9?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
     "description": "Sleek hover bike with PBR materials."},
    {"title": "Forest Foliage Pack", "category": "nature", "price": 15.0, "polygon_count": 200000,
     "art_style": "Realistic", "engines": ["Unreal", "Unity"], "formats": ["FBX", "BLEND"],
     "tags": ["nature", "trees", "foliage"],
     "thumbnail_url": "https://images.unsplash.com/photo-1502082553048-f009c37129b9?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
     "description": "60+ trees, plants and rocks for forest scenes."},
    {"title": "Cyber Cathedral", "category": "buildings", "price": 65.0, "polygon_count": 180000,
     "art_style": "Stylized", "engines": ["Unreal"], "formats": ["FBX"],
     "tags": ["building", "cathedral"],
     "thumbnail_url": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
     "description": "Imposing cyber cathedral with modular interior."},
    {"title": "Combat Animation Set", "category": "animations", "price": 28.0, "polygon_count": 0,
     "art_style": "Realistic", "engines": ["Unity", "Unreal"], "formats": ["FBX"],
     "tags": ["animation", "combat"],
     "thumbnail_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
     "description": "120 mocap combat animations for humanoid rigs."},
]


async def seed_data():
    # Admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@indieforge.dev")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@2026")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "is_creator": True,
            "plan": "studio",
            "avatar_url": None,
            "bio": "Platform administrator.",
            "followers": 0,
            "rating": 5.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Seed demo user
    demo_email = "demo@indieforge.dev"
    if not await db.users.find_one({"email": demo_email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": demo_email,
            "password_hash": hash_password("Demo@2026"),
            "name": "Demo Player",
            "role": "user",
            "is_creator": False,
            "plan": "free",
            "avatar_url": None,
            "bio": "",
            "followers": 0,
            "rating": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Seed creators
    creator_ids = []
    for c in SAMPLE_CREATORS:
        existing = await db.users.find_one({"email": c["email"]})
        if existing:
            creator_ids.append(existing["id"])
            continue
        cid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": cid,
            "email": c["email"],
            "password_hash": hash_password("Creator@2026"),
            "name": c["name"],
            "role": "user",
            "is_creator": True,
            "plan": "pro",
            "avatar_url": c["avatar_url"],
            "bio": c["bio"],
            "followers": c["followers"],
            "rating": c["rating"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        creator_ids.append(cid)

    # Seed assets
    count = await db.assets.count_documents({})
    if count < len(SAMPLE_ASSETS):
        for idx, a in enumerate(SAMPLE_ASSETS):
            existing = await db.assets.find_one({"title": a["title"]})
            if existing:
                continue
            creator = await db.users.find_one({"id": creator_ids[idx % len(creator_ids)]})
            asset_id = str(uuid.uuid4())
            await db.assets.insert_one({
                "id": asset_id,
                "creator_id": creator["id"],
                "creator_name": creator["name"],
                "creator_avatar": creator["avatar_url"],
                **a,
                "software": ["Blender", "Maya"],
                "preview_model_url": None,
                "rating": round(4.3 + (idx % 7) * 0.1, 1),
                "reviews_count": 12 + idx * 3,
                "downloads": 320 + idx * 47,
                "likes": 80 + idx * 11,
                "views": 1200 + idx * 110,
                "created_at": (datetime.now(timezone.utc) - timedelta(days=idx)).isoformat(),
            })
            # Seed reviews
            for r in range(2):
                await db.reviews.insert_one({
                    "id": str(uuid.uuid4()),
                    "asset_id": asset_id,
                    "user_name": ["GameDev42", "PixelMage", "IndieStudio"][r % 3],
                    "rating": 5 - r,
                    "comment": ["Incredible quality, dropped right into our Unreal project.",
                                "Topology is clean and textures are crisp.",
                                "Worth every dollar."][r % 3],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })


# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"name": "IndieForge 3D API", "version": "1.0"}


@api_router.get("/stats")
async def stats():
    return {
        "assets": await db.assets.count_documents({}),
        "creators": await db.users.count_documents({"is_creator": True}),
        "users": await db.users.count_documents({}),
        "downloads": sum([a.get("downloads", 0) async for a in db.assets.find({}, {"downloads": 1})]),
    }


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.assets.create_index("creator_id")
    await db.assets.create_index("category")
    await db.purchases.create_index("user_id")
    await db.favorites.create_index([("user_id", 1), ("asset_id", 1)], unique=True)
    await db.payment_transactions.create_index("session_id", unique=True)
    init_storage()
    await seed_data()
    logger.info("IndieForge 3D backend ready")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)
