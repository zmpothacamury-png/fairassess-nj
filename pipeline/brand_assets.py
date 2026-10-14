"""Build the FairAssess NJ logo files for the website from brand/Logo.jpg.

Run from the repo root:
    python -m pipeline.brand_assets              # preview into data/interim/brand_assets/
    python -m pipeline.brand_assets --install    # also copy into site/app and site/public

Why Logo.jpg and not brand/logo-full.png: the NJ outline in Logo.jpg is solid.
logo-full.png was made from it earlier and its outline was left part-transparent,
so it looks speckled on dark colors.

How the transparency works (see docs/design-system.md, section 7):
1. Estimate the background separately at every pixel. Logo.jpg has a soft
   vignette: near-white in the middle, mist at the edges.
2. "Palette color-to-alpha": match each pixel to the nearest logo color F on the
   line from its local background B to F. On that line, the pixel becomes color F
   with alpha = how far along the line it is. That gives clean anti-aliased edges
   with no pale halo. Pixels off every line (like the blue/green seam) stay solid.
"""

import argparse
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "brand" / "Logo.jpg"
PREVIEW_DIR = ROOT / "data" / "interim" / "brand_assets"

MIST = (245, 247, 250)  # logo background, sampled from Logo.jpg
# Logo colors sampled with Pillow (navy shades, blues, sky, green, gold, outline).
PALETTE = np.array(
    [[16, 69, 107], [14, 68, 105], [21, 82, 127], [32, 96, 140], [30, 94, 137],
     [36, 100, 144], [81, 149, 184], [88, 145, 94], [225, 188, 85], [195, 209, 222]],
    float,
)
OUTLINE = 9  # index of the NJ outline gray in PALETTE
ARTWORK_BOX = (700, 230, 2120, 1290)  # left, top, right, bottom of the logo inside Logo.jpg

# Where each finished file goes in the site (Next.js finds the app/ files by name).
INSTALL = {
    "logo-icon.png": "site/public/logo-icon.png",
    "logo-icon-light.png": "site/public/logo-icon-light.png",
    "nj-outline.png": "site/public/nj-outline.png",
    "icon.png": "site/app/icon.png",
    "apple-icon.png": "site/app/apple-icon.png",
    "favicon.ico": "site/app/favicon.ico",
    "opengraph-image.png": "site/app/opengraph-image.png",
}


def local_background(rgb):
    """Return the background color at every pixel by blurring only the background pixels."""
    is_bg = (rgb.min(-1) > 236) & ((rgb.max(-1) - rgb.min(-1)) < 10)
    weight = Image.fromarray((is_bg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(40))
    weight = np.array(weight).astype(float)[..., None] / 255 + 1e-6
    channels = []
    for c in range(3):
        ch = Image.fromarray((rgb[..., c] * is_bg).astype(np.uint8)).filter(ImageFilter.GaussianBlur(40))
        channels.append(np.array(ch).astype(float))
    return np.stack(channels, -1) / weight


def clean_alpha(rgb):
    """Turn an RGB array on a light background into RGBA with palette-true, halo-free edges.

    Returns (rgba, best) where rgba is floats (alpha 0-1) and best is the index of
    the nearest palette color for each pixel.
    """
    bg = local_background(rgb)
    direction = PALETTE[None, None] - bg[..., None, :]          # (H, W, P, 3)
    offset = (rgb - bg)[..., None, :]
    t = np.clip((offset * direction).sum(-1) / (direction * direction).sum(-1), 0, 1)
    resid = np.linalg.norm(offset - t[..., None] * direction, axis=-1)
    best = resid.argmin(-1)
    t_best = np.take_along_axis(t, best[..., None], -1)[..., 0]
    r_best = np.take_along_axis(resid, best[..., None], -1)[..., 0]
    on_line = r_best < 16

    rgba = np.zeros(rgb.shape[:2] + (4,))
    rgba[..., :3] = np.where(on_line[..., None], PALETTE[best], rgb)
    alpha = np.where(on_line, t_best, 1.0)
    alpha[np.linalg.norm(rgb - bg, axis=-1) < 6] = 0              # background (JPEG noise floor)
    alpha[alpha > 0.94] = 1.0
    alpha[alpha < 0.04] = 0

    # The pale NJ outline has low contrast with the background, so JPEG noise
    # shows as grain. Smooth its alpha only.
    soft = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.9))
    soft = np.array(soft).astype(float) / 255
    alpha = np.where((best == OUTLINE) & on_line, soft, alpha)
    rgba[..., 3] = alpha
    return rgba, best


def to_image(rgba):
    """Convert a float RGBA array (alpha 0-1) to a Pillow image."""
    arr = rgba.copy()
    arr[..., 3] *= 255
    return Image.fromarray(np.clip(arr.round(), 0, 255).astype(np.uint8), "RGBA")


