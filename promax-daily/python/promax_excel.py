#!/usr/bin/env python3
"""PROMAX DAILY PRICE — Excel template + import/validation (openpyxl).

The Excel file is the single source of truth. Nothing here invents prices,
colours, storage variants or part numbers: incomplete rows are reported and
left out of the videos.

Usage:
  python3 python/promax_excel.py template [--out templates/PROMAX-DAILY-PRICES.xlsx] [--sample]
  python3 python/promax_excel.py validate <file.xlsx> [--out data/validated.json] [--assets assets]
  python3 python/promax_excel.py dump <file.xlsx>            # independent raw read (used by QC)
"""
from __future__ import annotations
import argparse, datetime as dt, json, os, re, sys
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PRODUCT_COLS = ["product_id", "brand", "series", "model", "storage", "color", "part_number", "price_toman",
                "front_image", "back_image", "video_asset", "active", "display_order",
                # optional extras (may be left empty)
                "color_hex", "condition", "note"]
REQUIRED_PRODUCT_COLS = PRODUCT_COLS[:13]
SETTING_KEYS = ["update_date", "currency", "price_unit", "reel_duration", "fps", "resolution", "brand_name",
                "instagram_username", "background_music", "show_part_number", "show_color", "show_storage",
                "allow_placeholders"]
ASSET_COLS = ["asset_id", "product_id", "asset_type", "file_path", "verified"]
ASSET_TYPES = {"front", "back", "model3d", "video"}
SUPPORTED_SERIES = {"Apple": ["iPhone 18 Series", "iPhone 17 Series", "iPhone Duo"],
                    "Samsung": ["Galaxy S26 Series"]}
CATALOG = os.path.join(ROOT, 'assets', 'official', 'catalog.json')
IMG_EXT = {".png", ".jpg", ".jpeg", ".webp"}
MODEL_EXT = {".glb", ".gltf"}
VIDEO_EXT = {".mp4", ".mov", ".webm"}
PART_RE = re.compile(r"^[A-Z]{1,3}/[A-Z]$")
STORAGE_RE = re.compile(r"^\d{2,4}\s?(GB|TB)$", re.I)
GROUPED_RE = re.compile(r"^\d{1,3}([.,٬]\d{3})+$")
FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")

# ---------------------------------------------------------------- template
SAMPLE_SETTINGS = [
    ("update_date", dt.date.today().isoformat(), "Gregorian date YYYY-MM-DD (shown in the video as a Persian date)"),
    ("currency", "تومان", "Currency label"),
    ("price_unit", "thousand_toman", "thousand_toman = prices typed in thousands of Toman (485,500 → shown as 485,500,000 تومان); toman = typed in full Toman"),
    ("reel_duration", 45, "Maximum length of the single Reel in seconds (15–45)"),
    ("fps", 30, "Frames per second"),
    ("resolution", "1080x1920", "Output size"),
    ("brand_name", "PROMAX MOBILE", ""),
    ("instagram_username", "@promax_mobilee", ""),
    ("background_music", "auto", "auto = built-in original PROMAX score, or a path inside assets/music/"),
    ("show_part_number", "yes", "yes / no"),
    ("show_color", "yes", "yes / no"),
    ("show_storage", "yes", "yes / no"),
    ("allow_placeholders", "yes", "yes = products without images use a branded placeholder (reported); no = block export"),
]

