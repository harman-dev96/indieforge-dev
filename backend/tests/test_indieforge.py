"""IndieForge 3D backend regression tests."""
import os, io, uuid, pytest, requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://asset-forge-3d-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"
DEMO = ("demo@indieforge.dev", "Demo@2026")


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def auth_s():
    sess = requests.Session()
    r = sess.post(f"{API}/auth/login", json={"email": DEMO[0], "password": DEMO[1]}, timeout=20)
    assert r.status_code == 200, r.text
    sess.headers["Authorization"] = f"Bearer {r.json()['token']}"
    return sess


# ---- Health / meta ----
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    d = r.json(); assert d["name"] and d["version"]

def test_stats(s):
    r = s.get(f"{API}/stats"); assert r.status_code == 200
    d = r.json()
    for k in ("assets","creators","users","downloads"): assert k in d
    assert d["assets"] >= 12

def test_categories(s):
    r = s.get(f"{API}/categories"); assert r.status_code == 200
    d = r.json(); assert len(d) == 10
    for c in d: assert {"slug","name","icon","count"} <= set(c)


# ---- Auth ----
def test_register_and_me():
    sess = requests.Session()
    email = f"test_{uuid.uuid4().hex[:8]}@test.dev"
    r = sess.post(f"{API}/auth/register", json={"email": email, "password": "Pass@1234", "name": "T"})
    assert r.status_code == 200, r.text
    tok = r.json()["token"]; assert tok
    # cookie via session
    r2 = sess.get(f"{API}/auth/me"); assert r2.status_code == 200
    assert r2.json()["email"] == email
    # logout clears cookie
    r3 = sess.post(f"{API}/auth/logout"); assert r3.status_code == 200

def test_login_demo(auth_s):
    r = auth_s.get(f"{API}/auth/me"); assert r.status_code == 200
    assert r.json()["email"] == DEMO[0]

def test_login_bad():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO[0], "password": "wrong"})
    assert r.status_code == 401


# ---- Assets ----
def test_assets_list(s):
    r = s.get(f"{API}/assets"); assert r.status_code == 200
    d = r.json(); assert "items" in d and "total" in d and d["total"] >= 12

@pytest.mark.parametrize("params,key,val", [
    ({"category":"characters"},"category","characters"),
    ({"search":"mech"},None,None),
    ({"engine":"Unity"},None,None),
    ({"file_format":"FBX"},None,None),
    ({"min_price":10,"max_price":50},None,None),
    ({"sort":"newest"},None,None),
])
def test_asset_filters(s, params, key, val):
    r = s.get(f"{API}/assets", params=params); assert r.status_code == 200
    items = r.json()["items"]
    if key:
        for it in items: assert it[key] == val
    if "min_price" in params:
        for it in items: assert 10 <= it["price"] <= 50

def test_trending(s):
    r = s.get(f"{API}/assets/trending"); assert r.status_code == 200
    d = r.json(); assert isinstance(d, list) and len(d) <= 8 and len(d) > 0

def test_asset_detail(s):
    a = s.get(f"{API}/assets").json()["items"][0]
    r = s.get(f"{API}/assets/{a['id']}"); assert r.status_code == 200
    d = r.json(); assert d["id"] == a["id"] and "reviews" in d


# ---- Creators ----
def test_featured_creators(s):
    r = s.get(f"{API}/creators/featured"); assert r.status_code == 200
    d = r.json(); assert len(d) >= 4
    for c in d: assert {"id","name","bio","avatar_url","rating","followers"} <= set(c)

def test_creator_detail(s):
    cid = s.get(f"{API}/creators/featured").json()[0]["id"]
    r = s.get(f"{API}/creators/{cid}"); assert r.status_code == 200
    assert "portfolio" in r.json()


