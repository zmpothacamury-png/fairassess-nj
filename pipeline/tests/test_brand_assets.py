"""Tests for pipeline/brand_assets.py, using small made-up images."""

import numpy as np
from PIL import Image

from pipeline.brand_assets import MIST, PALETTE, clean_alpha, fit_square, icon_box

NAVY = PALETTE[0]
GOLD = PALETTE[8]


def make_canvas(size=200):
    """Return a size x size RGB float array filled with the logo's mist background."""
    return np.tile(np.array(MIST, float), (size, size, 1))


def test_background_becomes_transparent():
    rgba, _ = clean_alpha(make_canvas())
    assert rgba[..., 3].max() == 0


def test_solid_logo_color_stays_solid_and_exact():
    rgb = make_canvas()
    rgb[80:120, 80:120] = GOLD
    rgba, _ = clean_alpha(rgb)
    assert rgba[100, 100, 3] == 1.0
    assert np.allclose(rgba[100, 100, :3], GOLD)


def test_half_blended_edge_becomes_half_transparent_logo_color():
    rgb = make_canvas()
    rgb[80:120, 80:120] = 0.5 * NAVY + 0.5 * np.array(MIST)
    rgba, _ = clean_alpha(rgb)
    alpha = rgba[100, 100, 3]
    assert 0.45 < alpha < 0.55
    # The color is the pure logo navy, not a pale mix (that pale mix is the "halo").
    assert np.allclose(rgba[100, 100, :3], NAVY)


def test_icon_box_cuts_in_the_middle_of_the_gap():
    alpha = np.zeros((100, 50))
    alpha[10:40, 5:45] = 1.0   # artwork
    alpha[60:70, 0:50] = 1.0   # wordmark below a 20-row gap
    top, bottom, left, right = icon_box(alpha)
    assert (top, bottom, left, right) == (10, 40, 5, 45)


def test_fit_square_is_square_and_centered():
    tall = Image.new("RGBA", (40, 80), (16, 69, 107, 255))
    out = fit_square(tall, 64, 0.0)
    assert out.size == (64, 64)
    assert out.getpixel((0, 32))[3] == 0      # left padding is transparent
    assert out.getpixel((32, 32))[3] == 255   # center is the logo