def fit_square(img, size, pad_fraction, background=None):
    """Center img in a size x size square with padding; transparent unless a background is given."""
    fill = (0, 0, 0, 0) if background is None else background + (255,)
    canvas = Image.new("RGBA", (size, size), fill)
    inner = int(size * (1 - 2 * pad_fraction))
    small = img.copy()
    small.thumbnail((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(small, ((size - small.width) // 2, (size - small.height) // 2))
    return canvas


def icon_box(alpha):
    """Return (top, bottom, left, right) of the icon: everything above the middle of
    the longest empty band of rows (the gap between the artwork and the wordmark)."""
    rows = (alpha > 0.3).sum(1) > 2
    top = int(np.argmax(rows))
    runs, start = [], None
    for y in range(top, len(rows)):
        if not rows[y] and start is None:
            start = y
        if rows[y] and start is not None:
            runs.append((y - start, start))
            start = None
    length, start = max(runs)
    cut = start + length // 2
    ys, xs = np.where(alpha[:cut] > 0.04)
    return ys.min(), ys.max() + 1, xs.min(), xs.max() + 1


def nj_outline(rgb, bg, scale=3):
    """Return the NJ outline alone, enlarged `scale` times with smooth edges, as RGBA.

    Pixels are picked by color: on the line from the background to the outline
    gray and at least halfway along it. Thin pale rims around navy strokes also
    match, but they are 1px wide and vanish in the blur and threshold, while the
    outline stroke survives.
    """
    direction = PALETTE[OUTLINE] - bg
    offset = rgb - bg
    t = np.clip((offset * direction).sum(-1) / (direction * direction).sum(-1), 0, 1.2)
    resid = np.linalg.norm(offset - t[..., None] * direction, axis=-1)
    mask = Image.fromarray(((resid < 14) & (t > 0.45)).astype(np.uint8) * 255, "L")
    mask = mask.crop(mask.getbbox()).filter(ImageFilter.GaussianBlur(1.6))
    big = mask.resize((mask.width * scale, mask.height * scale), Image.BICUBIC)
    alpha = np.clip((np.array(big).astype(float) / 255 - 0.28) / 0.16, 0, 1)
    rgba = np.zeros(alpha.shape + (4,))
    rgba[..., :3] = PALETTE[OUTLINE]
    rgba[..., 3] = alpha
    return rgba


def build_assets(source, out_dir):
    """Write every logo file into out_dir and return the list of file names."""
    out_dir.mkdir(parents=True, exist_ok=True)
    img = Image.open(source).convert("RGB").filter(ImageFilter.MedianFilter(3))  # remove JPEG speckle
    rgb = np.array(img.crop(ARTWORK_BOX)).astype(float)
    full, _ = clean_alpha(rgb)

    top, bottom, left, right = icon_box(full[..., 3])
    icon_rgba = full[top:bottom, left:right]
    icon = to_image(icon_rgba)
    icon.save(out_dir / "logo-icon.png", optimize=True)

    light = icon_rgba.copy()
    light[..., :3] = MIST
    to_image(light).save(out_dir / "logo-icon-light.png", optimize=True)

    bg = local_background(rgb)[top:bottom, left:right]
    to_image(nj_outline(rgb[top:bottom, left:right], bg)).save(out_dir / "nj-outline.png", optimize=True)

    fit_square(icon, 512, 0.04).save(out_dir / "icon.png", optimize=True)
    fit_square(icon, 180, 0.10, background=MIST).save(out_dir / "apple-icon.png", optimize=True)
    fit_square(icon, 256, 0.02).save(out_dir / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    logo = to_image(full)
    logo = logo.crop(logo.getbbox())
    logo.thumbnail((1000, 520), Image.LANCZOS)
    og = Image.new("RGBA", (1200, 630), MIST + (255,))
    og.alpha_composite(logo, ((1200 - logo.width) // 2, (630 - logo.height) // 2))
    og.convert("RGB").save(out_dir / "opengraph-image.png", optimize=True)

    return sorted(p.name for p in out_dir.iterdir())


def main():
    """Build into the preview folder; with --install, copy the files into the site."""
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--install", action="store_true", help="copy finished files into site/app and site/public")
    args = parser.parse_args()

    names = build_assets(SOURCE, PREVIEW_DIR)
    print(f"Wrote {len(names)} files to {PREVIEW_DIR}")
    if args.install:
        for name, target in INSTALL.items():
            shutil.copyfile(PREVIEW_DIR / name, ROOT / target)
            print(f"  installed {target}")


if __name__ == "__main__":
    main()
