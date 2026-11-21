"""Genera el ícono de la app (1024x1024) sin descargar imágenes.

Dibuja el logo de MASSEQ (cuadrícula inclinada de bloques blancos y uno
naranja) sobre fondo azul #1E4E9C.

Salidas (en mobile/assets/icon/):
  - icon.png             ícono completo (fondo azul + logo)
  - icon_foreground.png  solo el logo, transparente, para el ícono adaptativo

Uso (desde mobile/):  python tool/generate_icon.py
Requiere Pillow:      pip install pillow
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

SIZE = 1024
SS = 4  # supersampling para bordes suaves
BLUE = (0x1E, 0x4E, 0x9C, 255)
WHITE = (255, 255, 255, 255)
WHITE_SOFT = (255, 255, 255, 165)
ORANGE = (0xF2, 0x8C, 0x28, 255)

# 0 = vacío, 1 = blanco, 2 = blanco suave, 3 = naranja (igual que el widget).
PATTERN = [
    [1, 1, 3],
    [1, 2, 0],
    [2, 0, 0],
]
COLORS = {1: WHITE, 2: WHITE_SOFT, 3: ORANGE}


def transform(x, y, cx, cy, skew=-0.25, angle=-0.12):
    """Sesgo horizontal + rotación alrededor de (cx, cy), como en Flutter."""
    dx, dy = x - cx, y - cy
    dx = dx + skew * dy
    cos, sin = math.cos(angle), math.sin(angle)
    return cx + dx * cos - dy * sin, cy + dx * sin + dy * cos


def draw_logo(img, grid_size):
    s = SIZE * SS
    draw = ImageDraw.Draw(img, "RGBA")
    g = grid_size * SS
    gap = g * 0.06
    cell = (g - gap * 2) / 3
    x0 = (s - g) / 2
    y0 = (s - g) / 2
    cx = cy = s / 2
    for r, row in enumerate(PATTERN):
        for c, v in enumerate(row):
            if not v:
                continue
            left = x0 + c * (cell + gap)
            top = y0 + r * (cell + gap)
            corners = [
                (left, top),
                (left + cell, top),
                (left + cell, top + cell),
                (left, top + cell),
            ]
            draw.polygon([transform(x, y, cx, cy) for x, y in corners], fill=COLORS[v])


def render(background, grid_size):
    s = SIZE * SS
    img = Image.new("RGBA", (s, s), background)
    draw_logo(img, grid_size)
    return img.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    out = Path(__file__).resolve().parent.parent / "assets" / "icon"
    out.mkdir(parents=True, exist_ok=True)
    render(BLUE, 560).save(out / "icon.png")
    # El ícono adaptativo recorta ~1/3 del borde: el logo va más pequeño.
    render((0, 0, 0, 0), 420).save(out / "icon_foreground.png")
    print(f"Íconos generados en {out}")


if __name__ == "__main__":
    main()