# Today's list exactly as the shop sent it. Colour names come from the emoji the shop used;
# rows marked "color name from emoji" in `note` should be confirmed by the shop.
SAMPLE_PRODUCTS = [
    # id, brand, series, model, storage, color, part, price, front, back, video, active, order, hex, condition, note
    ('18PM-CH-GL', 'Apple', 'iPhone 18 Series', 'iPhone 18 Pro Max', "256GB", 'Glacier', 'CH/A', 485500,
     '', '', "", "yes", 20, '#C9D9E8', "نات اکتیو", '🩵 = Glacier (official colour on GSMArena) — confirm'),
    ('18PM-CH-BU', 'Apple', 'iPhone 18 Series', 'iPhone 18 Pro Max', "256GB", 'Burgundy', 'CH/A', 485500,
     '', '', "", "yes", 21, '#6E2232', "نات اکتیو", '🍒 = Burgundy — confirm'),
    ('18PM-ZA-SL', 'Apple', 'iPhone 18 Series', 'iPhone 18 Pro Max', "256GB", 'Silver', 'ZA/A', 417100,
     '', '', "", "yes", 30, '#E3E4E6', "نات اکتیو", '⚪️ = Silver — confirm'),
    ('18PM-ZA-BK', 'Apple', 'iPhone 18 Series', 'iPhone 18 Pro Max', "256GB", 'Black', 'ZA/A', 417100,
     '', '', "", "yes", 31, '#1F2023', "نات اکتیو", '⚫️ = Black — confirm'),
    ('18PM-ZA-BU', 'Apple', 'iPhone 18 Series', 'iPhone 18 Pro Max', "256GB", 'Burgundy', 'ZA/A', 434200,
     '', '', "", "yes", 32, '#6E2232', "نات اکتیو", '🍒 = Burgundy — confirm'),
    ('18PM-ZA-GL', 'Apple', 'iPhone 18 Series', 'iPhone 18 Pro Max', "256GB", 'Glacier', 'ZA/A', '432.800',
     '', '', "", "yes", 33, '#C9D9E8', "نات اکتیو", '🩵 = Glacier — confirm; price typed as 432.800'),
    ('18P-ZA-BK', 'Apple', 'iPhone 18 Series', 'iPhone 18 Pro', "256GB", 'Black', 'ZA/A', 394500,
     '', '', "", "yes", 40, '#1F2023', "نات اکتیو", '⚫️ = Black — confirm'),
    ('18P-ZA-SL', 'Apple', 'iPhone 18 Series', 'iPhone 18 Pro', "256GB", 'Silver', 'ZA/A', 391500,
     '', '', "", "yes", 41, '#E3E4E6', "نات اکتیو", '⚪️ = Silver — confirm'),
    ('18P-ZA-BU', 'Apple', 'iPhone 18 Series', 'iPhone 18 Pro', "256GB", 'Burgundy', 'ZA/A', 394500,
     '', '', "", "yes", 42, '#6E2232', "نات اکتیو", '🍒 = Burgundy — confirm'),
    ('18P-ZA-GL', 'Apple', 'iPhone 18 Series', 'iPhone 18 Pro', "256GB", 'Glacier', 'ZA/A', '392.900',
     '', '', "", "yes", 43, '#C9D9E8', "نات اکتیو", '🩵 = Glacier — confirm; price typed as 392.900'),
    ('17PM-ZA-OR', 'Apple', 'iPhone 17 Series', 'iPhone 17 Pro Max', "256GB", 'Cosmic Orange', 'ZA/A', 350200,
     '', '', "", "yes", 50, '#E3762F', "نات اکتیو", '🏀'),
    ('17PM-ZA-DB', 'Apple', 'iPhone 17 Series', 'iPhone 17 Pro Max', "256GB", 'Deep Blue', 'ZA/A', '362.000',
     '', '', "", "yes", 51, '#2C3E63', "نات اکتیو", '🔵; price typed as 362.000'),
    ('17PM-ZA-SL', 'Apple', 'iPhone 17 Series', 'iPhone 17 Pro Max', "256GB", 'Silver', 'ZA/A', 410500,
     '', '', "", "yes", 52, '#E4E6E9', "نات اکتیو", '⚪️'),
    ('17PM-CH-SL', 'Apple', 'iPhone 17 Series', 'iPhone 17 Pro Max', "256GB", 'Silver', 'CH/A', 404000,
     '', '', "", "yes", 53, '#E4E6E9', "نات اکتیو", '⚪️ (--ch nat)'),
    ('17P-ZA-DB', 'Apple', 'iPhone 17 Series', 'iPhone 17 Pro', "256GB", 'Deep Blue', 'ZA/A', 357500,
     '', '', "", "yes", 60, '#2C3E63', "نات اکتیو", '🔵'),
    ('17P-ZA-SL', 'Apple', 'iPhone 17 Series', 'iPhone 17 Pro', "256GB", 'Silver', 'ZA/A', 360500,
     '', '', "", "yes", 61, '#E4E6E9', "نات اکتیو", '⚪️'),
    ("DUO-256-NS", "Apple", "iPhone Duo", "iPhone Duo", "256GB", "Night Sky", "", 645000,
     "", "", "", "yes", 65, "#2B3447", "نات اکتیو", "eSIM"),
    ("DUO-256-SW", "Apple", "iPhone Duo", "iPhone Duo", "256GB", "Star White", "", 645000,
     "", "", "", "yes", 66, "#EDEDEA", "نات اکتیو", "eSIM; source spelling «star withe»"),
    ('S26U-BK', 'Samsung', 'Galaxy S26 Series', 'Galaxy S26 Ultra', "256GB", 'Black', '', 269000,
     '', '', "", "yes", 70, '#2A2C2E', "نات اکتیو", '🖤 = Black'),
    ('S26U-CV', 'Samsung', 'Galaxy S26 Series', 'Galaxy S26 Ultra', "256GB", 'Cobalt Violet', '', 260000,
     '', '', "", "yes", 71, '#6B6496', "نات اکتیو", '💜 = Cobalt Violet — confirm'),
    ('S26U-SB', 'Samsung', 'Galaxy S26 Series', 'Galaxy S26 Ultra', "256GB", 'Sky Blue', '', 269000,
     '', '', "", "yes", 72, '#BFD6EA', "نات اکتیو", '💙 = Sky Blue — confirm'),
    ('S26U-WH', 'Samsung', 'Galaxy S26 Series', 'Galaxy S26 Ultra', "256GB", 'White', '', '269.000',
     '', '', "", "yes", 73, '#F2F2F2', "نات اکتیو", '⚪️ = White (Silver Shadow also exists) — confirm; price typed as 269.000'),
]
SAMPLE_ASSETS = [
    # optional overrides, e.g. ("A-001", "DUO-256-NS", "back", "products/iphone_duo/my-photo.png", "yes"),
]

