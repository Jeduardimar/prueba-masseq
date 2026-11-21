"""Genera versiones con fondo transparente del logo de MASSEQ para la web.

Entrada:  ../assets/brand/logo-masseq-teq.png (fondo blanco)
Salidas:  public/brand/logo-masseq-teq.png       transparente (para fondos claros)
          public/brand/logo-masseq-teq-dark.png  transparente, con el texto gris
                                                 aclarado (para el encabezado negro)

Usa una variante de "color a alfa" sobre el blanco que conserva el suavizado
de los bordes sin aclarar los colores de marca, y recorta el espacio vacío alrededor del logo.

Uso (desde web/):  python scripts/make-brand-logo.py      (requiere Pillow)
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets" / "brand" / "logo-masseq-teq.png"
OUT = ROOT / "web" / "public" / "brand"
LIGHT_GREY = (232, 232, 232)
EDGE_GAIN = 3  # diferencia con el blanco a partir de la cual el píxel es opaco


def white_to_alpha(img):
    """Quita el fondo blanco conservando el antialias."""
    out = Image.new("RGBA", img.size)
    src, dst = img.load(), out.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b = src[x, y][:3]
            # Los colores de marca quedan opacos; solo el blanco y los bordes
            # suavizados (casi blancos) se vuelven transparentes.
            a = min(1.0, max(255 - r, 255 - g, 255 - b) / 255 * EDGE_GAIN)
            if a == 0:
                dst[x, y] = (0, 0, 0, 0)
                continue
            # Color original sin la mezcla con el blanco.
            unmix = lambda c: round(255 - (255 - c) / a)
            dst[x, y] = (unmix(r), unmix(g), unmix(b), round(a * 255))
    return out


def lighten_neutrals(img):
    """Pasa los píxeles grises (sin saturación) a gris claro para fondo oscuro."""
    out = img.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a and max(r, g, b) - min(r, g, b) < 24:
                px[x, y] = (*LIGHT_GREY, a)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    logo = white_to_alpha(Image.open(SRC).convert("RGB"))
    logo = logo.crop(logo.getbbox())
    logo.save(OUT / "logo-masseq-teq.png", optimize=True)
    lighten_neutrals(logo).save(OUT / "logo-masseq-teq-dark.png", optimize=True)
    print(f"Logos generados en {OUT} ({logo.width}x{logo.height})")


if __name__ == "__main__":
    main()
