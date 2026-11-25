#!/usr/bin/env python3
"""PROMAX cinematic audio engine — original, synthesised in code (no third-party samples,
so it is royalty-free by construction).

  python3 python/promax_audio.py <cues.json> <out.wav> [--music assets/music/track.mp3]

cues.json = {"duration": seconds, "cues": [{"t": 1.2, "type": "enter"}, ...]}
Cue types: logo, enter, rotate, sweep, price, transition, glitch, signature.
The built-in mixer sets bus levels, side-chains the music under hits, soft-clips and
peak-normalises; FFmpeg loudnorm (-14 LUFS, -1.5 dBTP) is applied afterwards by the pipeline.
"""
import json, sys, wave, subprocess, os
import numpy as np

SR = 48000
rng = np.random.default_rng(2026)

def tt(d): return np.arange(int(d * SR)) / SR
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def env(d, a, r, c=4):
    t = tt(d); return np.minimum(1, t / max(a, 1e-4)) * np.exp(-c * t / max(r, 1e-4))

def onepole(x, fc):
    """vectorised-enough one-pole lowpass via scipy-free recursion on chunks"""
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); z = 0.0
    for i in range(len(x)): z = (1 - a) * x[i] + a * z; y[i] = z
    return y

def svf(x, fc, q=0.7, mode='lp'):
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    f = 2 * np.sin(np.pi * np.minimum(fc, SR / 6) / SR); d = 1 / q
    y = np.empty_like(x); lo = bp = 0.0
    for i in range(len(x)):
        lo += f[i] * bp; hp = x[i] - lo - d * bp; bp += f[i] * hp
        y[i] = lo if mode == 'lp' else (bp if mode == 'bp' else hp)
    return y

def saw(f, d, dt=0.0, ph=0.0): return 2 * ((f * (1 + dt) * tt(d) + ph) % 1) - 1

class Bus:
    def __init__(s, n): s.x = np.zeros((n, 2))
    def add(s, sig, t0, g=1.0, pan=0.0):
        i = int(round(t0 * SR))
        if i >= len(s.x) or i < 0: return
        sig = sig[: len(s.x) - i] * g
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
            s.x[i:i + len(sig), 0] += sig * l; s.x[i:i + len(sig), 1] += sig * r
        else: s.x[i:i + len(sig)] += sig

# ---------------------------------------------------------------- sound design
def bass_hit(d=1.4, f=48):
    t = tt(d); fr = f * (1 + 1.8 * np.exp(-t * 24)); s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 3.2)
    n = onepole(rng.standard_normal(len(t)), 1400) * np.exp(-t * 22) * 0.55
    return np.tanh((s + n) * 1.4)

def impact(d=2.2):
    t = tt(d); low = bass_hit(d, 42)
    crack = svf(rng.standard_normal(len(t)), 2500, 0.8, 'bp') * np.exp(-t * 30) * 0.5
    tail = svf(rng.standard_normal(len(t)), 600, 0.7) * np.exp(-t * 2.2) * 0.25
    return low + crack + tail

def whoosh(d, f0, f1, pk=0.6, width=1.4):
    t = tt(d); x = rng.standard_normal(len(t)); y = svf(x, f0 * (f1 / f0) ** (t / d), width, 'bp')
    e = np.where(t < pk * d, (t / (pk * d)) ** 2, np.exp(-(t - pk * d) / (d * (1 - pk)) * 3.5))
    p = np.linspace(-0.6, 0.6, len(t)); return np.stack([y * e * (1 - p) * 0.5, y * e * (1 + p) * 0.5], 1)

def mech_rotate(d=0.9):
    """mechanical rotation: filtered whoosh + ratchet ticks that speed up then slow"""
    out = whoosh(d, 400, 2400, 0.5, 1.1) * 0.8
    tick = lambda: np.sin(2 * np.pi * 3200 * tt(0.012)) * np.exp(-tt(0.012) * 500)
    times = np.cumsum(0.06 * (1.6 - np.sin(np.linspace(0, np.pi, 12))))
    for k, tk in enumerate(times):
        i = int(tk * SR)
        if i + 576 < len(out): out[i:i + 576] += (tick() * 0.25)[:, None] * [1 - 0.08 * k, 0.6 + 0.04 * k]
    return out

def digital_sweep(d=0.45):
    t = tt(d); f = 300 * (30) ** (t / d); s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.25
    s = svf(s, 5000, 0.8) * np.sin(np.pi * t / d) ** 2
    bits = np.round(s * 8) / 8
    return np.stack([bits, np.roll(bits, 120)], 1) * 0.7

