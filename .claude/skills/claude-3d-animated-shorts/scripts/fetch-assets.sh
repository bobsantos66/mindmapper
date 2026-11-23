#!/usr/bin/env bash
# Downloads the third-party files this repo does not ship (their own licenses apply):
#  - Xbot.glb (Mixamo rig from the three.js examples) -> the skeleton every character is built on
#  - Horse.glb (three.js examples) -> only for the ?chase=1 demo
#  - Anton + Inter Black fonts (SIL OFL) -> captions and cards
set -euo pipefail
cd "$(dirname "$0")/../engine"
mkdir -p assets/rigs assets/horse film
TJ=https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/models/gltf
curl -fsSL -o assets/rigs/Xbot.glb   "$TJ/Xbot.glb"
curl -fsSL -o assets/horse/Horse.glb "$TJ/Horse.glb"
curl -fsSL -o film/Anton.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf"
curl -fsSL -o film/Inter-Black.otf "https://raw.githubusercontent.com/rsms/inter/v3.19/docs/font-files/Inter-Black.otf"
echo "assets ok"

# Poly Haven CC0 office props (1k glTF) used by the office set
python3 - <<'PY'
import json, os, urllib.request
UA = {'User-Agent': 'claude-3d-animated-shorts/1.0'}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
ids = ['metal_office_desk','modern_arm_chair_01','classic_laptop','office_notepads','clipboard','desk_lamp_arm_01','potted_plant_01','potted_plant_02','potted_plant_04','pachira_aquatica_01','drawer_cabinet','Shelf_01','book_encyclopedia_set_01','hanging_picture_frame_01','hanging_picture_frame_02','CoffeeCart_01','mounted_fluorescent_lights','modern_ceiling_lamp_01','sofa_02','modern_coffee_table_01','side_table_01','mid_century_lounge_chair','ceiling_fan','fire_alarm','projector_screen','alarm_clock_01','ceramic_vase_01','painted_wooden_shelves']
base = 'assets/props/polyhaven'
for i in ids:
    g = json.loads(get(f'https://api.polyhaven.com/files/{i}'))['gltf']['1k']['gltf']; os.makedirs(f'{base}/{i}', exist_ok=True)
    open(f'{base}/{i}/{i}.gltf', 'wb').write(get(g['url']))
    for rel, v in g.get('include', {}).items():
        p = os.path.join(base, i, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(get(v['url']))
print('poly haven ok')
PY
