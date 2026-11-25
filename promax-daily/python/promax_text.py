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


# colour words → official names to try (only the model's own colours count; >1 match = ambiguous, reported)
WORDS = {
    'black': ['Black', 'Space Black', 'Black Titanium', 'Graphite'],
    'white': ['White', 'Star White', 'Cloud White', 'White Titanium'],
    'silver': ['Silver', 'Silver Shadow'],
    'blue': ['Deep Blue', 'Glacier', 'Night Sky', 'Sky Blue', 'Mist Blue', 'Ultramarine', 'Blueberry'],
    'lightblue': ['Glacier', 'Sky Blue', 'Mist Blue'], 'darkblue': ['Deep Blue', 'Night Sky', 'Blueberry'], 'navy': ['Deep Blue', 'Night Sky', 'Blueberry'],
    'green': ['Sage', 'Teal', 'Pistachio'], 'purple': ['Lavender', 'Cobalt Violet'], 'violet': ['Cobalt Violet', 'Lavender'],
    'pink': ['Pink', 'Soft Pink', 'Pink Gold'], 'gold': ['Light Gold', 'Desert Titanium', 'Pink Gold'], 'orange': ['Cosmic Orange'],
    'red': ['Burgundy'], 'burgundy': ['Burgundy'], 'gray': ['Silver Shadow', 'Graphite', 'Natural Titanium'], 'grey': ['Silver Shadow', 'Graphite', 'Natural Titanium'],
}
WHITE_FALLBACK = ['Silver']  # e.g. iPhone 18 Pro has no "White": the shop's 🤍/White = Silver


def color_word(model, word):
    names = {c['name'].lower(): c for c in model['colors']}
    w = word.strip().lower()
    if w in names: return names[w], None
    key = re.sub(r'[^a-z]', '', w)
    cands = [n for n in WORDS.get(key, []) if n.lower() in names]
    if not cands and key == 'white': cands = [n for n in WHITE_FALLBACK if n.lower() in names]
    if len(cands) == 1: return names[cands[0].lower()], None
    if len(cands) > 1: return None, f'colour «{word}» is ambiguous for {model["name"]} ({", ".join(cands)})'
    return None, f'colour «{word}» is not an official {model["name"]} colour'


def cond_of(text):
    t = text.lower().replace('-', ' ')
    if re.search(r'not\s*active|\bnot\b|\bnat\b', t): return 'not'
    if re.search(r'\bact(ive)?\b', t): return 'act'
    return ''


def header_info(text):
    """storage / part / condition / eSIM / model found in a header-ish line"""
    t = re.sub(r'[()\[\]:,]', ' ', text)
    toks = t.split()
    st = next((storage(x) for x in toks if storage(x)), None)
    part = next((PART[x.lower()] for x in toks if x.lower() in PART), '')
    esim = any(x.lower() == 'esim' for x in toks)
    rest = ' '.join(x for x in toks if not storage(x) and x.lower() not in PART and x.lower() not in ('esim', 'nat', 'not', 'act', 'active', '-', '—'))
    model = model_name(rest) if rest.strip() else None
    return {'storage': st, 'part': part, 'cond': cond_of(text), 'esim': esim, 'model': model, 'rest': rest}


def dedupe_paste(text):
    """A list pasted/sent twice: cut at the first place where the opening lines repeat."""
    lines = [l for l in text.splitlines()]
    core = [l.strip() for l in lines if l.strip()]
    if len(core) < 6: return text
    head = core[:3]
    for k in range(3, len(core) - 2):
        if core[k:k + 3] == head:
            # map back to original line index of core[k]
            cnt, cut = -1, len(lines)
            for i, l in enumerate(lines):
                if l.strip(): cnt += 1
                if cnt == k: cut = i; break
            return '\n'.join(lines[:cut])
    return text


