"""Genera el ícono de la app (1024x1024) a partir de la insignia de MASSEQ.

Entrada: assets/brand/logo-masseq-insignia.png
Salidas (en mobile/assets/icon/):
  - icon.png             fondo azul #0057A8 con la insignia centrada
  - icon_foreground.png  solo la insignia, transparente, para el ícono adaptativo
                         (Android recorta ~1/3 del borde, por eso va más pequeña)

Uso (desde mobile/):  python tool/generate_icon.py && dart run flutter_launcher_icons
Requiere Pillow:      pip install pillow
"""

from pathlib import Path

from PIL import Image

SIZE = 1024
BLUE = (0x00, 0x57, 0xA8, 255)
ROOT = Path(__file__).resolve().parent.parent
INSIGNIA = ROOT / "assets" / "brand" / "logo-masseq-insignia.png"


def render(background, width_ratio):
    canvas = Image.new("RGBA", (SIZE, SIZE), background)
    logo = Image.open(INSIGNIA).convert("RGBA")
    logo = logo.crop(logo.getbbox())
    width = round(SIZE * width_ratio)
    height = round(logo.height * width / logo.width)
    logo = logo.resize((width, height), Image.LANCZOS)
    canvas.alpha_composite(logo, ((SIZE - width) // 2, (SIZE - height) // 2))
    return canvas


def main():
    out = ROOT / "assets" / "icon"
    out.mkdir(parents=True, exist_ok=True)
    render(BLUE, 0.82).save(out / "icon.png")
    render((0, 0, 0, 0), 0.58).save(out / "icon_foreground.png")
    print(f"Íconos generados en {out}")


if __name__ == "__main__":
    main()
