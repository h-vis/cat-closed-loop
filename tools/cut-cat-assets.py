"""Reproduce the cat-edition cutouts from the supplied image/ illustrations.

Requires Pillow, NumPy and SciPy. Remove paper outside closed outlines,
preserving the cream-colored fur and bone inside the hand-drawn outlines.
"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'cats'
OUT.mkdir(parents=True, exist_ok=True)

def cut(source, box, name):
    im = Image.open(ROOT / 'image' / source).convert('RGBA').crop(box)
    # Close tiny watercolor gaps before flooding, then fill enclosed pale fur.
    rgb = np.asarray(im)[:, :, :3].astype(int)
    ink = (rgb.min(axis=2) < (195 if name == "tunnel" else 160)) | ((rgb.max(axis=2)-rgb.min(axis=2)) > 52)
    ink = ndimage.binary_closing(ink, iterations=7 if name == "tunnel" else 4)
    ink = ndimage.binary_fill_holes(ink)
    labels, count = ndimage.label(ink)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    # Keep the animal and its detached whiskers / tail movement marks.
    ink = np.isin(labels, np.flatnonzero(sizes > max(18, sizes.max() * .015)))
    mask = Image.fromarray((ink * 255).astype('uint8'))
    im.putalpha(mask)
    im = im.crop(im.getbbox())
    im.thumbnail((256, 256), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', (272, 272))
    tile.alpha_composite(im, ((272-im.width)//2, (272-im.height)//2))
    tile.save(OUT / f'{name}.png')
    return tile

cats = [(25,170,303,451),(309,247,625,442),(616,173,904,460),
        (919,183,1245,470),(1243,231,1536,454)]
dogs = [(22,555,300,864),(306,590,625,860),(616,661,970,860),
        (949,560,1210,865),(1220,550,1520,865)]
tiles = [cut('catdog.png', box, f'cat-{i}') for i, box in enumerate(cats)]
tiles += [cut('catdog.png', box, f'dog-{i}') for i, box in enumerate(dogs)]
for source, box, name in [
    ('fish.png',(350,630,901,932),'fish'),
    ('bone.png',(590,293,1030,716),'bone'),
    ('box.png',(303,307,760,640),'box-closed'),
    ('box.png',(949,275,1520,643),'box-open'),
    ('bag.png',(458,327,1114,747),'bag'),
    ('tunnel.png',(360,274,1258,785),'tunnel'),
]:
    tiles.append(cut(source, box, name))
atlas = Image.new('RGBA', (272*5,272*4))
for i, tile in enumerate(tiles):
    atlas.alpha_composite(tile, ((i%5)*272,(i//5)*272))
atlas.save(OUT / 'sprites.png')
print(f'Wrote {len(tiles)} cutouts and sprite atlas to {OUT}')