NAVY, BLUE, WHITE = "061426", "168BFF", "FFFFFF"


def _style_header(ws, ncols):
    for c in range(1, ncols + 1):
        cell = ws.cell(row=1, column=c)
        cell.font = Font(bold=True, color=WHITE, name="Calibri")
        cell.fill = PatternFill("solid", fgColor=NAVY)
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = Border(bottom=Side(style="medium", color=BLUE))
    ws.freeze_panes = "A2"
    ws.row_dimensions[1].height = 24


def make_template(out: str, sample: bool = True):
    wb = Workbook()
    ws = wb.active; ws.title = "Products"
    ws.append(PRODUCT_COLS)
    if sample:
        for r in SAMPLE_PRODUCTS: ws.append(list(r))
    _style_header(ws, len(PRODUCT_COLS))
    widths = [14, 10, 18, 20, 9, 16, 12, 13, 40, 40, 16, 8, 13, 10, 12, 40]
    for i, w in enumerate(widths, 1): ws.column_dimensions[get_column_letter(i)].width = w
    dv = DataValidation(type="list", formula1='"yes,no"', allow_blank=False); ws.add_data_validation(dv); dv.add("L2:L2000")
    dvb = DataValidation(type="list", formula1='"Apple,Samsung"', allow_blank=False); ws.add_data_validation(dvb); dvb.add("B2:B2000")
    dvs = DataValidation(type="list", formula1='"iPhone 18 Series,iPhone 17 Series,iPhone Duo,Galaxy S26 Series"', allow_blank=False)
    ws.add_data_validation(dvs); dvs.add("C2:C2000")
    for row in ws.iter_rows(min_row=2, min_col=8, max_col=8):
        for c in row: c.number_format = "#,##0"

    st = wb.create_sheet("Settings")
    st.append(["setting", "value", "description"])
    for k, v, d in SAMPLE_SETTINGS: st.append([k, v, d])
    _style_header(st, 3)
    st.column_dimensions["A"].width = 22; st.column_dimensions["B"].width = 22; st.column_dimensions["C"].width = 90

    asx = wb.create_sheet("Assets")
    asx.append(ASSET_COLS)
    if sample:
        for r in SAMPLE_ASSETS: asx.append(list(r))
    _style_header(asx, len(ASSET_COLS))
    for i, w in enumerate([10, 14, 12, 50, 9], 1): asx.column_dimensions[get_column_letter(i)].width = w
    dva = DataValidation(type="list", formula1='"front,back,model3d,video"'); asx.add_data_validation(dva); dva.add("C2:C2000")
    dvv = DataValidation(type="list", formula1='"yes,no"'); asx.add_data_validation(dvv); dvv.add("E2:E2000")

    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    wb.save(out)
    return out

# ---------------------------------------------------------------- reading


def _norm_header(v):
    return str(v or "").strip().lower().replace(" ", "_")


def _cell(v):
    if v is None: return ""
    if isinstance(v, float) and v.is_integer(): return int(v)
    if isinstance(v, str): return v.strip()
    return v


