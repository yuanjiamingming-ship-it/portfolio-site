"""Prepare cropped, responsive previews; keep every full-size artwork intact."""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'public' / 'art'
DESTINATION = ART / 'optimized'
DESTINATION.mkdir(exist_ok=True)


def save_preview(image, name, width, height=None):
    result = image.copy()
    result.thumbnail((width, height or width), Image.Resampling.LANCZOS)
    path = DESTINATION / name
    result.save(path, 'WEBP', quality=86, method=4)
    return path.relative_to(ART).as_posix(), result.width, result.height


works_path = ROOT / 'src' / 'works.json'
works = json.loads(works_path.read_text(encoding='utf-8'))
cropped = 0
for series in works:
    for item in series['images']:
        if item.get('bounds'):
            with Image.open(ART / item['src']) as original:
                image = original.convert('RGBA')
                x, y, width, height = item['bounds']
                sx, sy = image.width / item['width'], image.height / item['height']
                image = image.crop((round(x*sx), round(y*sy), round((x+width)*sx), round((y+height)*sy)))
                item['thumb'], item['previewWidth'], item['previewHeight'] = save_preview(image, item['id']+'-crop.webp', 720)
                item['thumbSmall'], item['thumbSmallWidth'], _ = save_preview(image, item['id']+'-crop-small.webp', 400)
                cropped += 1
        elif item['group'] == '主题视觉':
            with Image.open(ART / item['src']) as original:
                image = original.convert('RGBA')
                item['thumb'], item['previewWidth'], item['previewHeight'] = save_preview(image, item['id']+'-1800.webp', 1800)
                item['thumbSmall'], item['thumbSmallWidth'], _ = save_preview(image, item['id']+'-960.webp', 960)

works_path.write_text(json.dumps(works, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

covers_path = ROOT / 'src' / 'home-covers.json'
covers = json.loads(covers_path.read_text(encoding='utf-8'))
for card in covers:
    size = (1440, 872)
    if card.get('avatars'):
        image = Image.new('RGB', size, '#e9ecf8')
        for index, avatar in enumerate(card['avatars']):
            with Image.open(ART / avatar['src']) as original:
                tile = ImageOps.fit(original.convert('RGB'), (480, 436), Image.Resampling.LANCZOS, centering=(.5,.38))
                image.paste(tile, ((index % 3)*480, (index // 3)*436))
    else:
        with Image.open(ART / card['src']) as original:
            center = {'1-3':.38, '1-4':.46, '1-5':.44}.get(card['id'], .5)
            image = ImageOps.fit(original.convert('RGB'), size, Image.Resampling.LANCZOS, centering=(.5,center))
    card['preview'], card['previewWidth'], card['previewHeight'] = save_preview(image, 'cover-'+card['id']+'-1440.webp', 1440)
    card['previewSmall'], card['previewSmallWidth'], _ = save_preview(image, 'cover-'+card['id']+'-768.webp', 768)

covers_path.write_text(json.dumps(covers, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'Prepared {cropped} cropped gallery previews and {len(covers)} responsive file covers.')
