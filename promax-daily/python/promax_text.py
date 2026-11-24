#!/usr/bin/env python3
"""Paste-in price list (WhatsApp/Telegram style) → PROMAX-DAILY-PRICES Excel.

  python3 python/promax_text.py <list.txt> [--out data/uploads/latest.xlsx] [--date YYYY-MM-DD]

Understands lines like
  💙iphone Duo 512g zaa Esim/714200 act
  🍒18 pro max 1tra zaa/656600 not
and header + price-line blocks like
  18 pro max ch 256g (Nat)
  🩵485,500
Colour emoji are mapped to the model's OFFICIAL colour names from assets/official/catalog.json.
Anything that cannot be read with certainty is reported — never guessed into the sheet.
"""
import json, os, re, sys, datetime as dt
from openpyxl import load_workbook
sys.path.insert(0, os.path.dirname(__file__))
from promax_excel import make_template, ROOT, PRODUCT_COLS

CAT = json.load(open(os.path.join(ROOT, 'assets', 'official', 'catalog.json'), encoding='utf-8'))
MODELS = {m['name'].lower(): m for m in CAT['models']}

# emoji → official colour names to try, in order (first one the model actually has wins)
EMOJI = {
    '🤍': ['Star White', 'Cloud White', 'White Titanium', 'Silver', 'White'], '⚪': ['Silver', 'Star White', 'Cloud White', 'White Titanium', 'White', 'Silver Shadow'],
    '🖤': ['Black', 'Space Black', 'Black Titanium', 'Graphite'], '⚫': ['Black', 'Space Black', 'Black Titanium', 'Graphite'],
    '🩵': ['Glacier', 'Sky Blue', 'Mist Blue', 'Teal'], '💙': ['Night Sky', 'Deep Blue', 'Sky Blue', 'Ultramarine', 'Blueberry'], '🔵': ['Deep Blue', 'Night Sky', 'Blueberry', 'Ultramarine'],
    '🍒': ['Burgundy'], '❤': ['Burgundy'], '🏀': ['Cosmic Orange'], '🧡': ['Cosmic Orange'], '🟠': ['Cosmic Orange'],
    '💜': ['Cobalt Violet', 'Lavender'], '🩷': ['Pink', 'Soft Pink', 'Pink Gold'], '💗': ['Pink', 'Soft Pink', 'Pink Gold'],
    '💚': ['Sage', 'Teal', 'Pistachio'], '💛': ['Light Gold', 'Desert Titanium', 'Pink Gold'], '🤎': ['Desert Titanium', 'Natural Titanium'], '🩶': ['Silver Shadow', 'Natural Titanium', 'Silver', 'Graphite'],
}
PART = {'zaa': 'ZA/A', 'za': 'ZA/A', 'ch': 'CH/A', 'll': 'LL/A', 'j': 'J/A', 'hn': 'HN/A', 'kh': 'KH/A', 'aa': 'AA/A', 'ae': 'AE/A', 'b': 'B/A', 'x': 'X/A', 'vc': 'VC/A'}
COND = {'act': 'اکتیو', 'active': 'اکتیو', 'not': 'نات اکتیو', 'nat': 'نات اکتیو', 'notactive': 'نات اکتیو'}
FA = str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789')


def model_name(txt):
    t = re.sub(r'\s+', ' ', txt.lower()).strip()
    t = t.replace('promax', 'pro max').replace('pm', 'pro max') if re.fullmatch(r'\d+\s*(pm|promax)', t) else t.replace('promax', 'pro max')
    t = re.sub(r'^(apple\s+)?iphone\s*', '', t); t = re.sub(r'^(samsung\s+)?(galaxy\s*)?', '', t) if t.startswith(('samsung', 'galaxy', 's2')) else t
    cands = []
    if re.match(r's\d{2}', t):
        n = re.sub(r'^s(\d{2})\s*', r'galaxy s\1 ', t).strip().replace('plus', '+').replace(' +', '+')
        cands = [n]
    else:
        cands = ['iphone ' + t, 'iphone ' + t.replace(' e', 'e')]
    for c in cands:
        c = re.sub(r'\s+', ' ', c).strip()
        if c in MODELS: return MODELS[c]
    return None


def storage(tok):
    m = re.fullmatch(r'(\d+)\s*(g|gb|t|tb|tra|tera)', tok.lower())
    if not m: return None
    n, u = m.groups()
    return f'{n}TB' if u.startswith('t') else f'{n}GB'


def color_for(model, emoji):
    names = [c['name'] for c in model['colors']]
    for want in EMOJI.get(emoji, []):
        if want in names: return next(c for c in model['colors'] if c['name'] == want)
    return None


LINE = re.compile(r'^\s*(?P<emo>\S*?)\s*(?P<model>(?:iphone\s+)?(?:duo|air|\d{2}\s*(?:pro\s*max|promax|pro|plus|e)?|s\d{2}\s*(?:ultra|plus|\+|fe)?))\s+(?P<rest>.*)$', re.I)


