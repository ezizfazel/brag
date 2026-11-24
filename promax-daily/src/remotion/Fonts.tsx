import React from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

const FACES: [string, string, string, string?][] = [
  // family, file, weight, unicode-range
  ['Vazirmatn', 'fonts/Dxxo8j6PP2D_kU2muijlHcWW.woff2', '100 900', 'U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC4, U+10EFC-10EFF, U+1EE00-1EEFF'],
  ['Vazirmatn', 'fonts/Dxxo8j6PP2D_kU2muijlE8WWMmk.woff2', '100 900', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['Vazirmatn', 'fonts/Dxxo8j6PP2D_kU2muijlGMWWMmk.woff2', '100 900', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  ['Inter', 'fonts/Inter-Medium.otf', '500'],
  ['Inter', 'fonts/Inter-SemiBold.otf', '600'],
  ['Inter', 'fonts/Inter-Bold.otf', '700'],
  ['Inter', 'fonts/Inter-ExtraBold.otf', '800'],
  ['Inter', 'fonts/Inter-Black.otf', '900'],
];

let loading: Promise<void> | null = null;
function loadAll() {
  if (!loading) {
    loading = Promise.all(
      FACES.map(async ([fam, file, weight, range]) => {
        const f = new FontFace(fam, `url(${staticFile(file)})`, { weight, ...(range ? { unicodeRange: range } : {}) });
        await f.load();
        (document.fonts as unknown as { add: (f: FontFace) => void }).add(f);
      }),
    ).then(() => document.fonts.ready.then(() => undefined));
  }
  return loading;
}

export const useFonts = () => {
  const [handle] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => {
    loadAll().then(() => continueRender(handle)).catch((e) => { console.error(e); continueRender(handle); });
  }, [handle]);
};
