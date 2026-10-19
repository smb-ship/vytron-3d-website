"""
VYTRON — procedural AI core generator for Blender
=================================================

Builds the VYTRON core entirely from code, sets up materials / lights / camera,
saves a native .blend and exports an optimised GLB for the website.

Run (headless):

    blender --background --python scripts/create_vytron_core.py

Optional arguments (after a literal `--`):

    --glb   PATH   output GLB   (default: public/models/vytron-core.glb)
    --blend PATH   output .blend (default: blender/vytron-core.blend)
    --no-export    only build + save the .blend
    --quality N    1 = light (default for web), 2 = detailed

    blender -b -P scripts/create_vytron_core.py -- --quality 2

Tested target: Blender 3.6 LTS and 4.x. The script uses only the stable bpy / bmesh
APIs and falls back gracefully when a shader socket was renamed between versions.

NAMING CONTRACT with the website (components/three/GlbStructure.tsx)
    Ring_##           orbital rings          -> spun around their local axis in the browser
    Core_Nucleus      luminous sphere        -> hidden in the browser (live shader nucleus is used)
    Node_## / Link_*  neural nodes and links -> hidden in the browser (live network is used)
    Cage_*, Strata_*  lattice and glass      -> displayed as modelled

Ring meshes are modelled with their axis along local +Z. After the glTF exporter
converts to Y-up, that axis becomes local +Y, which is what `rotateY` spins in three.js.
"""

import math
import os
import random
import sys

import bpy
import bmesh
from mathutils import Vector

# --------------------------------------------------------------------------- #
# Arguments / paths
# --------------------------------------------------------------------------- #

PALETTE = {
    "obsidian": "#070812",
    "navy": "#0B1020",
    "violet": "#7857FF",
    "cyan": "#59E7FF",
    "lavender": "#B9ACFF",
    "frost": "#F4F5FF",
}


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    root = os.path.abspath(os.path.join(os.path.dirname(bpy.data.filepath or __file__), ".."))
    try:
        root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    except NameError:  # running from Blender's text editor
        pass
    opts = {
        "glb": os.path.join(root, "public", "models", "vytron-core.glb"),
        "blend": os.path.join(root, "blender", "vytron-core.blend"),
        "export": True,
        "quality": 1,
    }
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--glb":
            opts["glb"] = argv[i + 1]
            i += 1
        elif a == "--blend":
            opts["blend"] = argv[i + 1]
            i += 1
        elif a == "--quality":
            opts["quality"] = int(argv[i + 1])
            i += 1
        elif a == "--no-export":
            opts["export"] = False
        i += 1
    return opts


