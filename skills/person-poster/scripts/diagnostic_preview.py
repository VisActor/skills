"""Create a visibly labeled diagnostic report outside an unchanged poster screenshot."""
import hashlib
import json
import math
from pathlib import Path

REPORT_NAME = 'draft/诊断草稿-未完成.png'


def create_diagnostic_preview(root: Path, raw_png: Path) -> dict:
    from PIL import Image, ImageDraw, ImageFont
    root, raw_png = root.resolve(), raw_png.resolve()
    if not raw_png.is_relative_to(root / 'draft') or not raw_png.is_file():
        raise ValueError('Diagnostic raw PNG must be inside bundle draft/')
    output, metadata = root / REPORT_NAME, root / 'draft/diagnostic-preview.json'
    if any(p.is_symlink() or not p.resolve().is_relative_to(root) for p in (output, metadata)) or output.resolve() == raw_png:
        raise ValueError('Diagnostic report cannot overwrite original/outside files')
    raw_bytes = raw_png.read_bytes()
    with Image.open(raw_png) as image:
        original = image.convert('RGB')
    width, height = original.size
    font = ImageFont.load_default()
    def text_image(text, reading_size):
        box = font.getbbox(text)
        tile = Image.new('RGB', (box[2]-box[0]+2, box[3]-box[1]+2), 'white')
        ImageDraw.Draw(tile).text((1-box[0],1-box[1]), text, fill='#991b1b', font=font)
        scale = max(1, math.ceil(reading_size * max(width, 600) / 600 / max(1, box[3]-box[1])))
        return tile.resize((tile.width*scale,tile.height*scale), Image.Resampling.NEAREST)
    title = text_image('DRAFT / NOT DELIVERED', 24)
    subtitle = text_image('QUALITY CHECK FAILED', 14)
    margin = max(8, math.ceil(width * .015))
    if max(title.width, subtitle.width) + margin*2 > width:
        raise ValueError('Canvas too narrow for a readable diagnostic banner; provide text diagnostics only')
    banner_height = title.height + subtitle.height + margin*3
    report = Image.new('RGB', (width,height+banner_height), 'white')
    report.paste(title,(margin,margin))
    report.paste(subtitle,(margin,margin*2+title.height))
    report.paste(original,(0,banner_height))
    report.save(output)
    record = {'file': REPORT_NAME, 'raw': str(raw_png.relative_to(root)),
              'rawSha256': hashlib.sha256(raw_bytes).hexdigest(),
              'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'bannerHeight': banner_height,
              'originalPixels': [width,height], 'reportPixels': [width,height+banner_height],
              'label': '诊断报告图（未完成；外框不属于原海报）'}
    metadata.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return record


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(create_diagnostic_preview(args.bundle, args.bundle / 'draft/preview.png'), ensure_ascii=False))
    except (OSError, ValueError) as error:
        parser.exit(1, f'Diagnostic report failed: {error}\n')
