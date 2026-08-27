# -*- coding: utf-8 -*-
"""Télécharge les 9 pictogrammes officiels GHS/CLP (SVG, domaine public, Wikimedia Commons)
et génère src/clp_svgs.ts (GHS_SVG: code -> svg inline nettoyé)."""
import urllib.request, urllib.error, re, sys, time
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception:
    pass

FILES = {
    'SGH01': 'GHS-pictogram-explos.svg', 'SGH02': 'GHS-pictogram-flamme.svg', 'SGH03': 'GHS-pictogram-rondflam.svg',
    'SGH04': 'GHS-pictogram-bottle.svg', 'SGH05': 'GHS-pictogram-acid.svg', 'SGH06': 'GHS-pictogram-skull.svg',
    'SGH07': 'GHS-pictogram-exclam.svg', 'SGH08': 'GHS-pictogram-silhouette.svg', 'SGH09': 'GHS-pictogram-pollu.svg',
}


def fetch(fn):
    url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + fn
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (ERP Seem Semrac import FDS)'})
            return urllib.request.urlopen(req, timeout=60).read().decode('utf-8', 'replace')
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 4:
                time.sleep(5 * (attempt + 1)); continue
            raise


def clean(svg):
    svg = re.sub(r'<\?xml.*?\?>', '', svg, flags=re.S)
    svg = re.sub(r'<!DOCTYPE.*?>', '', svg, flags=re.S)
    svg = re.sub(r'<!--.*?-->', '', svg, flags=re.S)
    m = re.search(r'<svg\b[^>]*>', svg)
    tag = m.group(0)
    w = re.search(r'width="([\d.]+)', tag)
    h = re.search(r'height="([\d.]+)', tag)
    hasvb = 'viewBox' in tag
    nt = re.sub(r'\swidth="[^"]*"', '', tag)
    nt = re.sub(r'\sheight="[^"]*"', '', nt)
    if not hasvb and w and h:
        nt = nt.replace('<svg', '<svg viewBox="0 0 %s %s"' % (w.group(1), h.group(1)), 1)
    nt = nt.replace('<svg', '<svg width="100%" height="100%"', 1)
    svg = svg.replace(tag, nt, 1)
    return re.sub(r'>\s+<', '><', svg).strip()


def esc(s):
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')


def main():
    out = {}
    for code, fn in FILES.items():
        try:
            s = clean(fetch(fn))
            out[code] = s
            print(code, fn, len(s), 'viewBox=' + str('viewBox' in s))
        except Exception as e:
            print(code, fn, 'ERR', type(e).__name__, str(e)[:80])
        time.sleep(2.5)
    if len(out) != 9:
        print('INCOMPLET:', len(out), '/9 - pas d ecriture')
        return
    with open('src/clp_svgs.ts', 'w', encoding='utf-8') as f:
        f.write('// Pictogrammes officiels GHS/CLP - SVG domaine public (UN / Wikimedia Commons). Genere par download_ghs.py.\n')
        f.write('export const GHS_SVG: Record<string, string> = {\n')
        for code in FILES:
            f.write('  ' + code + ': `' + esc(out[code]) + '`,\n')
        f.write('}\n')
    print('OK -> src/clp_svgs.ts :', len(out), 'pictogrammes')


if __name__ == '__main__':
    main()
