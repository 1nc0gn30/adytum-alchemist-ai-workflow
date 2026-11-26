#!/usr/bin/env python3
"""
Museum-Grade Illuminated 22 Major Arcana Plate Generator
Renders 2x supersampled (1920x2880 -> 960x1440 / 560x840) high-DPI plates
with real Hebrew Unicode fonts (DejaVu / Liberation), zero tofu glyphs,
strict inner margin bounds, and 22 unique sacred-geometry compositions.
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

REPO_TAROT = os.path.expanduser("~/NullAITech/adytum-alchemist-ai-workflow/public/tarot")
REPO_PUBLIC = os.path.expanduser("~/NullAITech/adytum-alchemist-ai-workflow/public")
STUDIO_CARDS = os.path.expanduser("~/NullAITech/zoth-studio-v2/public/assets/tarot3d/cards")

FONT_SERIF_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
FONT_SERIF_REG = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
FONT_HEBREW_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_MONO_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

GOLD_LIGHT = (248, 229, 160)
GOLD_MID = (212, 175, 55)
GOLD_DIM = (138, 108, 38)
IVORY = (245, 240, 228)
MUTED = (182, 176, 162)

ELEMENT_PALETTES = {
    "Air": ((12, 16, 28), (56, 189, 248), (186, 230, 253)),
    "Fire": ((24, 11, 14), (249, 115, 22), (254, 215, 170)),
    "Water": ((10, 18, 28), (99, 102, 241), (199, 210, 254)),
    "Earth": ((12, 20, 16), (16, 185, 129), (167, 243, 208)),
}

KEYS = [
    (0, "0", "THE FOOL", "Zero-Point Potential", "א", "Aleph", 1, "Air", "fool.jpg", "key_00_fool.jpg"),
    (1, "I", "THE MAGICIAN", "Single-Pointed Logos", "ב", "Beth", 2, "Air", "magician.jpg", "key_01_magician.jpg"),
    (2, "II", "THE HIGH PRIESTESS", "Cryptographic Memory", "ג", "Gimel", 3, "Water", "highpriestess.jpg", "key_02_highpriestess.jpg"),
    (3, "III", "THE EMPRESS", "Generative Synthesis", "ד", "Daleth", 4, "Earth", "empress.jpg", "key_03_empress.jpg"),
    (4, "IV", "THE EMPEROR", "Immutable Invariants", "ה", "Heh", 5, "Fire", "emperor.jpg", "key_04_emperor.jpg"),
    (5, "V", "THE HIEROPHANT", "Canonical Contracts", "ו", "Vav", 6, "Earth", "hierorphant.jpg", "key_05_hierorphant.jpg"),
    (6, "VI", "THE LOVERS", "Explicit Boundaries", "ז", "Zain", 7, "Air", "lovers.jpg", "key_06_lovers.jpg"),
    (7, "VII", "THE CHARIOT", "Loopback Enclosure", "ח", "Cheth", 8, "Water", "chariot.jpg", "key_07_chariot.jpg"),
    (8, "VIII", "STRENGTH", "Resilient Recovery", "ט", "Teth", 9, "Fire", "strength.jpg", "key_08_strength.jpg"),
    (9, "IX", "THE HERMIT", "Deterministic Audits", "י", "Yod", 10, "Earth", "hermit.jpg", "key_09_hermit.jpg"),
    (10, "X", "WHEEL OF FORTUNE", "Replayable State Loops", "כ", "Kaph", 20, "Fire", "wheeloffortune.jpg", "key_10_wheeloffortune.jpg"),
    (11, "XI", "JUSTICE", "Equilibrated Budgets", "ל", "Lamed", 30, "Air", "justice.jpg", "key_11_justice.jpg"),
    (12, "XII", "THE HANGED MAN", "Reactive Async Flow", "מ", "Mem", 40, "Water", "hangedman.jpg", "key_12_hangedman.jpg"),
    (13, "XIII", "DEATH", "Cruft Pruning", "נ", "Nun", 50, "Water", "death.jpg", "key_13_death.jpg"),
    (14, "XIV", "TEMPERANCE", "Calibrated Equilibrium", "ס", "Samekh", 60, "Fire", "temperance.jpg", "key_14_temperance.jpg"),
    (15, "XV", "THE DEVIL", "Anti-Deception Audit", "ע", "Ayin", 70, "Earth", "devil.jpg", "key_15_devil.jpg"),
    (16, "XVI", "THE TOWER", "Chaos Resilience", "פ", "Peh", 80, "Fire", "tower.jpg", "key_16_tower.jpg"),
    (17, "XVII", "THE STAR", "Transparent Telemetry", "צ", "Tzaddi", 90, "Air", "star.jpg", "key_17_star.jpg"),
    (18, "XVIII", "THE MOON", "Deep Synaptic Retention", "ק", "Qoph", 100, "Water", "moon.jpg", "key_18_moon.jpg"),
    (19, "XIX", "THE SUN", "High-Fidelity Craft", "ר", "Resh", 200, "Fire", "sun.jpg", "key_19_sun.jpg"),
    (20, "XX", "JUDGEMENT", "Release Gate Sentinel", "ש", "Shin", 300, "Fire", "judgement.jpg", "key_20_judgement.jpg"),
    (21, "XXI", "THE WORLD", "Sovereign Wholeness", "ת", "Tav", 400, "Earth", "world.jpg", "key_21_world.jpg"),
]


def _poly(cx, cy, r, sides, rot_deg=-90):
    pts = []
    for i in range(sides):
        a = math.radians(rot_deg + i * (360.0 / sides))
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def _star(cx, cy, r_out, r_in, points, rot_deg=-90):
    pts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.radians(rot_deg + i * (180.0 / points))
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def _lemniscate(cx, cy, rx, ry, steps=96):
    pts = []
    for i in range(steps + 1):
        t = (i / steps) * 2 * math.pi
        denom = 1 + math.sin(t) ** 2
        x = cx + rx * math.cos(t) / denom
        y = cy + ry * math.sin(t) * math.cos(t) / denom
        pts.append((x, y))
    return pts


def _fit_text(draw, text, font_path, max_size, max_width):
    size = max_size
    while size >= 20:
        font = ImageFont.truetype(font_path, size)
        bb = draw.textbbox((0, 0), text, font=font)
        if (bb[2] - bb[0]) <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(font_path, 20)


def _draw_rosette(draw, cx, cy, r):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=GOLD_MID, width=3)
    draw.polygon(_star(cx, cy, r * 0.82, r * 0.32, 8), outline=GOLD_LIGHT, fill=GOLD_DIM)
    draw.ellipse([cx - r * 0.2, cy - r * 0.2, cx + r * 0.2, cy + r * 0.2], fill=GOLD_LIGHT)


def _draw_sacred_emblem(draw, key_num, cx, cy, R, accent, accent_hi):
    # Subtle outer celestial degree dial
    draw.ellipse([cx - R, cy - R, cx + R, cy + R], outline=GOLD_DIM, width=3)
    draw.ellipse([cx - R * 0.92, cy - R * 0.92, cx + R * 0.92, cy + R * 0.92], outline=accent, width=2)
    for deg in range(0, 360, 10):
        a = math.radians(deg)
        inner = R * (0.93 if deg % 30 == 0 else 0.96)
        w = 4 if deg % 30 == 0 else 2
        c = GOLD_LIGHT if deg % 30 == 0 else GOLD_DIM
        draw.line(
            [cx + inner * math.cos(a), cy + inner * math.sin(a), cx + R * math.cos(a), cy + R * math.sin(a)],
            fill=c,
            width=w,
        )

    if key_num == 0:  # The Fool: Radiant white sun + twin peaks + precipice arc
        draw.polygon(_star(cx, cy - R * 0.26, R * 0.42, R * 0.19, 12), fill=GOLD_DIM, outline=GOLD_LIGHT)
        draw.ellipse([cx - R * 0.16, cy - R * 0.42, cx + R * 0.16, cy - R * 0.10], fill=IVORY, outline=GOLD_LIGHT, width=4)
        draw.polygon([(cx - R * 0.68, cy + R * 0.56), (cx - R * 0.22, cy - R * 0.02), (cx + R * 0.20, cy + R * 0.56)], outline=GOLD_MID, width=5)
        draw.polygon([(cx - R * 0.12, cy + R * 0.56), (cx + R * 0.34, cy + R * 0.08), (cx + R * 0.68, cy + R * 0.56)], outline=accent_hi, width=5)
        draw.line([cx - R * 0.72, cy + R * 0.56, cx + R * 0.72, cy + R * 0.56], fill=GOLD_LIGHT, width=5)

    elif key_num == 1:  # The Magician: Lemniscate + vertical wand + 4 elemental polygons
        pts = _lemniscate(cx, cy - R * 0.46, R * 0.48, R * 0.34)
        draw.line(pts, fill=GOLD_LIGHT, width=7)
        draw.line([cx, cy - R * 0.24, cx, cy + R * 0.62], fill=GOLD_MID, width=8)
        draw.ellipse([cx - 20, cy - R * 0.28 - 20, cx + 20, cy - R * 0.28 + 20], fill=GOLD_LIGHT)
        draw.polygon(_poly(cx - R * 0.44, cy + R * 0.16, R * 0.17, 3, -90), outline=accent_hi, width=5)
        draw.polygon(_poly(cx + R * 0.44, cy + R * 0.16, R * 0.17, 3, 90), outline=accent_hi, width=5)
        draw.polygon(_poly(cx - R * 0.32, cy + R * 0.48, R * 0.14, 4, 45), outline=GOLD_LIGHT, width=4)
        draw.ellipse([cx + R * 0.18, cy + R * 0.34, cx + R * 0.46, cy + R * 0.62], outline=GOLD_LIGHT, width=4)

    elif key_num == 2:  # High Priestess: Twin pillars B & J + crescent + vesica veil
        for sx, fill_c in ((-R * 0.46, (30, 34, 48)), (R * 0.46, (235, 228, 210))):
            draw.rectangle([cx + sx - 44, cy - R * 0.56, cx + sx + 44, cy + R * 0.56], fill=fill_c, outline=GOLD_MID, width=5)
        draw.ellipse([cx - R * 0.26, cy - R * 0.36, cx + R * 0.26, cy + R * 0.16], outline=accent_hi, width=5)
        draw.ellipse([cx - R * 0.19, cy + R * 0.16, cx + R * 0.19, cy + R * 0.54], fill=GOLD_LIGHT)
        draw.ellipse([cx - R * 0.11, cy + R * 0.10, cx + R * 0.25, cy + R * 0.46], fill=(10, 18, 28))

    elif key_num == 3:  # The Empress: Venus glyph + 12-star crown + hexagram bloom
        draw.ellipse([cx - R * 0.32, cy - R * 0.44, cx + R * 0.32, cy + R * 0.20], outline=GOLD_LIGHT, width=8)
        draw.line([cx, cy + R * 0.20, cx, cy + R * 0.64], fill=GOLD_LIGHT, width=8)
        draw.line([cx - R * 0.24, cy + R * 0.42, cx + R * 0.24, cy + R * 0.42], fill=GOLD_LIGHT, width=8)
        draw.polygon(_poly(cx, cy - R * 0.12, R * 0.22, 6), outline=accent_hi, width=4)
        for i in range(12):
            a = math.radians(-165 + i * 13.6)
            sx, sy = cx + R * 0.62 * math.cos(a), cy - R * 0.14 + R * 0.52 * math.sin(a)
            draw.polygon(_star(sx, sy, 14, 6, 6), fill=GOLD_LIGHT)

    elif key_num == 4:  # The Emperor: Cubic throne + solar orb + equilateral crown
        draw.rectangle([cx - R * 0.46, cy - R * 0.20, cx + R * 0.46, cy + R * 0.56], outline=GOLD_MID, width=6)
        draw.rectangle([cx - R * 0.30, cy - R * 0.04, cx + R * 0.30, cy + R * 0.40], outline=accent_hi, width=4)
        draw.polygon([(cx - R * 0.44, cy - R * 0.24), (cx - R * 0.22, cy - R * 0.58), (cx, cy - R * 0.32), (cx + R * 0.22, cy - R * 0.58), (cx + R * 0.44, cy - R * 0.24)], outline=GOLD_LIGHT, width=6)
        draw.ellipse([cx - R * 0.16, cy + R * 0.02, cx + R * 0.16, cy + R * 0.34], outline=GOLD_LIGHT, width=6)
        draw.line([cx, cy + R * 0.34, cx, cy + R * 0.54], fill=GOLD_LIGHT, width=6)

    elif key_num == 5:  # The Hierophant: Crossed keys + triple papal cross
        draw.line([cx, cy - R * 0.58, cx, cy + R * 0.58], fill=GOLD_LIGHT, width=8)
        for dy, half in ((-0.40, 0.16), (-0.22, 0.26), (-0.02, 0.36)):
            draw.line([cx - R * half, cy + R * dy, cx + R * half, cy + R * dy], fill=GOLD_LIGHT, width=7)
        draw.line([cx - R * 0.44, cy + R * 0.52, cx + R * 0.44, cy + R * 0.04], fill=accent_hi, width=6)
        draw.line([cx + R * 0.44, cy + R * 0.52, cx - R * 0.44, cy + R * 0.04], fill=GOLD_MID, width=6)
        draw.ellipse([cx - R * 0.54, cy + R * 0.42, cx - R * 0.34, cy + R * 0.62], outline=accent_hi, width=5)
        draw.ellipse([cx + R * 0.34, cy + R * 0.42, cx + R * 0.54, cy + R * 0.62], outline=GOLD_MID, width=5)

    elif key_num == 6:  # The Lovers: Interlocking Vesica Piscis + radiant sun above
        draw.ellipse([cx - R * 0.56, cy - R * 0.22, cx + R * 0.14, cy + R * 0.48], outline=GOLD_LIGHT, width=6)
        draw.ellipse([cx - R * 0.14, cy - R * 0.22, cx + R * 0.56, cy + R * 0.48], outline=accent_hi, width=6)
        draw.polygon(_star(cx, cy - R * 0.46, R * 0.26, R * 0.12, 12), fill=GOLD_DIM, outline=GOLD_LIGHT)
        draw.line([cx, cy - R * 0.20, cx, cy + R * 0.54], fill=GOLD_MID, width=4)

    elif key_num == 7:  # The Chariot: Star canopy + armored cube + twin wheels
        draw.rectangle([cx - R * 0.48, cy - R * 0.52, cx + R * 0.48, cy + R * 0.34], outline=GOLD_LIGHT, width=6)
        draw.polygon(_poly(cx, cy - R * 0.08, R * 0.28, 4, 45), outline=accent_hi, width=5)
        for wx in (-R * 0.52, R * 0.52):
            draw.ellipse([cx + wx - R * 0.18, cy + R * 0.16, cx + wx + R * 0.18, cy + R * 0.52], outline=GOLD_MID, width=6)
            for sp in range(8):
                a = math.radians(sp * 45)
                draw.line([cx + wx, cy + R * 0.34, cx + wx + R * 0.18 * math.cos(a), cy + R * 0.34 + R * 0.18 * math.sin(a)], fill=GOLD_DIM, width=3)
        for sx in (-0.30, -0.10, 0.10, 0.30):
            draw.polygon(_star(cx + R * sx, cy - R * 0.36, 16, 7, 6), fill=GOLD_LIGHT)

    elif key_num == 8:  # Strength: Radiant solar mane + lemniscate crown
        draw.line(_lemniscate(cx, cy - R * 0.48, R * 0.44, R * 0.28), fill=GOLD_LIGHT, width=7)
        draw.polygon(_star(cx, cy + R * 0.08, R * 0.52, R * 0.32, 16), outline=GOLD_MID, fill=(40, 24, 14))
        draw.ellipse([cx - R * 0.26, cy - R * 0.18, cx + R * 0.26, cy + R * 0.34], outline=accent_hi, width=6)
        draw.polygon(_poly(cx, cy + R * 0.08, R * 0.18, 3, -90), outline=GOLD_LIGHT, width=5)

    elif key_num == 9:  # The Hermit: 6-pointed Seal of Solomon inside golden lantern
        draw.polygon(_poly(cx, cy, R * 0.56, 6, 0), outline=GOLD_MID, width=6)
        draw.polygon(_poly(cx, cy, R * 0.44, 3, -90), outline=GOLD_LIGHT, width=6)
        draw.polygon(_poly(cx, cy, R * 0.44, 3, 90), outline=accent_hi, width=6)
        draw.ellipse([cx - R * 0.10, cy - R * 0.10, cx + R * 0.10, cy + R * 0.10], fill=IVORY)

    elif key_num == 10:  # Wheel of Fortune: 8-spoked Rota wheel + concentric rings
        for rad, col, w in ((0.64, GOLD_LIGHT, 7), (0.48, accent_hi, 4), (0.20, GOLD_MID, 6)):
            draw.ellipse([cx - R * rad, cy - R * rad, cx + R * rad, cy + R * rad], outline=col, width=w)
        for i in range(8):
            a = math.radians(i * 45)
            draw.line([cx + R * 0.20 * math.cos(a), cy + R * 0.20 * math.sin(a), cx + R * 0.64 * math.cos(a), cy + R * 0.64 * math.sin(a)], fill=GOLD_MID, width=5)

    elif key_num == 11:  # Justice: Upright double-edged sword + equilibrated scales
        draw.line([cx, cy - R * 0.64, cx, cy + R * 0.64], fill=GOLD_LIGHT, width=8)
        draw.line([cx - R * 0.54, cy - R * 0.14, cx + R * 0.54, cy - R * 0.14], fill=GOLD_MID, width=6)
        draw.line([cx - R * 0.20, cy + R * 0.36, cx + R * 0.20, cy + R * 0.36], fill=GOLD_LIGHT, width=8)
        for sx in (-R * 0.46, R * 0.46):
            draw.line([cx + sx, cy - R * 0.14, cx + sx - R * 0.14, cy + R * 0.20], fill=accent_hi, width=4)
            draw.line([cx + sx, cy - R * 0.14, cx + sx + R * 0.14, cy + R * 0.20], fill=accent_hi, width=4)
            draw.arc([cx + sx - R * 0.18, cy + R * 0.06, cx + sx + R * 0.18, cy + R * 0.34], 0, 180, fill=GOLD_LIGHT, width=6)

    elif key_num == 12:  # The Hanged Man: Tau cross + inverted triangle + lower radiant halo
        draw.line([cx - R * 0.54, cy - R * 0.46, cx + R * 0.54, cy - R * 0.46], fill=GOLD_LIGHT, width=10)
        draw.line([cx, cy - R * 0.46, cx, cy + R * 0.26], fill=GOLD_MID, width=8)
        draw.polygon(_poly(cx, cy - R * 0.02, R * 0.34, 3, 90), outline=accent_hi, width=6)
        draw.polygon(_star(cx, cy + R * 0.38, R * 0.26, R * 0.13, 12), fill=GOLD_DIM, outline=GOLD_LIGHT)

    elif key_num == 13:  # Death: 5-petaled Mystic Rose + rising dawn sun + crescent
        for i in range(5):
            a = math.radians(-90 + i * 72)
            px, py = cx + R * 0.22 * math.cos(a), cy - R * 0.04 + R * 0.22 * math.sin(a)
            draw.ellipse([px - R * 0.18, py - R * 0.18, px + R * 0.18, py + R * 0.18], outline=IVORY, width=5)
        draw.ellipse([cx - R * 0.12, cy - R * 0.16, cx + R * 0.12, cy + R * 0.08], fill=GOLD_LIGHT)
        draw.arc([cx - R * 0.62, cy - R * 0.58, cx + R * 0.62, cy + R * 0.66], 200, 340, fill=accent_hi, width=7)

    elif key_num == 14:  # Temperance: Solar triangle in square + flowing alchemical wave
        draw.rectangle([cx - R * 0.46, cy - R * 0.46, cx + R * 0.46, cy + R * 0.46], outline=GOLD_MID, width=5)
        draw.polygon(_poly(cx, cy + R * 0.04, R * 0.42, 3, -90), outline=GOLD_LIGHT, width=7)
        wave = [(cx - R * 0.52 + i * (R * 1.04 / 60), cy + R * 0.14 * math.sin(i * 0.32)) for i in range(61)]
        draw.line(wave, fill=accent_hi, width=6)

    elif key_num == 15:  # The Devil: Inverted pentagram + broken chain ring + truth eye
        pts = _poly(cx, cy, R * 0.56, 5, 90)
        order = [0, 2, 4, 1, 3, 0]
        draw.line([pts[i] for i in order], fill=GOLD_MID, width=6)
        draw.arc([cx - R * 0.32, cy - R * 0.18, cx + R * 0.32, cy + R * 0.18], 0, 360, fill=accent_hi, width=5)
        draw.ellipse([cx - R * 0.11, cy - R * 0.11, cx + R * 0.11, cy + R * 0.11], fill=GOLD_LIGHT)

    elif key_num == 16:  # The Tower: Crowned spire + diagonal lightning bolt
        draw.polygon([(cx - R * 0.24, cy + R * 0.62), (cx - R * 0.18, cy - R * 0.32), (cx + R * 0.18, cy - R * 0.32), (cx + R * 0.24, cy + R * 0.62)], outline=GOLD_MID, width=6)
        draw.polygon([(cx - R * 0.26, cy - R * 0.34), (cx - R * 0.14, cy - R * 0.56), (cx, cy - R * 0.40), (cx + R * 0.14, cy - R * 0.56), (cx + R * 0.26, cy - R * 0.34)], outline=GOLD_LIGHT, width=5)
        bolt = [(cx + R * 0.56, cy - R * 0.60), (cx + R * 0.10, cy - R * 0.22), (cx + R * 0.28, cy - R * 0.16), (cx - R * 0.44, cy + R * 0.34)]
        draw.line(bolt, fill=accent_hi, width=10)

    elif key_num == 17:  # The Star: Great 8-pointed star + 7 satellite stars + water ripples
        draw.polygon(_star(cx, cy - R * 0.08, R * 0.44, R * 0.16, 8), fill=GOLD_DIM, outline=GOLD_LIGHT)
        for i in range(7):
            a = math.radians(-165 + i * 25)
            sx, sy = cx + R * 0.64 * math.cos(a), cy - R * 0.08 + R * 0.52 * math.sin(a)
            draw.polygon(_star(sx, sy, 22, 9, 8), fill=accent_hi)
        for row in (0.44, 0.56):
            wave = [(cx - R * 0.56 + i * (R * 1.12 / 48), cy + R * row + 12 * math.sin(i * 0.5)) for i in range(49)]
            draw.line(wave, fill=accent_hi, width=5)

    elif key_num == 18:  # The Moon: Luminous crescent + twin watchtowers + winding path
        draw.ellipse([cx - R * 0.28, cy - R * 0.58, cx + R * 0.28, cy - R * 0.02], fill=GOLD_LIGHT)
        draw.ellipse([cx - R * 0.14, cy - R * 0.60, cx + R * 0.38, cy - R * 0.08], fill=(10, 18, 28))
        for tx in (-R * 0.46, R * 0.46):
            draw.rectangle([cx + tx - 38, cy + R * 0.02, cx + tx + 38, cy + R * 0.56], outline=GOLD_MID, width=5)
        draw.polygon([(cx - R * 0.24, cy + R * 0.60), (cx - R * 0.06, cy + R * 0.08), (cx + R * 0.06, cy + R * 0.08), (cx + R * 0.24, cy + R * 0.60)], outline=accent_hi, width=5)

    elif key_num == 19:  # The Sun: 16-rayed solar disk + concentric golden glory
        draw.polygon(_star(cx, cy, R * 0.64, R * 0.34, 16), fill=GOLD_DIM, outline=GOLD_LIGHT)
        draw.ellipse([cx - R * 0.30, cy - R * 0.30, cx + R * 0.30, cy + R * 0.30], fill=GOLD_MID, outline=IVORY, width=6)
        draw.ellipse([cx - R * 0.14, cy - R * 0.14, cx + R * 0.14, cy + R * 0.14], fill=IVORY)

    elif key_num == 20:  # Judgement: Celestial horn rays + ascending wings + cross banner
        draw.polygon([(cx - R * 0.12, cy - R * 0.58), (cx + R * 0.12, cy - R * 0.58), (cx + R * 0.32, cy - R * 0.04), (cx - R * 0.32, cy - R * 0.04)], outline=GOLD_LIGHT, width=6)
        draw.line([cx, cy - R * 0.04, cx, cy + R * 0.56], fill=accent_hi, width=8)
        draw.line([cx - R * 0.36, cy + R * 0.24, cx + R * 0.36, cy + R * 0.24], fill=accent_hi, width=8)
        for sign in (-1, 1):
            draw.arc([cx + sign * R * 0.10 - R * 0.42, cy - R * 0.24, cx + sign * R * 0.10 + R * 0.42, cy + R * 0.52], 0, 360, fill=GOLD_MID, width=4)

    else:  # 21 The World: Cosmic laurel vesica + 4 fixed corner medallions + inner star
        draw.ellipse([cx - R * 0.44, cy - R * 0.62, cx + R * 0.44, cy + R * 0.62], outline=GOLD_LIGHT, width=10)
        draw.ellipse([cx - R * 0.36, cy - R * 0.54, cx + R * 0.36, cy + R * 0.54], outline=accent_hi, width=4)
        draw.polygon(_star(cx, cy, R * 0.28, R * 0.12, 8), fill=GOLD_DIM, outline=GOLD_LIGHT)
        for dx, dy in ((-0.54, -0.46), (0.54, -0.46), (-0.54, 0.46), (0.54, 0.46)):
            draw.ellipse([cx + R * dx - 34, cy + R * dy - 34, cx + R * dx + 34, cy + R * dy + 34], outline=GOLD_MID, width=5)
            draw.ellipse([cx + R * dx - 12, cy + R * dy - 12, cx + R * dx + 12, cy + R * dy + 12], fill=accent_hi)


def render_plate(entry):
    key_num, roman, title, subtitle, hebrew, letter_name, gematria, element, repo_file, studio_file = entry
    W, H = 1920, 2880  # 2x supersampled canvas
    base_bg, accent, accent_hi = ELEMENT_PALETTES[element]
    img = Image.new("RGB", (W, H), base_bg)
    draw = ImageDraw.Draw(img)

    # Radial atmospheric glow behind sacred geometry
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    cx, cy = W // 2, int(H * 0.48)
    for step in range(28, 0, -1):
        rad = int(step * 34)
        alpha = int(10 * (1 - step / 30))
        gdraw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(accent[0], accent[1], accent[2], alpha))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Luxury double hairline border with corner rosettes
    draw.rounded_rectangle([44, 44, W - 44, H - 44], radius=56, outline=GOLD_MID, width=6)
    draw.rounded_rectangle([72, 72, W - 72, H - 72], radius=40, outline=GOLD_DIM, width=3)
    for rx, ry in ((112, 112), (W - 112, 112), (112, H - 112), (W - 112, H - 112)):
        _draw_rosette(draw, rx, ry, 28)

    # Top cartouche (strictly inside safe margins x=[160..W-160])
    draw.rounded_rectangle([168, 128, W - 168, 286], radius=28, fill=(14, 14, 22), outline=GOLD_MID, width=4)
    f_roman = ImageFont.truetype(FONT_SERIF_BOLD, 74)
    f_hebrew = ImageFont.truetype(FONT_HEBREW_BOLD, 62)
    f_elem = ImageFont.truetype(FONT_MONO_BOLD, 40)

    # Left: Roman numeral
    draw.text((228, 162), roman, fill=GOLD_LIGHT, font=f_roman)
    # Center: Hebrew glyph + Gematria
    heb_label = f"{hebrew} · {gematria}"
    hbb = draw.textbbox((0, 0), heb_label, font=f_hebrew)
    draw.text(((W - (hbb[2] - hbb[0])) / 2, 168), heb_label, fill=IVORY, font=f_hebrew)
    # Right: Elemental pill
    ebb = draw.textbbox((0, 0), element.upper(), font=f_elem)
    ew = ebb[2] - ebb[0]
    px2 = W - 216
    px1 = px2 - ew - 48
    draw.rounded_rectangle([px1, 166, px2, 248], radius=24, fill=(22, 26, 38), outline=accent_hi, width=3)
    draw.text((px1 + 24, 182), element.upper(), fill=accent_hi, font=f_elem)

    # Inner Hermetic Arch framing the sacred geometry plate
    draw.rounded_rectangle([168, 336, W - 168, 2240], radius=72, outline=GOLD_DIM, width=4)
    draw.arc([230, 380, W - 230, 1220], 180, 360, fill=GOLD_MID, width=4)

    # Unique 22-key sacred geometry artwork
    _draw_sacred_emblem(draw, key_num, W // 2, 1290, 560, accent, accent_hi)

    # Bottom engraved title plaque (strictly measured so zero text ever touches borders)
    draw.rounded_rectangle([168, 2304, W - 168, 2690], radius=34, fill=(14, 14, 22), outline=GOLD_MID, width=4)
    draw.line([280, 2348, W - 280, 2348], fill=GOLD_DIM, width=3)

    f_title = _fit_text(draw, title, FONT_SERIF_BOLD, 92, W - 460)
    tbb = draw.textbbox((0, 0), title, font=f_title)
    draw.text(((W - (tbb[2] - tbb[0])) / 2, 2390), title, fill=GOLD_LIGHT, font=f_title)

    sub_str = f"{subtitle.upper()}  •  KEY {key_num} ({letter_name.upper()})"
    f_sub = _fit_text(draw, sub_str, FONT_MONO_BOLD, 38, W - 460)
    sbb = draw.textbbox((0, 0), sub_str, font=f_sub)
    draw.text(((W - (sbb[2] - sbb[0])) / 2, 2536), sub_str, fill=MUTED, font=f_sub)
    draw.line([280, 2636, W - 280, 2636], fill=GOLD_DIM, width=3)

    # Downsample 2x with LANCZOS for razor-sharp anti-aliased plates
    hi = img.resize((960, 1440), Image.Resampling.LANCZOS)
    web = img.resize((560, 840), Image.Resampling.LANCZOS)

    os.makedirs(STUDIO_CARDS, exist_ok=True)
    os.makedirs(REPO_TAROT, exist_ok=True)
    hi.save(os.path.join(STUDIO_CARDS, studio_file), "JPEG", quality=92, optimize=True)
    web.save(os.path.join(REPO_TAROT, repo_file), "JPEG", quality=90, optimize=True)
    return web


def render_og_banner(plates):
    W, H = 1200, 630
    bg = Image.new("RGB", (W, H), (10, 10, 16))
    draw = ImageDraw.Draw(bg)
    for x in range(0, W, 60):
        draw.line([(x, 0), (x, H)], fill=(24, 22, 34), width=1)
    for y in range(0, H, 60):
        draw.line([(0, y), (W, y)], fill=(24, 22, 34), width=1)

    draw.rounded_rectangle([22, 22, W - 22, H - 22], radius=24, outline=GOLD_MID, width=2)
    draw.rounded_rectangle([32, 32, W - 32, H - 32], radius=18, outline=GOLD_DIM, width=1)

    # Showcase 3 newly minted museum plates (Fool, Chariot, World)
    for idx, (cx, cy, cw) in ((0, (704, 122, 168)), (7, (842, 86, 182)), (21, (992, 130, 166))):
        cim = plates[idx]
        ch = int(round(cim.height * (cw / cim.width)))
        resized = cim.resize((cw, ch), Image.Resampling.LANCZOS)
        draw.rounded_rectangle([cx - 3, cy - 3, cx + cw + 3, cy + ch + 3], radius=12, outline=GOLD_LIGHT, width=2)
        bg.paste(resized, (cx, cy))

    f_kicker = ImageFont.truetype(FONT_MONO_BOLD, 18)
    f_title = ImageFont.truetype(FONT_SERIF_BOLD, 56)
    f_sub = ImageFont.truetype(FONT_SERIF_REG, 25)
    f_body = ImageFont.truetype(FONT_HEBREW_BOLD, 17)
    f_badge = ImageFont.truetype(FONT_MONO_BOLD, 15)

    draw.text((66, 92), "ZOTHOS // 22-KEY HERMETIC AI WORKBENCH", fill=GOLD_MID, font=f_kicker)
    draw.text((66, 144), "Adytum Planner", fill=IVORY, font=f_title)
    draw.text((66, 218), "Illuminated Arcana Deck & Multi-Provider AI Hub", fill=GOLD_LIGHT, font=f_sub)
    draw.text(
        (66, 278),
        "22 Vector Sacred-Geometry Plates • Offline AI-Chemistry\nAGY Bridge • Hermes • Grok • Ollama • Cloud APIs\n15-Rule Negation-Aware Spec Gatekeeper (:8135)",
        fill=(196, 204, 218),
        font=f_body,
        spacing=8,
    )

    bx = 66
    for b in ("100% OPEN-ACCESS", "LOCAL AGENTS + CLOUD", "v2.4.0"):
        bb = draw.textbbox((0, 0), b, font=f_badge)
        bw = (bb[2] - bb[0]) + 22
        draw.rounded_rectangle([bx, 412, bx + bw, 446], radius=16, fill=(24, 20, 16), outline=GOLD_MID, width=1)
        draw.text((bx + 11, 420), b, fill=GOLD_LIGHT, font=f_badge)
        bx += bw + 10

    draw.text((66, 540), "Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform", fill=MUTED, font=f_badge)
    out_path = os.path.join(REPO_PUBLIC, "og-banner.jpg")
    bg.save(out_path, "JPEG", quality=92, optimize=True)
    print(f"Generated og-banner.jpg: {W}x{H} ({os.path.getsize(out_path)} bytes)")


def main():
    plates = {}
    for entry in KEYS:
        plates[entry[0]] = render_plate(entry)
    render_og_banner(plates)
    print(f"Generated {len(plates)} museum plates -> {REPO_TAROT} and {STUDIO_CARDS}")


if __name__ == "__main__":
    main()