def glitch(d=0.35):
    t = tt(d); x = np.zeros(len(t))
    for k in range(7):
        i = int(rng.uniform(0, d - 0.03) * SR); n = int(rng.uniform(0.008, 0.03) * SR)
        x[i:i + n] += (np.sign(np.sin(2 * np.pi * rng.uniform(300, 2400) * tt(n / SR))) * 0.3)[: len(x[i:i + n])]
    return svf(x, 6000, 0.9) * 0.8

def ui_price(m=88):
    d = 0.5; t = tt(d)
    pl = sum(np.sin(2 * np.pi * mtof(m + k) * t) * np.exp(-t * (14 + k)) for k in (0, 7, 12)) * 0.25
    click = np.sin(2 * np.pi * 2600 * tt(0.04)) * np.exp(-tt(0.04) * 200)
    pl[: len(click)] += click * 0.6
    sub = np.sin(2 * np.pi * 62 * t) * np.exp(-t * 18) * 0.5
    return pl + sub

def signature(d=3.2):
    """PROMAX signature: rising 3-note motif + wide chord bloom + low impact"""
    out = np.zeros((int(d * SR), 2))
    for k, (m, at) in enumerate(((69, 0.0), (76, 0.14), (81, 0.28))):
        dd = d - at; t = tt(dd); s = sum(np.sin(2 * np.pi * mtof(m + o) * t + o) for o in (0, 12)) * np.exp(-t * 2.2) * 0.22
        i = int(at * SR); out[i:i + len(s), 0] += s; out[i:i + len(s), 1] += s
    t = tt(d)
    for n in (45, 57, 64, 71, 76):
        for j, dt in enumerate((-0.007, 0, 0.008)):
            s = saw(mtof(n), d, dt, rng.random()); s = svf(s, 900 + 4000 * np.exp(-t * 1.6), 0.8) * (0.5 + 0.5 * np.exp(-t)) * np.minimum(1, (d - t) / 0.8) / 14
            p = (j - 1) * 0.7; out[:, 0] += s * (1 - p) * 0.5; out[:, 1] += s * (1 + p) * 0.5
    low = impact(d) * 0.8; out[:, 0] += low; out[:, 1] += low
    return out

# ---------------------------------------------------------------- music
def music(dur, bpm=112):
    beat = 60 / bpm; n = int(dur * SR); bus = np.zeros((n, 2)); kicks = []
    prog = [[57, 60, 64, 71], [53, 57, 60, 67], [48, 55, 60, 64], [55, 59, 62, 67]]
    roots = [45, 41, 48, 43]
    def kick():
        t = tt(0.4); f = 46 + 120 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)
    hat = lambda d: (lambda x: (x - onepole(x, 7000)) * env(d, 0.001, d, 5))(rng.standard_normal(int(d * SR)))
    K, H, OH = kick(), hat(0.05), hat(0.16)
    def put(sig, t0, g=1, pan=0):
        i = int(t0 * SR)
        if i >= n: return
        sig = sig[: n - i] * g
        if sig.ndim == 1: bus[i:i + len(sig), 0] += sig * (1 - pan); bus[i:i + len(sig), 1] += sig * (1 + pan)
        else: bus[i:i + len(sig)] += sig
    nb = int(dur / beat) + 1
    for b in range(nb):
        t0 = b * beat; bar = b // 4; ch = bar // 2 % 4
        intro = t0 < 2.2
        if not intro: put(K, t0, 0.5); kicks.append(t0)
        put(H, t0 + beat / 2, 0.05 if not intro else 0.02, 0.3)
        if b % 2 == 1 and not intro: put(OH, t0, 0.035, -0.3)
        # bass 8ths
        for h in (0, 0.5):
            if intro: continue
            d = beat / 2 * 0.9; f = mtof(roots[ch] + (12 if (b * 2 + int(h * 2)) % 4 == 3 else 0))
            x = 0.6 * saw(f, d) + 0.5 * np.sin(2 * np.pi * f / 2 * tt(d)); x = svf(x, 260 + 700 * np.exp(-tt(d) * 16), 0.9) * env(d, 0.004, d * 1.2, 2)
            put(x, t0 + h * beat, 0.16)
        # arp 16ths
        for s16 in range(4):
            if intro and s16 % 2: continue
            nn = prog[ch][(b * 4 + s16) % 4] + 12; d = 0.18
            x = svf(0.7 * saw(mtof(nn), d), 800 + 3500 * np.exp(-tt(d) * 25), 1.1) * env(d, 0.002, 0.11, 3)
            put(x, t0 + s16 * beat / 4, 0.035, 0.5 * np.sin(b + s16))
    # pads per 2 bars
    t0 = 0.0; k = 0
    while t0 < dur:
        d = min(beat * 8 + 0.4, dur - t0 + 0.4); t = tt(d); y = np.zeros((len(t), 2))
        for m in prog[k % 4]:
            for j, dt in enumerate((-0.006, 0, 0.007)):
                s = saw(mtof(m), d, dt, rng.random()); p = (j - 1) * 0.6; y[:, 0] += s * (1 - p) * 0.5; y[:, 1] += s * (1 + p) * 0.5
        cut = np.linspace(700, 1500, len(t)); y[:, 0] = svf(y[:, 0], cut); y[:, 1] = svf(y[:, 1], cut)
        y *= (np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.5))[:, None] * 0.09 / 4
        put(y, t0); t0 += beat * 8; k += 1
    return bus, kicks

