# Original score + SFX for the PROMAX reel (pure numpy). Output: music_sfx.wav (48k stereo)
import numpy as np, wave
SR=48000; DUR=63.4; N=int(SR*DUR); BEAT=0.6
rng=np.random.default_rng(11)
L=np.zeros(N); R=np.zeros(N)
def mtof(m): return 440*2**((m-69)/12)
def tt(d): return np.arange(int(d*SR))/SR
def add(sig,t0,g=1.0,pan=0.0):
    i=int(round(t0*SR)); 
    if i>=N: return
    s=sig[:max(0,N-i)]*g
    if s.ndim==1:
        gl=np.cos((pan+1)*np.pi/4)*1.414; gr=np.sin((pan+1)*np.pi/4)*1.414; L[i:i+len(s)]+=s*gl; R[i:i+len(s)]+=s*gr
    else: L[i:i+len(s)]+=s[:,0]; R[i:i+len(s)]+=s[:,1]
def env(d,a,r,c=4): t=tt(d); return np.minimum(1,t/max(a,1e-4))*np.exp(-c*t/max(r,1e-4))
def lp1(x,fc):
    a=np.exp(-2*np.pi*fc/SR); y=np.zeros_like(x); z=0.0
    for i in range(len(x)): z=(1-a)*x[i]+a*z; y[i]=z
    return y
def svf(x,fc,q=0.7,mode='lp'):
    fc=np.broadcast_to(np.asarray(fc,float),x.shape); y=np.zeros_like(x); lo=bp=0.0
    f=2*np.sin(np.pi*np.minimum(fc,SR/6)/SR); d=1/q
    for i in range(len(x)):
        lo+=f[i]*bp; hp=x[i]-lo-d*bp; bp+=f[i]*hp; y[i]=lo if mode=='lp' else bp
    return y
def saw(f,d,dt=0.0,ph=0.0): return 2*((f*(1+dt)*tt(d)+ph)%1)-1

# --- music sections ---
GROOVE=[(2.6,55.0),(57.4,58.6)]   # where drums play
def in_groove(t): return any(a<=t<b for a,b in GROOVE)
CH={'Am':[57,60,64,71],'F':[53,57,60,67],'C':[48,55,60,64],'G':[55,59,62,67],'Em':[52,55,59,64]}
ROOT={'Am':45,'F':41,'C':48,'G':43,'Em':40}
prog=['Am','F','C','G']
def chord_at(t): return prog[int(max(0,t-2.6)//(BEAT*8))%4] if t>=2.6 else 'Am'

def kick():
    t=tt(0.4); f=46+120*np.exp(-t*30); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*8)
KK=kick()
def hat(d=0.05):
    x=rng.standard_normal(int(d*SR)); x=x-lp1(x,7000); return x*env(d,0.001,d,5)
HH=hat(); OH=hat(0.18)
kick_t=[]
t=2.6
while t<DUR:
    if in_groove(t): add(KK,t,0.55); kick_t.append(t)
    for k,(h,g,p) in enumerate([(HH,0.035,-0.3),(OH,0.06,0.3)]):
        tt2=t+k*BEAT/2
        if in_groove(tt2): add(h,tt2,g,p)
    t+=BEAT
# sidechain env for pads/bass
sc=np.ones(N)
for k in kick_t:
    i=int(k*SR); n=int(0.3*SR); e=1-0.55*np.exp(-np.arange(n)/SR*10); sc[i:i+n]=np.minimum(sc[i:i+n],e[:max(0,min(n,N-i))])
bed=np.zeros((N,2))
def addb(sig,t0,g=1.0,pan=0.0):
    i=int(t0*SR); s=sig[:max(0,N-i)]*g
    if s.ndim==1: bed[i:i+len(s),0]+=s*(1-pan)*0.7; bed[i:i+len(s),1]+=s*(1+pan)*0.7
    else: bed[i:i+len(s)]+=s
# bass 8ths
t=2.6
while t<DUR:
    if in_groove(t):
        c=chord_at(t); f=mtof(ROOT[c]); d=BEAT/2*0.9
        x=0.6*saw(f,d)+0.5*np.sin(2*np.pi*f/2*tt(d)); x=svf(x,250+700*np.exp(-tt(d)*16),0.9)*env(d,0.004,d*1.2,2)
        addb(x,t,0.22)
    t+=BEAT/2
# pads (whole piece, quieter in body)
def pad(notes,d,c0,c1,g):
    t_=tt(d); y=np.zeros((len(t_),2))
    for n in notes:
        for j,dt in enumerate((-0.006,0,0.007)):
            s=saw(mtof(n),d,dt,rng.random()); p=(j-1)*0.6; y[:,0]+=s*(1-p)*0.5; y[:,1]+=s*(1+p)*0.5
    cut=np.linspace(c0,c1,len(t_)); y[:,0]=svf(y[:,0],cut); y[:,1]=svf(y[:,1],cut)
    a=np.minimum(1,t_/0.4)*np.minimum(1,(d-t_)/0.5); return y*a[:,None]*g/len(notes)
addb(pad(CH['Am'],2.9,300,1200,0.20),0)
t=2.6
while t<55.0:
    c=chord_at(t); addb(pad(CH[c],BEAT*8+0.4,900,1400,0.11),t); t+=BEAT*8
addb(pad(CH['F'],2.8,600,3200,0.14),55.0)        # tension under the unlock
addb(pad(CH['Am']+[76],5.6,800,2600,0.16),57.4)
# arp
pat=[0,2,1,3,2,1,3,2]; t=2.6; i=0
while t<55.0:
    c=chord_at(t); n=CH[c][pat[i%8]]+12; d=0.25
    x=svf(0.7*saw(mtof(n),d),700+3500*np.exp(-tt(d)*25),1.1)*env(d,0.002,0.15,3)
    addb(x,t,0.05,0.4*np.sin(i)); t+=BEAT/2; i+=1
bed*=sc[:,None]
L+=bed[:,0]; R+=bed[:,1]

# --- SFX ---
def whoosh(d,f0,f1,pk=0.6,g=1.0):
    t_=tt(d); x=rng.standard_normal(len(t_)); y=svf(x,f0*(f1/f0)**(t_/d),1.4,'bp')
    e=np.where(t_<pk*d,(t_/(pk*d))**2,np.exp(-(t_-pk*d)/(d*(1-pk))*3.5)); p=np.linspace(-0.5,0.5,len(t_))
    return np.stack([y*e*(1-p)*0.5,y*e*(1+p)*0.5],1)*g
def subhit(d=1.3,f=55,g=1.0):
    t_=tt(d); fr=f*(1+1.6*np.exp(-t_*22)); s=np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t_*3)
    n=lp1(rng.standard_normal(len(t_)),1500)*np.exp(-t_*20)*0.5; return (s+n)*g
