import base64, pathlib
R = pathlib.Path(__file__).parent / 'src'
def b64(f): return base64.b64encode((R/'fonts'/f).read_bytes()).decode()
fonts = f"""
@font-face {{ font-family: "Fraunces"; font-style: normal; font-weight: 100 900; font-display: swap; src: url(data:font/woff2;base64,{b64('fraunces.woff2')}) format("woff2"); }}
@font-face {{ font-family: "Fraunces"; font-style: italic; font-weight: 100 900; font-display: swap; src: url(data:font/woff2;base64,{b64('fraunces-italic.woff2')}) format("woff2"); }}
@font-face {{ font-family: "Inter"; font-style: normal; font-weight: 100 900; font-display: swap; src: url(data:font/woff2;base64,{b64('inter.woff2')}) format("woff2"); }}
@font-face {{ font-family: "JetBrains Mono"; font-style: normal; font-weight: 500; font-display: swap; src: url(data:font/woff2;base64,{b64('mono.woff2')}) format("woff2"); }}
"""
css = (R/'css/style.css').read_text(encoding='utf-8').replace('/* @FONTS@ (injecté par le build) */', fonts)
content = (R/'js/content.js').read_text(encoding='utf-8')
engine = (R/'js/interactions.js').read_text(encoding='utf-8')
import json
assets = {f'images/{f.name}': 'data:image/jpeg;base64,' + base64.b64encode(f.read_bytes()).decode() for f in sorted((R/'images').glob('*.jpg'))}
html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chef de projet formation : dans le vif du sujet — Prototype</title>
<style>{css}</style>
</head>
<body>
<div id="app"></div>
<script>window.SIM_MODE = 'single'; window.SIM_ASSETS = {json.dumps(assets)};</script>
<script>{content}</script>
<script>{engine}</script>
<script>Sim.boot();</script>
</body>
</html>"""
out = pathlib.Path(__file__).parent
(out/'index.html').write_text(html, encoding='utf-8')
print('ok', len(html)//1024, 'KB')