def load_music_file(path, dur):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-t', str(dur), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    out = np.zeros((int(dur * SR), 2)); out[: len(a)] = a[: len(out)]
    pk = np.abs(out).max() or 1; return out / pk * 0.5

# ---------------------------------------------------------------- render
def render(cues, dur, music_path=None):
    n = int(dur * SR)
    sfx = Bus(n)
    for c in cues:
        t, ty = c['t'], c['type']
        if ty == 'logo': sfx.add(impact(2.4), t, 0.9); sfx.add(whoosh(0.6, 500, 6000, 0.85), t - 0.45, 0.35)
        elif ty == 'enter': sfx.add(bass_hit(1.2, 50), t, 0.6)
        elif ty == 'rotate': sfx.add(mech_rotate(0.9), t, 0.38)
        elif ty == 'sweep': sfx.add(digital_sweep(0.45), t, 0.32)
        elif ty == 'price': sfx.add(ui_price(88), t, 0.42, 0.1)
        elif ty == 'transition': sfx.add(whoosh(0.5, 900, 5200, 0.7), t, 0.32)
        elif ty == 'glitch': sfx.add(glitch(0.35), t, 0.35)
        elif ty == 'signature': sfx.add(signature(min(3.2, dur - t)), t, 0.95)
    if music_path: mus = load_music_file(music_path, dur); kicks = []
    else: mus, kicks = music(dur)
    # duck music under hits (logo/enter/signature) — simple side-chain envelope
    duck = np.ones(n)
    for c in cues:
        if c['type'] in ('logo', 'enter', 'signature', 'price'):
            i = int(c['t'] * SR); m = int(0.5 * SR); depth = 0.45 if c['type'] != 'price' else 0.2
            e = 1 - depth * np.exp(-np.arange(m) / SR * 6); duck[i:i + m] = np.minimum(duck[i:i + m], e[: len(duck[i:i + m])])
    mix = mus * duck[:, None] * 0.8 + sfx.x
    # reverb send
    irl = int(1.4 * SR); ti = np.arange(irl) / SR
    def conv(x, ir):
        L = 1 << int(np.ceil(np.log2(len(x) + len(ir)))); return np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)[: len(x)]
    for ch in (0, 1):
        ir = onepole(rng.standard_normal(irl) * np.exp(-ti * 3.6), 5000)
        w = conv(mix[:, ch], ir); k = np.sqrt(np.mean(mix[:, ch] ** 2)) / max(1e-9, np.sqrt(np.mean(w ** 2)))
        mix[:, ch] += w * k * 0.18
    # fades, soft clip, peak normalise (no clipping / distortion)
    fi, fo = int(0.02 * SR), int(0.8 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None]; mix[-fo:] *= (np.linspace(1, 0, fo) ** 1.3)[:, None]
    pk = np.abs(mix).max() or 1
    mix = np.tanh(mix / pk * 1.15) / np.tanh(1.15) * 0.89
    return mix

def main():
    cues_path, out = sys.argv[1], sys.argv[2]
    music_path = sys.argv[sys.argv.index('--music') + 1] if '--music' in sys.argv else None
    spec = json.load(open(cues_path))
    mix = render(spec['cues'], spec['duration'], music_path)
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print(out)

if __name__ == '__main__':
    main()