def parse(text):
    text = dedupe_paste(text)
    rows, problems = [], []
    ctx = {'model': None, 'storage': None, 'part': '', 'cond': '', 'esim': False}
    seen = {}
    def emit(ln, raw, model, st, part, cond, esim, col, price):
        p = price.replace(',', '').replace('٬', '')
        if re.fullmatch(r'\d{1,3}(\.\d{3})+', p): p = p.replace('.', '')
        if not re.fullmatch(r'\d+', p): problems.append({'line': ln, 'text': raw, 'reason': f'price «{price}» unreadable'}); return
        key = (model['name'], st, part, cond, col['name'])
        if key in seen:
            if seen[key] != int(p): problems.append({'line': ln, 'text': raw, 'reason': f'same item listed twice with different prices ({seen[key]:,} / {int(p):,})'})
            return  # exact repeat (pasted twice) → ignored
        seen[key] = int(p)
        rows.append({'line': ln, 'brand': model['brand'], 'series': ('iPhone Duo' if model['id'] == 'iphone-duo' else model['series']), 'model': model['name'],
                     'storage': st, 'color': col['name'], 'hex': col['hex'], 'part': part, 'price': int(p), 'cond': COND.get(cond, ''), 'esim': esim, 'raw': raw})
    for ln, raw0 in enumerate(text.splitlines(), 1):
        raw = raw0.strip()
        line = raw.translate(FA).replace('‌', ' ').replace('️', '').strip().lstrip('-•*').strip()
        if not line: continue
        if set(line) <= set('-_=*•. —'):  # separator: the next block starts fresh
            ctx = {'model': None, 'storage': None, 'part': '', 'cond': '', 'esim': False}; continue
        emo = next((e for e in EMOJI if line.startswith(e)), '')
        body = line[len(emo):].strip()
        # A) one-line format: "💙iphone Duo 512g zaa Esim/714200 act"
        m = re.match(r'^(?P<head>.*?\S)\s*/\s*(?P<price>[\d.,]+)\s*(?P<cond>[a-z ]+)?$', body, re.I)
        if m and emo:
            h = header_info(m.group('head') + ' ' + (m.group('cond') or ''))
            model = h['model'] or ctx['model']
            if not model: problems.append({'line': ln, 'text': raw, 'reason': 'model not recognised'}); continue
            if not h['storage']: problems.append({'line': ln, 'text': raw, 'reason': 'storage missing'}); continue
            col = color_for(model, emo)
            if not col: problems.append({'line': ln, 'text': raw, 'reason': f'emoji «{emo}» is not an official {model["name"]} colour'}); continue
            emit(ln, raw, model, h['storage'], h['part'], h['cond'], h['esim'], col, m.group('price')); continue
        # B) price line under a header: "🩵485,500", "⚪️404,000--ch nat", "Black: 470,000"
        pe = re.fullmatch(r'(?P<price>[\d.,]+)\s*(?:--\s*(?P<extra>.*))?', body, re.I) if emo else None
        pw = None if emo else re.fullmatch(r'(?P<word>[A-Za-z][A-Za-z \-]*?)\s*[:：]\s*(?P<price>[\d.,]+)\s*(?:--\s*(?P<extra>.*))?', body)
        if pe or pw:
            pm = pe or pw
            if not ctx['model']: problems.append({'line': ln, 'text': raw, 'reason': 'price line before any model name — which model is this?'}); continue
            if not ctx['storage']: problems.append({'line': ln, 'text': raw, 'reason': 'no storage given for this block'}); continue
            part, cond = ctx['part'], ctx['cond']
            if pm.group('extra'):
                ex = header_info(pm.group('extra'))
                part = ex['part'] or part; cond = ex['cond'] or cond
            if pe: col, err = color_for(ctx['model'], emo), None; err = None if col else f'emoji «{emo}» is not an official {ctx["model"]["name"]} colour'
            else: col, err = color_word(ctx['model'], pw.group('word'))
            if err: problems.append({'line': ln, 'text': raw, 'reason': err}); continue
            emit(ln, raw, ctx['model'], ctx['storage'], part, cond, ctx['esim'], col, pm.group('price')); continue
        # C) header lines: model only ("iPhone 17 Pro Max"), block ("256GB ZAA (Not Active)") or both ("iPhone Duo 256GB ZAA Active eSIM")
        h = header_info(body)
        if h['model'] and not h['storage']:
            ctx = {'model': h['model'], 'storage': None, 'part': '', 'cond': '', 'esim': False}; continue
        if h['storage']:
            if h['model']: ctx['model'] = h['model']
            elif h['rest'].strip():
                problems.append({'line': ln, 'text': raw, 'reason': f'unknown model «{h["rest"].strip()}»'}); ctx['model'] = None
            ctx.update({'storage': h['storage'], 'part': h['part'], 'cond': h['cond'], 'esim': h['esim']}); continue
        problems.append({'line': ln, 'text': raw, 'reason': 'not understood'})
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
