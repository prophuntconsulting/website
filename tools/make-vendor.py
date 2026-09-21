import re, glob, os, subprocess, sys, urllib.request

ROOT = os.getcwd()  # run from the repo root:  python tools/make-vendor.py
SP = os.path.join(ROOT, 'tools', '.vendor-src')  # downloaded inputs (gitignored)
os.makedirs(os.path.join(SP, 'fa'), exist_ok=True)
_FA = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1'
_UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'}
def _fetch(url, dst):
    if not os.path.exists(dst):
        with urllib.request.urlopen(urllib.request.Request(url, headers=_UA)) as r, open(dst, 'wb') as o:
            o.write(r.read())
_fetch(_FA + '/css/all.min.css', os.path.join(SP, 'fa', 'all.min.css'))
for _n in ('fa-solid-900', 'fa-regular-400', 'fa-brands-400'):
    _fetch(_FA + '/webfonts/' + _n + '.woff2', os.path.join(SP, 'fa', _n + '.woff2'))
_fetch('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&family=Rubik:wght@400;500;600;700&display=swap', os.path.join(SP, 'gf.css'))
FONTS = os.path.join(ROOT, 'fonts')
os.makedirs(FONTS, exist_ok=True)

css = open(os.path.join(SP, 'fa', 'all.min.css'), encoding='utf8').read()

# ---- icon name -> codepoint(s) ----
rule_re = re.compile(r'((?:\.fa-[a-z0-9-]+::?before,?)+)\{content:"([^"]+)"\}')
name_cp = {}
for sel, content in rule_re.findall(css):
    m = re.fullmatch(r'\\([0-9a-fA-F]{1,6})', content)
    if not m:
        continue
    cp = int(m.group(1), 16)
    for n in re.findall(r'\.fa-([a-z0-9-]+)::?before', sel):
        name_cp[n] = cp
print('icons in FA 6.5.1 css:', len(name_cp))

# ---- which icons does the site use? ----
skip_dirs = ('node_modules', 'treetopia', 'mahindra-citadel', 'thank-you-page')
def std(f):
    f = f.replace(os.sep, '/')
    return not any(f.startswith(d) or ('/' + d) in f for d in skip_dirs)
html = [f for f in glob.glob('**/*.html', recursive=True) if std(f)]
code = glob.glob('js/*.js') + glob.glob('scripts/*.js')
used = set()
for f in html + code:
    s = open(f, encoding='utf8', errors='ignore').read()
    for n in re.findall(r'\bfa-([a-z0-9-]+)', s):
        if n in name_cp:
            used.add(n)
for f in code + html:
    s = open(f, encoding='utf8', errors='ignore').read()
    # quoted bare names (icon maps built in JS, incl. inline <script> blocks in HTML)
    for n in re.findall(r"['\"`]([a-z0-9-]+)['\"`]", s):
        if n in name_cp:
            used.add(n)
print('icons used:', len(used))
cps = sorted({name_cp[n] for n in used})

# ---- subset the three fonts ----
def subset(src, dst):
    unicodes = ','.join('U+%04X' % c for c in cps)
    subprocess.check_call([sys.executable, '-m', 'fontTools.subset', src, '--unicodes=' + unicodes, '--flavor=woff2',
                           '--layout-features=', '--no-hinting', '--desubroutinize', '--output-file=' + dst])
sizes = {}
for name in ('fa-solid-900', 'fa-regular-400', 'fa-brands-400'):
    dst = os.path.join(FONTS, name + '-subset.woff2')
    subset(os.path.join(SP, 'fa', name + '.woff2'), dst)
    sizes[name] = os.path.getsize(dst)
print('subset sizes (bytes):', sizes)

# ---- rebuild the FA css: keep everything except unused icon rules and the v4 shim ----
def split_top(text):
    out, depth, cur = [], 0, ''
    for ch in text:
        cur += ch
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                out.append(cur)
                cur = ''
    if cur.strip():
        out.append(cur)
    return out

kept = []
for blk in split_top(css):
    b = blk.strip()
    if b.startswith('/*'):
        b = b[b.index('*/') + 2:].strip()
    if not b:
        continue
    if b.startswith('@font-face'):
        fam = re.search(r'font-family:"?([^";]+)"?', b).group(1)
        if fam not in ('Font Awesome 6 Brands', 'Font Awesome 6 Free'):
            continue
        mapping = {'Font Awesome 6 Brands': ('brands', 'fa-brands-400', 400), 'Font Awesome 6 Free': None}
        weight = re.search(r'font-weight:(\d+)', b).group(1)
        fname = {'Font Awesome 6 Brands': 'fa-brands-400', 'Font Awesome 6 Free': 'fa-solid-900' if weight == '900' else 'fa-regular-400'}[fam]
        kept.append('@font-face{font-family:"%s";font-style:normal;font-weight:%s;font-display:block;src:url(/fonts/%s-subset.woff2) format("woff2")}' % (fam, weight, fname))
        continue
    m = rule_re.fullmatch(b)
    if m:
        sels = [s for s in re.findall(r'\.fa-([a-z0-9-]+)::?before', m.group(1)) if s in used]
        if sels:
            kept.append(','.join('.fa-%s:before' % s for s in sels) + '{content:"' + m.group(2) + '"}')
        continue
    # generic rules (base classes, sizes, animations, utilities)
    kept.append(b)
fa_css = '\n'.join(kept)
print('fa css bytes:', len(fa_css))

# ---- Google fonts: latin + latin-ext, self-hosted ----
gf = open(os.path.join(SP, 'gf.css'), encoding='utf8').read()
blocks = re.findall(r'/\* ([a-z-]+) \*/\s*(@font-face\s*\{.*?\})', gf, re.S)
seen_files = {}
gf_out = []
for subset_name, blk in blocks:
    if subset_name not in ('latin', 'latin-ext'):
        continue
    fam = re.search(r"font-family:\s*'([^']+)'", blk).group(1)
    url = re.search(r'url\((https://[^)]+\.woff2)\)', blk).group(1)
    if url not in seen_files:
        base = ('opensans' if fam == 'Open Sans' else 'rubik') + '-' + subset_name + '.woff2'
        urllib.request.urlretrieve(url, os.path.join(FONTS, base))
        seen_files[url] = base
    blk2 = blk.replace(url, '/fonts/' + seen_files[url])
    blk2 = re.sub(r'\s+', ' ', blk2)
    gf_out.append(blk2)
print('google font files:', {v: os.path.getsize(os.path.join(FONTS, v)) for v in set(seen_files.values())})

header = '/* Self-hosted fonts + Font Awesome 6.5.1 subset (only the icons this site uses).\n   Generated by tools/make-vendor.py - regenerate when adding an icon that is not listed. */\n'
open(os.path.join(ROOT, 'css', 'vendor.css'), 'w', encoding='utf8', newline='\n').write(header + '\n'.join(gf_out) + '\n' + fa_css + '\n')
open(os.path.join(SP, 'used-icons.txt'), 'w').write('\n'.join(sorted(used)))
print('written css/vendor.css', os.path.getsize(os.path.join(ROOT, 'css', 'vendor.css')), 'bytes')