def parse(text):
    rows, problems, header = [], [], None
    for ln, raw in enumerate(text.splitlines(), 1):
        line = raw.translate(FA).replace('‌', ' ').replace('️', '').strip()
        if not line or set(line) <= set('-_=*•. '): continue
        emo = next((e for e in EMOJI if line.startswith(e)), '')
        body = line[len(emo):].strip()
        m = re.match(r'^(?P<head>.*?)\s*/\s*(?P<price>[\d.,]+)\s*(?P<cond>[a-z]+)?\s*$', body, re.I)
        price_only = re.fullmatch(r'(?P<price>[\d.,]+)\s*(?P<cond>[a-z]+)?(\s*--\s*(?P<extra>.*))?', body, re.I)
        if m:
            head, price, cond = m.group('head'), m.group('price'), (m.group('cond') or '').lower()
        elif price_only and header and emo:
            head, price, cond = header['text'], price_only.group('price'), (price_only.group('cond') or header.get('cond', ''))
            if price_only.group('extra'):  # a per-line note like "--ch nat" overrides the header
                ex = price_only.group('extra').split()
                exparts = [t for t in ex if t.lower() in PART]
                if exparts: head = ' '.join(t for t in head.split() if t.lower() not in PART)
                head = ' '.join(ex) + ' ' + head
                cm2 = re.search(r'\b(act|active|not|nat)\b', price_only.group('extra'), re.I)
                if cm2: cond = cm2.group(1).lower()
        else:
            # maybe a header line like "18 pro max ch 256g (Nat)"
            hm = re.sub(r'[()]', ' ', body)
            if any(storage(t) for t in hm.split()):
                cm = re.search(r'\b(act|active|not|nat)\b', hm, re.I)
                header = {'text': re.sub(r'\b(act|active|not|nat)\b', '', hm, flags=re.I), 'cond': cm.group(1).lower() if cm else ''}
            elif not re.fullmatch(r'[A-Za-z\s]*', body):
                problems.append({'line': ln, 'text': raw.strip(), 'reason': 'not a price line'})
            continue
        toks = re.sub(r'[()]', ' ', head).split()
        st = next((storage(t) for t in toks if storage(t)), None)
        part = next((PART[t.lower()] for t in toks if t.lower() in PART), '')
        esim = any(t.lower() == 'esim' for t in toks)
        mtxt = ' '.join(t for t in toks if not storage(t) and t.lower() not in PART and t.lower() not in ('esim', 'nat', 'not', 'act', 'active'))
        model = model_name(mtxt)
        if not model: problems.append({'line': ln, 'text': raw.strip(), 'reason': f'unknown model «{mtxt}»'}); continue
        if not st: problems.append({'line': ln, 'text': raw.strip(), 'reason': 'storage missing'}); continue
        col = color_for(model, emo) if emo else None
        if not col: problems.append({'line': ln, 'text': raw.strip(), 'reason': f'colour emoji «{emo or "-"}» does not match an official {model["name"]} colour'}); continue
        p = price.replace(',', '').replace('٬', '')
        if re.fullmatch(r'\d{1,3}(\.\d{3})+', p): p = p.replace('.', '')
        if not re.fullmatch(r'\d+', p): problems.append({'line': ln, 'text': raw.strip(), 'reason': f'price «{price}» unreadable'}); continue
        rows.append({'line': ln, 'brand': model['brand'], 'series': ('iPhone Duo' if model['id'] == 'iphone-duo' else model['series']), 'model': model['name'],
                     'storage': st, 'color': col['name'], 'hex': col['hex'], 'part': part, 'price': int(p), 'cond': COND.get(cond, ''), 'esim': esim, 'emoji': emo, 'raw': raw.strip()})
    return rows, problems


def write_excel(rows, out, date=None):
    make_template(out, sample=False)
    wb = load_workbook(out); ws = wb['Products']
    seen = {}
    for i, r in enumerate(rows):
        base = re.sub(r'[^A-Z0-9]+', '-', f"{r['model'].replace('iPhone ', '').replace('Galaxy ', '')}-{r['storage']}-{r['part'][:2]}-{r['color']}-{'A' if r['cond'] == 'اکتیو' else 'N'}".upper()).strip('-')
        pid = base if base not in seen else f'{base}-{seen[base] + 1}'
        seen[base] = seen.get(base, 0) + 1
        cond = r['cond'] + (' · eSIM' if r['esim'] else '')
        ws.append([pid, r['brand'], r['series'], r['model'], r['storage'], r['color'], r['part'], r['price'], '', '', '', 'yes', (i + 1) * 10, r['hex'], cond.strip(' ·'), f"from text line {r['line']}: {r['raw']}"])
    st = wb['Settings']
    for row in st.iter_rows(min_row=2):
        if row[0].value == 'update_date': row[1].value = date or dt.date.today().isoformat()
    wb.save(out)


if __name__ == '__main__':
    src = sys.argv[1]
    out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else os.path.join(ROOT, 'data', 'uploads', 'latest.xlsx')
    date = sys.argv[sys.argv.index('--date') + 1] if '--date' in sys.argv else None
    rows, problems = parse(open(src, encoding='utf-8').read())
    if rows: write_excel(rows, out, date)
    print(json.dumps({'rows': len(rows), 'problems': problems, 'out': out if rows else None,
                      'preview': [f"{r['model']} {r['storage']} {r['part']} {r['color']} {r['cond']}{' eSIM' if r['esim'] else ''} = {r['price']:,}" for r in rows]}, ensure_ascii=False, indent=1))
    sys.exit(0 if rows and not problems else 1)