# ---- Favorites & purchases (auth) ----
def test_favorites_toggle(auth_s):
    aid = requests.get(f"{API}/assets").json()["items"][0]["id"]
    r1 = auth_s.post(f"{API}/favorites/{aid}"); assert r1.status_code == 200
    state1 = r1.json()["favorited"]
    r2 = auth_s.post(f"{API}/favorites/{aid}"); assert r2.status_code == 200
    assert r1.json()["favorited"] != r2.json()["favorited"]
    # ensure final state favorited so listing works
    if not r2.json()["favorited"]:
        auth_s.post(f"{API}/favorites/{aid}")
    r3 = auth_s.get(f"{API}/my/favorites"); assert r3.status_code == 200
    assert any(a["id"] == aid for a in r3.json())

def test_my_purchases_auth(auth_s):
    r = auth_s.get(f"{API}/my/purchases"); assert r.status_code == 200
    assert isinstance(r.json(), list)

def test_my_purchases_unauth():
    r = requests.get(f"{API}/my/purchases"); assert r.status_code == 401


# ---- Stripe ----
def test_checkout_asset(auth_s):
    aid = requests.get(f"{API}/assets").json()["items"][0]["id"]
    r = auth_s.post(f"{API}/checkout/asset", json={"asset_id": aid, "origin_url": BASE})
    assert r.status_code == 200, r.text
    d = r.json(); assert d.get("url") and d.get("session_id")
    # status returns open/unpaid
    r2 = auth_s.get(f"{API}/checkout/status/{d['session_id']}")
    assert r2.status_code == 200
    assert r2.json()["payment_status"] in ("unpaid","open","initiated","no_payment_required")

def test_checkout_subscription_pro(auth_s):
    r = auth_s.post(f"{API}/checkout/subscription", json={"plan":"pro","origin_url": BASE})
    assert r.status_code == 200; assert r.json().get("url")

def test_checkout_subscription_studio(auth_s):
    r = auth_s.post(f"{API}/checkout/subscription", json={"plan":"studio","origin_url": BASE})
    assert r.status_code == 200; assert r.json().get("url")

def test_checkout_subscription_free(auth_s):
    r = auth_s.post(f"{API}/checkout/subscription", json={"plan":"free","origin_url": BASE})
    assert r.status_code == 200; assert r.json().get("free") is True


# ---- Upload & file serving ----
PNG = bytes.fromhex("89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C6300010000000500010D0A2DB40000000049454E44AE426082")

def test_upload_image_and_fetch(auth_s):
    files = {"file": ("t.png", io.BytesIO(PNG), "image/png")}
    r = auth_s.post(f"{API}/upload", files=files, data={"kind":"image"})
    assert r.status_code == 200, r.text
    d = r.json(); assert d["id"] and d["url"] and d["path"]
    r2 = requests.get(f"{BASE}{d['url']}"); assert r2.status_code == 200
    assert r2.content[:4] == b"\x89PNG"


# ---- Asset creation + analytics ----
def test_create_asset_and_analytics(auth_s):
    payload = {"title": f"TEST Asset {uuid.uuid4().hex[:6]}", "description":"x","category":"props",
               "price":5.0,"polygon_count":100,"art_style":"Realistic","engines":["Unity"],
               "formats":["FBX"],"software":["Blender"],"tags":["test"]}
    r = auth_s.post(f"{API}/assets", json=payload); assert r.status_code == 200, r.text
    aid = r.json()["id"]
    r2 = auth_s.get(f"{API}/my/assets"); assert r2.status_code == 200
    assert any(a["id"] == aid for a in r2.json())
    r3 = auth_s.get(f"{API}/my/analytics"); assert r3.status_code == 200
    d = r3.json()
    for k in ("total_assets","total_downloads","total_revenue","chart"): assert k in d
    assert len(d["chart"]) == 7


# ---- Commissions ----
def test_commissions(auth_s):
    r = auth_s.post(f"{API}/commissions", json={"title":"TEST C","description":"d","budget":100,"deadline_days":15,"category":"Characters"})
    assert r.status_code == 200, r.text
    r2 = requests.get(f"{API}/commissions"); assert r2.status_code == 200
    assert any(c["title"] == "TEST C" for c in r2.json())
