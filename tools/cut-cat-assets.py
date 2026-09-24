"""Reproduce the cat-edition cutouts from the supplied image/ illustrations.

Requires Pillow, NumPy and SciPy. Remove paper outside closed outlines,
preserving the cream-colored fur and bone inside the hand-drawn outlines.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'cats'
OUT.mkdir(parents=True, exist_ok=True)

def cut(source, box, name):
    im = Image.open(ROOT / 'image' / source).convert('RGBA').crop(box)
    # Close tiny watercolor gaps before flooding, then fill enclosed pale fur.
    rgb = np.asarray(im)[:, :, :3].astype(int)
    threshold = {"tunnel": 195, "cushion": 180}.get(name, 160)
    ink = (rgb.min(axis=2) < threshold) | ((rgb.max(axis=2)-rgb.min(axis=2)) > 52)
    ink = ndimage.binary_closing(ink, iterations={"tunnel": 7, "cushion": 16}.get(name, 4))
    ink = ndimage.binary_fill_holes(ink)
    if name == 'cushion':
        # The pale pillow has a broken watercolor outline. Fill its traced
        # interior while retaining the supplied pixels and surrounding ink.
        outline = [(431,567),(475,527),(538,485),(586,445),(630,414),
                   (647,373),(674,323),(688,313),(704,314),(737,339),
                   (821,355),(905,385),(982,425),(1067,454),(1102,453),
                   (1120,459),(1123,472),(1080,520),(1050,541),(1043,568),
                   (1023,598),(983,633),(974,660),(961,688),(955,730),
                   (945,734),(920,719),(893,706),(831,696),(773,675),
                   (705,668),(647,640),(583,607),(524,586),(499,586),
                   (474,591),(451,585),(435,578)]
        interior = Image.new('L', im.size)
        ImageDraw.Draw(interior).polygon([(x-box[0], y-box[1]) for x,y in outline], fill=255)
        ink |= np.asarray(interior) > 0
    labels, count = ndimage.label(ink)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    # Keep the animal and its detached whiskers / tail movement marks.
    ink = np.isin(labels, np.flatnonzero(sizes > max(18, sizes.max() * .015)))
    mask = Image.fromarray((ink * 255).astype('uint8'))
    im.putalpha(mask)
    im = im.crop(im.getbbox())
    # Standalone images (home/how-to) retain original detail, without upscaling.
    # Keep the same relative padding as the compact board atlas.
    side = round(max(im.size) * 272 / 256)
    original = Image.new('RGBA', (side, side))
    original.alpha_composite(im, ((side-im.width)//2, (side-im.height)//2))
    original.save(OUT / f'{name}.png')
    im.thumbnail((256, 256), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', (272, 272))
    tile.alpha_composite(im, ((272-im.width)//2, (272-im.height)//2))
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
    ('start.png',(410,290,1150,755),'cushion'),
]:
    tiles.append(cut(source, box, name))
atlas = Image.new('RGBA', (272*5,272*4))
for i, tile in enumerate(tiles):
    atlas.alpha_composite(tile, ((i%5)*272,(i//5)*272))
atlas.save(OUT / 'sprites.png')
print(f'Wrote {len(tiles)} cutouts and sprite atlas to {OUT}')