def hex_to_rgba(h, a=1.0):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]
    lin = [(c / 12.92) if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (lin[0], lin[1], lin[2], a)


# --------------------------------------------------------------------------- #
# Scene helpers
# --------------------------------------------------------------------------- #

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for coll in list(bpy.data.collections):
        bpy.data.collections.remove(coll)


def make_collection(name):
    coll = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(coll)
    return coll


def link(obj, coll):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    coll.objects.link(obj)
    return obj


def set_input(node, names, value):
    """Set the first existing socket among `names` (sockets were renamed in Blender 4.0)."""
    for n in names if isinstance(names, (list, tuple)) else [names]:
        if n in node.inputs:
            node.inputs[n].default_value = value
            return True
    return False


def make_material(name, base, metallic=0.0, roughness=0.5, emission=None, emission_strength=0.0,
                  alpha=1.0, transmission=0.0, ior=1.45, iridescence=0.0, coat=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    set_input(bsdf, "Base Color", hex_to_rgba(base))
    set_input(bsdf, "Metallic", metallic)
    set_input(bsdf, "Roughness", roughness)
    set_input(bsdf, "IOR", ior)
    set_input(bsdf, ["Transmission Weight", "Transmission"], transmission)
    set_input(bsdf, ["Coat Weight", "Clearcoat"], coat)
    set_input(bsdf, ["Thin Film Thickness"], 400.0 if iridescence else 0.0)
    if emission:
        set_input(bsdf, ["Emission Color", "Emission"], hex_to_rgba(emission))
        set_input(bsdf, "Emission Strength", emission_strength)
    if alpha < 1.0:
        set_input(bsdf, "Alpha", alpha)
        if hasattr(mat, "blend_method"):  # removed in Blender 4.2+, alpha then works automatically
            mat.blend_method = "BLEND"
    return mat


def assign(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def shade_smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True


def apply_modifiers(obj):
    bpy.context.view_layer.objects.active = obj
    for m in list(obj.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=m.name)
        except RuntimeError:
            pass


# --------------------------------------------------------------------------- #
# Geometry builders
# --------------------------------------------------------------------------- #

def uv_sphere(name, radius, segments, rings, coll):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=segments, ring_count=rings)
    obj = bpy.context.active_object
    obj.name = name
    shade_smooth(obj)
    return link(obj, coll)


def ico_sphere(name, radius, subdiv, coll):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=radius, subdivisions=subdiv)
    obj = bpy.context.active_object
    obj.name = name
    return link(obj, coll)


def torus_arc(name, major, minor, arc, major_seg, minor_seg, coll):
    """Partial torus (arc in radians) built with bmesh so it has open, capped ends."""
    bm = bmesh.new()
    rings = []
    steps = max(8, int(major_seg * arc / (2 * math.pi)))
    for i in range(steps + 1):
        a = arc * i / steps
        cx, cy = math.cos(a) * major, math.sin(a) * major
        ring = []
        for j in range(minor_seg):
            b = 2 * math.pi * j / minor_seg
            r = major + math.cos(b) * minor
            ring.append(bm.verts.new((math.cos(a) * r, math.sin(a) * r, math.sin(b) * minor)))
        rings.append(ring)
        _ = (cx, cy)
    for i in range(steps):
        for j in range(minor_seg):
            bm.faces.new((rings[i][j], rings[i][(j + 1) % minor_seg],
                          rings[i + 1][(j + 1) % minor_seg], rings[i + 1][j]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    bm.normal_update()
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    shade_smooth(obj)
    return obj


def torus_full(name, major, minor, major_seg, minor_seg, coll):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
                                     major_segments=major_seg, minor_segments=minor_seg)
    obj = bpy.context.active_object
    obj.name = name
    shade_smooth(obj)
    return link(obj, coll)


def tick_ring(name, radius, count, coll):
    """A ring of small chrome ticks (every 6th is longer) merged into one mesh."""
    bm = bmesh.new()
    for i in range(count):
        a = 2 * math.pi * i / count
        long_tick = i % 6 == 0
        h = 0.05 * (2.6 if long_tick else 1.0)
        w = 0.012
        cx, cy = math.cos(a) * radius, math.sin(a) * radius
        tx, ty = -math.sin(a), math.cos(a)  # tangent
        nx, ny = math.cos(a), math.sin(a)   # radial
        # tick is long along the tangent direction to mirror the web scene
        corners = []
        for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            corners.append((cx + tx * h * sx / 2 + nx * w * sz / 2,
                            cy + ty * h * sx / 2 + ny * w * sz / 2))
        top = [bm.verts.new((x, y, w / 2)) for x, y in corners]
        bot = [bm.verts.new((x, y, -w / 2)) for x, y in corners]
        bm.faces.new(top)
        bm.faces.new(bot[::-1])
        for k in range(4):
            bm.faces.new((top[k], top[(k + 1) % 4], bot[(k + 1) % 4], bot[k]))
    bm.normal_update()
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    return obj


def wireframe_of(obj, thickness):
    mod = obj.modifiers.new("Wire", "WIREFRAME")
    mod.thickness = thickness
    mod.use_replace = True
    mod.use_even_offset = True
    apply_modifiers(obj)
    return obj


def fibonacci_nodes(count, seed=7):
    rnd = random.Random(seed)
    golden = math.pi * (3 - math.sqrt(5))
    pts = []
    for i in range(count):
        y = 1 - (i / (count - 1)) * 2
        r = math.sqrt(max(0.0, 1 - y * y))
        th = golden * i
        d = Vector((math.cos(th) * r, math.sin(th) * r, y))  # Blender is Z-up
        pts.append(d * (1.5 + rnd.random() * 0.55))
    return pts


# --------------------------------------------------------------------------- #
# Build
# --------------------------------------------------------------------------- #

def build_core(quality):
    coll = make_collection("VYTRON_Core")
    hi = quality >= 2
    seg = 96 if hi else 48
    ring_seg = 160 if hi else 96

    # materials ------------------------------------------------------------
    m_chrome = make_material("M_Chrome", PALETTE["frost"], metallic=1.0, roughness=0.12, coat=0.6)
    m_glass = make_material("M_Glass_Violet", PALETTE["lavender"], roughness=0.05, alpha=0.25,
                            transmission=0.9, ior=1.45, iridescence=1.0)
    m_glass_c = make_material("M_Glass_Cyan", PALETTE["cyan"], roughness=0.04, alpha=0.18,
                              transmission=0.9, ior=1.4, iridescence=1.0)
    m_core = make_material("M_Energy_Core", PALETTE["violet"], roughness=0.3,
                           emission=PALETTE["cyan"], emission_strength=6.0)
    m_emit_v = make_material("M_Emissive_Violet", PALETTE["violet"], emission=PALETTE["violet"], emission_strength=4.0)
    m_emit_c = make_material("M_Emissive_Cyan", PALETTE["cyan"], emission=PALETTE["cyan"], emission_strength=5.0)
    m_wire = make_material("M_Lattice_Wire", PALETTE["lavender"], metallic=0.9, roughness=0.2,
                           emission=PALETTE["lavender"], emission_strength=0.8)

    # nucleus --------------------------------------------------------------
    nuc = uv_sphere("Core_Nucleus", 0.4, seg, seg // 2, coll)
    assign(nuc, m_core)

    # glass strata ---------------------------------------------------------
    shell = uv_sphere("Strata_Shell", 0.66, seg, seg // 2, coll)
    assign(shell, m_glass)
    facet = ico_sphere("Strata_Facets", 0.88, 2, coll)
    assign(facet, m_glass_c)  # flat shaded on purpose: crystalline facets

    # geometric lattice ----------------------------------------------------
    cage = ico_sphere("Cage_Outer", 1.02, 2, coll)
    wireframe_of(cage, 0.006)
    assign(cage, m_wire)
    cage_in = ico_sphere("Cage_Inner", 0.78, 1, coll)
    cage_in.rotation_euler = (math.radians(31), math.radians(17), 0)
    wireframe_of(cage_in, 0.005)
    assign(cage_in, m_wire)

    # orbital rings (axis = local Z; see naming contract) ----------------------
    r1 = torus_full("Ring_01", 1.24, 0.014, ring_seg, 12, coll)
    r1.rotation_euler = (1.1, 0.0, 0.2)
    assign(r1, m_chrome)

    r2 = torus_arc("Ring_02", 1.42, 0.05, math.pi * 1.55, ring_seg, 16, coll)
    r2.rotation_euler = (0.45, 0.6, 0.0)
    assign(r2, m_chrome)
    for end_angle in (0.0, math.pi * 1.55):
        cap = uv_sphere("Ring_02_Cap", 0.045, 24, 12, coll)
        cap.location = (math.cos(end_angle) * 1.42, math.sin(end_angle) * 1.42, 0)
        cap.parent = r2
        assign(cap, m_emit_c)

    r3 = torus_full("Ring_03", 1.6, 0.006, ring_seg, 8, coll)
    r3.rotation_euler = (1.62, 0.0, 0.5)
    assign(r3, m_emit_c)

    r4 = torus_full("Ring_04", 1.82, 0.034, ring_seg, 14, coll)
    r4.rotation_euler = (0.95, -0.9, 0.0)
    assign(r4, m_glass)

    r5 = tick_ring("Ring_05", 2.06, 84 if hi else 60, coll)
    r5.rotation_euler = (0.2, 1.2, 0.3)
    assign(r5, m_chrome)

    # neural nodes + links -----------------------------------------------------
    pts = fibonacci_nodes(36 if hi else 28)
    for i, p in enumerate(pts):
        n = uv_sphere("Node_%02d" % (i + 1), 0.032, 16, 8, coll)
        n.location = p
        assign(n, m_emit_c if i % 3 else m_emit_v)

    bm = bmesh.new()
    verts = [bm.verts.new(p) for p in pts]
    seen = set()
    for i, p in enumerate(pts):
        near = sorted(range(len(pts)), key=lambda j: (pts[j] - p).length_squared)[1:3]
        for j in near:
            key = (min(i, j), max(i, j))
            if key not in seen:
                seen.add(key)
                bm.edges.new((verts[i], verts[j]))
    mesh = bpy.data.meshes.new("Link_Network")
    bm.to_mesh(mesh)
    bm.free()
    links = bpy.data.objects.new("Link_Network", mesh)
    coll.objects.link(links)
    wireframe_of(links, 0.0035)
    assign(links, m_emit_c)

    return coll


def setup_world_light_camera():
    scene = bpy.context.scene
    world = bpy.data.worlds.new("VYTRON_World")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = hex_to_rgba(PALETTE["obsidian"])
    bg.inputs["Strength"].default_value = 1.0
    scene.world = world

    rig = make_collection("VYTRON_Studio")

    def area(name, loc, color, power, size):
        data = bpy.data.lights.new(name, "AREA")
        data.color = hex_to_rgba(color)[:3]
        data.energy = power
        data.size = size
        obj = bpy.data.objects.new(name, data)
        obj.location = loc
        rig.objects.link(obj)
        direction = Vector((0, 0, 0)) - Vector(loc)
        obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        return obj

    area("Key_Violet", (-4.5, -4.0, 2.5), PALETTE["violet"], 900, 4)
    area("Rim_Cyan", (4.5, -2.0, 1.5), PALETTE["cyan"], 700, 3)
    area("Top_Frost", (0.0, 1.0, 5.0), PALETTE["frost"], 300, 3)

    cam_data = bpy.data.cameras.new("VYTRON_Camera")
    cam_data.lens = 70
    cam = bpy.data.objects.new("VYTRON_Camera", cam_data)
    cam.location = (0.0, -9.0, 1.1)
    rig.objects.link(cam)
    cam.rotation_euler = (Vector((0, 0, 0)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam

    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in \
        bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items.keys() else "BLENDER_EEVEE"
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    return rig


def export_glb(coll, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for o in coll.objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = coll.objects[0]
    kwargs = dict(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_materials="EXPORT",
        export_draco_mesh_compression_enable=False,  # no runtime decoder download needed
    )
    try:
        bpy.ops.export_scene.gltf(**kwargs)
    except TypeError:
        kwargs.pop("export_draco_mesh_compression_enable", None)
        bpy.ops.export_scene.gltf(**kwargs)
    size = os.path.getsize(path) / 1024
    print("[VYTRON] GLB written: %s (%.0f KB)" % (path, size))


def main():
    opts = parse_args()
    reset_scene()
    core = build_core(opts["quality"])
    setup_world_light_camera()

    os.makedirs(os.path.dirname(opts["blend"]), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=opts["blend"])
    print("[VYTRON] Blend saved: %s" % opts["blend"])

    if opts["export"]:
        export_glb(core, opts["glb"])
    print("[VYTRON] Done. Objects in core: %d" % len(core.objects))


if __name__ == "__main__":
    main()