def read_sheet(wb, name):
    if name not in wb.sheetnames: return None, []
    ws = wb[name]
    rows = list(ws.iter_rows(values_only=True))
    if not rows: return [], []
    headers = [_norm_header(h) for h in rows[0]]
    out = []
    for i, r in enumerate(rows[1:], start=2):
        if r is None or all(v in (None, "") for v in r): continue
        out.append({"_row": i, **{h: _cell(v) for h, v in zip(headers, r) if h}})
    return headers, out


def parse_price(raw):
    """Return (int_price or None, warning or None, error or None). Never guesses."""
    if raw is None or raw == "": return None, None, "missing price"
    if isinstance(raw, bool): return None, None, f"invalid price {raw!r}"
    if isinstance(raw, (int, float)):
        if isinstance(raw, float) and not raw.is_integer(): return None, None, f"price {raw} is not a whole number"
        v = int(raw)
        return (v, None, None) if v > 0 else (None, None, f"price must be positive (got {v})")
    s = str(raw).strip().translate(FA_DIGITS).replace(" ", "")
    if re.fullmatch(r"\d+", s):
        v = int(s); return (v, None, None) if v > 0 else (None, None, "price must be positive")
    if GROUPED_RE.fullmatch(s):
        v = int(re.sub(r"[.,٬]", "", s))
        return v, f"price «{raw}» read as {v:,} (dot/comma treated as a thousands separator) — please confirm", None
    return None, None, f"invalid price «{raw}»"


def yes(v, default=False):
    if v in ("", None): return default
    return str(v).strip().lower() in ("yes", "y", "true", "1", "بله", "active", "فعال")


def image_info(assets_dir, rel):
    p = os.path.join(assets_dir, rel)
    if not os.path.isfile(p): return None
    try:
        from PIL import Image
        with Image.open(p) as im: return {"width": im.size[0], "height": im.size[1], "mode": im.mode}
    except Exception:
        return {"width": 0, "height": 0, "mode": "unreadable"}


def _norm_model(m):
    m = re.sub(r'^(apple|samsung)\s+', '', m.lower()).replace('+', ' plus')
    return re.sub(r'[^a-z0-9]+', ' ', m).strip()

def load_catalog():
    try:
        cat = json.load(open(CATALOG, encoding='utf-8'))
        return {_norm_model(m['name']): {re.sub(r'[^a-z0-9]', '', c['name'].lower()): c for c in m['colors']} for m in cat['models']}
    except Exception:
        return {}