def click():
    d=0.05; t_=tt(d); s=np.sin(2*np.pi*2600*t_)*np.exp(-t_*220)+0.4*np.sin(2*np.pi*1300*t_)*np.exp(-t_*120); return s
def pop(m):
    d=0.15; t_=tt(d); f=mtof(m)*(1+0.5*np.exp(-t_*60)); return np.sin(2*np.pi*np.cumsum(f)/SR)*env(d,0.002,0.06,1)
def riser(d,g):
    t_=tt(d); x=rng.standard_normal(len(t_)); y=svf(x,300*(16)**(t_/d),2.5,'bp')*(t_/d)**2.2
    s=sum(np.sin(2*np.pi*mtof(m)*t_*(1+0.03*t_/d)) for m in (69,76,81))*0.12*(t_/d)**2; return (y+s)*g
def shimmer(d=2.2):
    t_=tt(d); return sum(np.sin(2*np.pi*mtof(m)*t_+i)*np.exp(-t_*(1.6+i*0.6))*np.minimum(1,t_/0.02) for i,m in enumerate((81,88,93,100)))*0.22
def chord_hit(d=4.5):
    t_=tt(d); y=np.zeros((len(t_),2))
    for n in [45,57,60,64,71,76]:
        for j,dt in enumerate((-0.008,0,0.009)):
            s=saw(mtof(n),d,dt,rng.random()); p=(j-1)*0.7; y[:,0]+=s*(1-p)*0.5; y[:,1]+=s*(1+p)*0.5
    cut=600+4800*np.exp(-t_*1.5); y[:,0]=svf(y[:,0],cut); y[:,1]=svf(y[:,1],cut)
    e=np.minimum(1,t_/0.01)*(0.5+0.5*np.exp(-t_*1.0))*np.minimum(1,(d-t_)/0.8); return y*e[:,None]/12

add(subhit(1.6,50),0.06,0.75)                      # hook bass hit
add(whoosh(0.5,500,5000,0.85,0.35),0.0)
add(whoosh(0.45,4000,600,0.3,0.25),0.40)           # line 2 swish
add(riser(1.2,0.18),1.4)
add(whoosh(0.6,600,6000,0.85,0.45),2.15)           # reveal
add(subhit(1.0,55),2.85,0.45)                      # «بدون لمس گوشی!»
for t0 in (5.0,12.7,19.0,21.3,26.0,31.0,34.5,41.0,47.5):   # step cards
    add(click(),t0,0.30,0.1); add(whoosh(0.35,1200,4500,0.7,0.10),t0-0.25)
for t0 in (6.2,13.2,19.2,21.6,23.6,26.3,31.6,36.3,40.1,41.3,44.8):  # highlights
    add(pop(88),t0,0.07,-0.15)
add(pop(93),54.0,0.12)                              # voice chip
add(riser(2.4,0.30),55.0)
add(whoosh(0.5,800,7000,0.9,0.35),56.95)
add(subhit(1.8,48),57.4,0.85); add(shimmer(),57.4,0.6); add(chord_hit(3.0),57.4,0.8)   # UNLOCK
add(whoosh(0.7,5000,500,0.4,0.35),58.3)
add(subhit(2.0,45),58.8,0.8); add(chord_hit(4.6),58.8,1.0); add(shimmer(2.6),58.8,0.35)  # luxury impact on logo
add(click(),59.5,0.2); add(click(),60.3,0.2)

# reverb
irl=int(1.6*SR); ti=np.arange(irl)/SR
def conv(x,ir):
    n=1<<int(np.ceil(np.log2(len(x)+len(ir)))); return np.fft.irfft(np.fft.rfft(x,n)*np.fft.rfft(ir,n),n)[:len(x)]
IRL=lp1(rng.standard_normal(irl)*np.exp(-ti*3.5),5000); IRR=lp1(rng.standard_normal(irl)*np.exp(-ti*3.5),5000)
wl=conv(L,IRL); wr=conv(R,IRR); k=np.sqrt(np.mean(L**2))/max(1e-9,np.sqrt(np.mean(wl**2)))
L=L+wl*k*0.2; R=R+wr*k*0.2
fe=int(1.2*SR); f=np.ones(N); f[-fe:]=np.linspace(1,0,fe)**1.4; L*=f; R*=f
pk=max(abs(L).max(),abs(R).max()); L=np.tanh(L/pk*1.2)/np.tanh(1.2)*0.89; R=np.tanh(R/pk*1.2)/np.tanh(1.2)*0.89
with wave.open('music_sfx.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.stack([L,R],1)*32767).astype(np.int16).tobytes())
print('ok')
