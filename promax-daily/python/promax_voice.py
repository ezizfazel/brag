#!/usr/bin/env python3
"""Split a voice-over take on its pauses into one line per scene, tighten it, and write voice.wav + voice.json.

  python3 python/promax_voice.py <take.mp3> <segments> <out.json> [--tempo 1.2]

The script puts a [pause] between scenes; the N-1 longest silences are the scene boundaries.
Each line gets its inner breaths shortened and the tempo applied, then the lines are joined
(0.5 s apart) into voice.wav next to out.json. voice.json: {file, tempo: 1, segments:[{start,end}]}."""
import json, os, re, subprocess, sys
src, n, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
tempo = float(sys.argv[sys.argv.index('--tempo') + 1]) if '--tempo' in sys.argv else 1.2
probe = lambda f: float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)
dur = probe(src)
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', 'silencedetect=n=-38dB:d=0.3', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]; en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
sil = [(a, b) for a, b in zip(st, en) if a > 0.2 and b < dur - 0.2]
if len(sil) < n - 1: sys.exit(f'only {len(sil)} pauses found, need {n - 1} — regenerate the take')
cuts = sorted(sorted(sil, key=lambda s: s[1] - s[0], reverse=True)[: n - 1])
lead = next((b for a, b in zip(st, en) if a <= 0.05), 0.0)
trail = next((a for a, b in zip(st, en) if b >= dur - 0.05), dur)
bounds = [lead] + [x for c in cuts for x in c] + [trail]
d = os.path.dirname(os.path.abspath(out))
tmp = os.path.join(d, '.lines'); os.makedirs(tmp, exist_ok=True)
lines = []
for i in range(n):
    a, b = bounds[2 * i], bounds[2 * i + 1]
    f = os.path.join(tmp, f'{i:02d}.wav')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-af',
                    f'atrim={a}:{b},asetpts=PTS-STARTPTS,silenceremove=stop_periods=-1:stop_duration=0.25:stop_threshold=-40dB:stop_silence=0.15,'
                    f'atempo={tempo},aresample=48000,afade=t=in:d=0.02', '-ac', '2', f], check=True)
    lines.append((f, probe(f)))
gap = 0.5
segs, at = [], 0.0
for f, L in lines: segs.append({'start': round(at, 3), 'end': round(at + L, 3)}); at += L + gap
fl = ''.join(f'[{i}:a]apad=pad_dur={gap}[p{i}];' for i in range(n)) + ''.join(f'[p{i}]' for i in range(n)) + f'concat=n={n}:v=0:a=1[a]'
wav = os.path.join(d, 'voice.wav')
subprocess.run(['ffmpeg', '-y', '-v', 'error', *sum((['-i', f] for f, _ in lines), []), '-filter_complex', fl, '-map', '[a]', wav], check=True)
rel = os.path.relpath(wav)
json.dump({'file': rel, 'take': src, 'tempo': 1, 'spoken_tempo': tempo, 'segments': segs}, open(out, 'w'), indent=1)
print(json.dumps({'lines': [round(L, 2) for _, L in lines], 'speech_total': round(sum(L for _, L in lines), 1)}))