def validate(path, assets_dir):
    issues = []
    catalog = load_catalog()
    def add(level, code, msg, pid=None, row=None):
        issues.append({"level": level, "code": code, "product_id": pid, "row": row, "message": msg})

    wb = load_workbook(path, data_only=True)
    # ---- settings
    _, srows = read_sheet(wb, "Settings")
    settings = {k: v for k, v, _ in SAMPLE_SETTINGS}
    if srows is None: add("warning", "settings_missing", "Settings sheet missing — defaults used")
    else:
        for r in srows:
            k = str(r.get("setting", "")).strip()
            if k: settings[k] = r.get("value", "")
    try: settings["reel_duration"] = min(45, max(15, int(settings.get("reel_duration") or 45)))
    except Exception: settings["reel_duration"] = 45; add("warning", "setting_invalid", "reel_duration invalid — 45 used")
    try: settings["fps"] = int(settings.get("fps") or 30)
    except Exception: settings["fps"] = 30
    ud = settings.get("update_date")
    if isinstance(ud, (dt.date, dt.datetime)): settings["update_date"] = ud.strftime("%Y-%m-%d")
    elif not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(ud or "")):
        add("warning", "setting_invalid", f"update_date «{ud}» not YYYY-MM-DD — today used"); settings["update_date"] = dt.date.today().isoformat()
    for k in ("show_part_number", "show_color", "show_storage", "allow_placeholders"): settings[k] = yes(settings.get(k), True)
    if settings.get("price_unit") not in ("thousand_toman", "toman"):
        add("warning", "setting_invalid", f"price_unit «{settings.get('price_unit')}» unknown — thousand_toman used"); settings["price_unit"] = "thousand_toman"
    bm = str(settings.get("background_music") or "auto")
    if bm != "auto" and not os.path.isfile(os.path.join(assets_dir, bm)):
        add("warning", "music_missing", f"background_music «{bm}» not found — built-in score used"); settings["background_music"] = "auto"

    # ---- assets sheet
    _, arows = read_sheet(wb, "Assets")
    asset_map = {}
    for r in (arows or []):
        pid, typ, fp = str(r.get("product_id", "")), str(r.get("asset_type", "")).lower(), str(r.get("file_path", ""))
        if not fp: continue
        if typ not in ASSET_TYPES: add("warning", "asset_type", f"asset {r.get('asset_id')}: unknown type «{typ}»", pid or None, r["_row"]); continue
        if not yes(r.get("verified")):
            add("info", "asset_unverified", f"asset {r.get('asset_id')} ({fp}) is not verified — not used", pid or None, r["_row"]); continue
        if pid: asset_map.setdefault(pid, {})[typ] = fp

    # ---- products
    headers, prows = read_sheet(wb, "Products")
    if prows is None:
        add("error", "products_missing", "Products sheet is missing"); prows = []; headers = []
    missing_cols = [c for c in REQUIRED_PRODUCT_COLS if c not in headers]
    if missing_cols: add("error", "columns_missing", "Products sheet is missing columns: " + ", ".join(missing_cols))

    seen, products, rejected, inactive = {}, [], [], []
    for r in prows:
        pid = str(r.get("product_id", "")).strip(); row = r["_row"]
        errs = []
        if not pid: errs.append("missing product_id")
        elif pid in seen: errs.append(f"duplicate product_id (also row {seen[pid]})"); add("error", "duplicate_id", f"duplicate product_id {pid} (rows {seen[pid]} and {row})", pid, row)
        else: seen[pid] = row
        if not yes(r.get("active"), False):
            inactive.append({"product_id": pid, "row": row, "model": r.get("model", "")})
            add("info", "inactive", f"{pid} is inactive — skipped", pid, row); continue
        brand, series, model = str(r.get("brand", "")), str(r.get("series", "")), str(r.get("model", ""))
        storage, color, part = str(r.get("storage", "")), str(r.get("color", "")), str(r.get("part_number", "")).upper()
        if brand not in SUPPORTED_SERIES: errs.append(f"unsupported brand «{brand}»")
        elif series not in SUPPORTED_SERIES[brand]: add("warning", "series_unknown", f"{pid}: series «{series}» is not one of {SUPPORTED_SERIES[brand]}", pid, row)
        if not model: errs.append("missing model")
        if settings["show_storage"]:
            if not storage: errs.append("missing storage")
            elif not STORAGE_RE.fullmatch(storage): errs.append(f"invalid storage «{storage}»")
        if settings["show_color"] and not color: errs.append("missing color")
        if part and not PART_RE.fullmatch(part):
            errs.append(f"invalid part number «{part}» (expected like CH/A, ZA/A, LL/A)")
        if not part and settings["show_part_number"]:
            add("warning", "part_missing", f"{pid}: no part number — the video shows none for this variant", pid, row)
        price, pw, pe = parse_price(r.get("price_toman"))
        if pe: errs.append(pe); add("error", "invalid_price" if "missing" not in pe else "missing_price", f"{pid}: {pe}", pid, row)
        if pw: add("warning", "price_normalized", f"{pid}: {pw}", pid, row)
        try: order = int(r.get("display_order") or 0)
        except Exception: order = 0; add("warning", "order_invalid", f"{pid}: display_order invalid", pid, row)

        # images: Products columns first, then verified Assets rows
        front = str(r.get("front_image") or asset_map.get(pid, {}).get("front", ""))
        back = str(r.get("back_image") or asset_map.get(pid, {}).get("back", ""))
        model3d = asset_map.get(pid, {}).get("model3d", "")
        video = str(r.get("video_asset") or asset_map.get(pid, {}).get("video", ""))
        imgs = {}
        for kind, rel, exts in (("front", front, IMG_EXT), ("back", back, IMG_EXT), ("model3d", model3d, MODEL_EXT), ("video", video, VIDEO_EXT)):
            if not rel: continue
            if os.path.splitext(rel)[1].lower() not in exts:
                add("warning", "asset_format", f"{pid}: {kind} «{rel}» has an unsupported format", pid, row); continue
            if kind in ("front", "back"):
                info = image_info(assets_dir, rel)
                if info is None: add("warning", "missing_image", f"{pid}: {kind} image not found: {rel}", pid, row); continue
                if max(info["width"], info["height"]) < 600:
                    add("warning", "low_resolution", f"{pid}: {kind} image is only {info['width']}×{info['height']}", pid, row)
                imgs[kind] = {"path": rel, **info}
            else:
                if not os.path.isfile(os.path.join(assets_dir, rel)): add("warning", "missing_asset", f"{pid}: {kind} not found: {rel}", pid, row); continue
                imgs[kind] = {"path": rel}
        lib = catalog.get(_norm_model(model), {}).get(re.sub(r'[^a-z0-9]', '', color.lower()))
        if "front" not in imgs and "back" not in imgs and "model3d" not in imgs:
            if lib and (lib.get('official') or {}):
                imgs['library'] = {'path': (lib['official'].get('hero') or lib['official'].get('back')), 'source': 'official'}
            elif catalog.get(_norm_model(model)) is None:
                add("warning", "missing_image", f"{pid}: model «{model}» is not in the image library — branded placeholder will be used", pid, row)
            else:
                add("warning", "missing_image", f"{pid}: colour «{color}» is not an official colour of {model} in the library — placeholder used; check the spelling", pid, row)

        rec = {"product_id": pid, "row": row, "brand": brand, "series": series, "model": model, "storage": storage.upper().replace(" ", ""),
               "color": color, "part_number": part, "price": price, "price_raw": str(r.get("price_toman")),
               "display_order": order, "color_hex": str(r.get("color_hex") or ""), "condition": str(r.get("condition") or ""),
               "note": str(r.get("note") or ""), "assets": imgs}
        if errs:
            for e in errs:
                if not any(i["product_id"] == pid and e in i["message"] for i in issues):
                    add("error", "invalid_row", f"{pid or 'row '+str(row)}: {e}", pid or None, row)
            rejected.append({**rec, "errors": errs})
        else:
            products.append(rec)

    products.sort(key=lambda p: (p["display_order"], p["row"]))
    brands = sorted({p["brand"] for p in products})
    stats = {
        "rows": len(prows), "active_valid": len(products), "rejected": len(rejected), "inactive": len(inactive),
        "brands": brands, "series": sorted({p["series"] for p in products}),
        "missing_images": sum(1 for p in products if not p["assets"]),
        "invalid_prices": sum(1 for i in issues if i["code"] in ("invalid_price", "missing_price")),
        "warnings": sum(1 for i in issues if i["level"] == "warning"), "errors": sum(1 for i in issues if i["level"] == "error"),
    }
    return {"source": os.path.abspath(path), "validated_at": dt.datetime.now().isoformat(timespec="seconds"),
            "settings": settings, "products": products, "rejected": rejected, "inactive": inactive,
            "issues": issues, "stats": stats, "ok": stats["active_valid"] > 0}


