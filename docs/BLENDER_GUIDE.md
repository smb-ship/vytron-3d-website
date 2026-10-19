# Blender guide — generating the VYTRON core

`scripts/create_vytron_core.py` builds the core procedurally with Blender's Python API: nucleus, glass strata, geometric cages, five orbital rings (chrome, glass, light, ticks), 28–36 neural nodes with a link network, materials, three area lights and a camera. It saves a `.blend` and exports an optimised GLB.

> Status: the script has been syntax-checked but **has not been run inside Blender** by the author of this package (Blender was not available). Treat the first run as a test; see "If something fails".

## Run it

Blender 3.6 LTS or 4.x.

```bash
# from the project root
blender --background --python scripts/create_vytron_core.py
```

Outputs:
- `blender/vytron-core.blend`
- `public/models/vytron-core.glb`

Options after `--`: `--glb PATH`, `--blend PATH`, `--no-export`, `--quality 1|2` (2 = more segments).

```bash
blender -b -P scripts/create_vytron_core.py -- --quality 2
```

macOS: use `/Applications/Blender.app/Contents/MacOS/Blender`. Windows: `"C:\Program Files\Blender Foundation\Blender 4.x\blender.exe"`.

GUI alternative: open Blender → *Scripting* workspace → *Open* the script → *Run Script*. The GLB is written to `public/models/` relative to the script.

Then rebuild the site: `npm run build` (the build detects the GLB).

## Naming contract with the website

| Object name | Browser behaviour |
|---|---|
| `Ring_##` | shown; spun around its local axis |
| `Core_Nucleus` | hidden (live shader nucleus is used) |
| `Node_##`, `Link_*` | hidden (live neural network is used) |
| `Cage_*`, `Strata_*` | shown as modelled |

Ring meshes are modelled around local Z; the glTF exporter (+Y up) turns that into local Y, which the site rotates. If you restyle the model keep these names and ring axes.

## Size and loading

Draco compression is disabled on purpose, so no decoder is downloaded at runtime. The model is small procedural geometry; check the size printed by the script (`[VYTRON] GLB written … KB`).

## If something fails

- Blender 4.x renamed shader sockets (e.g. *Transmission Weight*). The script tries both names; if a material looks wrong, adjust `make_material`.
- `export_scene.gltf` option names can differ between versions; the script retries without the Draco flag. Otherwise export manually: select the `VYTRON_Core` collection → *File → Export → glTF 2.0 (.glb)* → *Selection Only*, *Apply Modifiers*, +Y Up, no cameras or lights.
- Paste the console error into an issue or ask for help adjusting the script.
