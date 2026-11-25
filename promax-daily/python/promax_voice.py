#!/usr/bin/env python3
"""Split a voice-over take on its pauses into one segment per scene.

  python3 python/promax_voice.py <take.mp3> <segments> <out.json> [--tempo 1.2]

The script puts a [pause] between scenes; the N-1 longest silences are the scene boundaries.
Writes {file, tempo, segments:[{start,end}]} (seconds in the original take, speech only)."""
import json, re, subprocess, sys
src, n, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
tempo = float(sys.argv[sys.argv.index('--tempo') + 1]) if '--tempo' in sys.argv else 1.0
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout)
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', 'silencedetect=n=-38dB:d=0.3', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]; en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
sil = [(a, b) for a, b in zip(st, en) if a > 0.2 and b < dur - 0.2]
if len(sil) < n - 1: sys.exit(f'only {len(sil)} pauses found, need {n - 1} — regenerate the take')
cuts = sorted(sorted(sil, key=lambda s: s[1] - s[0], reverse=True)[: n - 1])
lead = next((b for a, b in zip(st, en) if a <= 0.05), 0.0)
trail = next((a for a, b in zip(st, en) if b >= dur - 0.05), dur)
bounds = [lead] + [x for c in cuts for x in c] + [trail]
segs = [{'start': round(bounds[2 * i], 3), 'end': round(bounds[2 * i + 1], 3)} for i in range(n)]
json.dump({'file': src, 'tempo': tempo, 'segments': segs}, open(out, 'w'), indent=1)
print(json.dumps({'segments': [round((s['end'] - s['start']) / tempo, 2) for s in segs], 'speech_total': round(sum(s['end'] - s['start'] for s in segs) / tempo, 1)}))