def dump(path):
    """Independent raw read of Products (no normalisation besides price parsing) for QC cross-checks."""
    wb = load_workbook(path, data_only=True)
    _, rows = read_sheet(wb, "Products")
    out = {}
    for r in rows or []:
        price, _, _ = parse_price(r.get("price_toman"))
        out[str(r.get("product_id", ""))] = {"model": str(r.get("model", "")), "color": str(r.get("color", "")),
                                             "storage": str(r.get("storage", "")).upper().replace(" ", ""),
                                             "part_number": str(r.get("part_number", "")).upper(), "price": price,
                                             "active": yes(r.get("active"))}
    return out


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("template"); t.add_argument("--out", default=os.path.join(ROOT, "templates", "PROMAX-DAILY-PRICES.xlsx")); t.add_argument("--empty", action="store_true")
    v = sub.add_parser("validate"); v.add_argument("file"); v.add_argument("--out", default=os.path.join(ROOT, "data", "validated.json")); v.add_argument("--assets", default=os.path.join(ROOT, "assets"))
    d = sub.add_parser("dump"); d.add_argument("file")
    a = ap.parse_args()
    if a.cmd == "template":
        print(make_template(a.out, sample=not a.empty))
    elif a.cmd == "validate":
        res = validate(a.file, a.assets)
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        with open(a.out, "w", encoding="utf-8") as f: json.dump(res, f, ensure_ascii=False, indent=2)
        s = res["stats"]
        print(json.dumps({"out": a.out, **s}, ensure_ascii=False))
        sys.exit(0 if res["ok"] else 2)
    elif a.cmd == "dump":
        print(json.dumps(dump(a.file), ensure_ascii=False))


if __name__ == "__main__":
    main()
