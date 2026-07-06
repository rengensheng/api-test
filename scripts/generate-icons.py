#!/usr/bin/env python3
"""Generate FLAW Industrial Dark style Tauri app icons."""

from __future__ import annotations

import io
import os
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont

# FLAW palette
BG = "#161618"
ACCENT = "#f0a500"

OUTPUT_DIR = Path(__file__).parent.parent / "src-tauri" / "icons"
SOURCE_SIZE = 1024


def create_source_image(size: int = SOURCE_SIZE) -> Image.Image:
    """Create the 1024x1024 source icon."""
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)
    padding = int(size * 0.12)
    border_width = max(3, int(size * 0.025))
    radius = int(size * 0.02)

    # Outer square border

    draw.rounded_rectangle(
        [padding, padding, size - padding, size - padding],
        radius=radius,
        outline=ACCENT,
        width=border_width,
    )

    # Draw a bold ">" prompt symbol in the center
    center_x = size // 2
    center_y = size // 2
    symbol_size = int(size * 0.38)
    stroke = max(5, int(size * 0.05))

    # Points for a right-facing chevron / greater-than symbol

    # Left vertical line of the chevron
    x_left = center_x - symbol_size // 3
    y_top = center_y - symbol_size // 2
    y_bottom = center_y + symbol_size // 2

    draw.line(
        [(x_left, y_top), (center_x + symbol_size // 3, center_y)],
        fill=ACCENT,
        width=stroke,
        joint="curve",
    )
    draw.line(
        [(center_x + symbol_size // 3, center_y), (x_left, y_bottom)],
        fill=ACCENT,
        width=stroke,
        joint="curve",
    )

    # Underscore / command line prompt tail
    underscore_y = center_y + symbol_size // 2 + int(size * 0.04)
    underscore_left = center_x - symbol_size // 3
    underscore_right = center_x + symbol_size // 3
    draw.line(
        [(underscore_left, underscore_y), (underscore_right, underscore_y)],
        fill=ACCENT,
        width=stroke,
    )

    return img


def resize_exact(image: Image.Image, size: int) -> Image.Image:
    """Resize to exact square dimensions."""
    return image.resize((size, size), Image.Resampling.LANCZOS)


def save_png(image: Image.Image, path: Path) -> None:
    """Save PNG with optimized palette."""
    image.save(path, "PNG", optimize=True)
def save_ico(image: Image.Image, path: Path) -> None:
    """Save multi-size Windows ICO from a 256x256 source."""
    source = resize_exact(image, 256)
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    source.save(path, format="ICO", sizes=sizes)


def save_icns(image: Image.Image, path: Path) -> None:
    """Save macOS ICNS from a 1024x1024 source."""
    sizes = [(16, 16), (32, 32), (64, 64), (128, 128), (256, 256), (512, 512), (1024, 1024)]
    image.save(path, format="ICNS", sizes=sizes)



def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    source = create_source_image(SOURCE_SIZE)

    png_sizes: dict[str, int] = {
        "icon.png": SOURCE_SIZE,
        "128x128@2x.png": 256,
        "128x128.png": 128,
        "32x32.png": 32,
        "Square310x310Logo.png": 310,
        "Square284x284Logo.png": 284,
        "Square150x150Logo.png": 150,
        "Square142x142Logo.png": 142,
        "Square107x107Logo.png": 107,
        "Square89x89Logo.png": 89,
        "Square71x71Logo.png": 71,
        "Square44x44Logo.png": 44,
        "Square30x30Logo.png": 30,
        "StoreLogo.png": 50,
    }

    for filename, size in png_sizes.items():
        resized = resize_exact(source, size)
        save_png(resized, OUTPUT_DIR / filename)
        print(f"Generated {filename} ({size}x{size})")

    save_ico(source, OUTPUT_DIR / "icon.ico")
    print("Generated icon.ico")

    save_icns(source, OUTPUT_DIR / "icon.icns")
    print("Generated icon.icns")

    print("\nAll icons generated in:", OUTPUT_DIR)


if __name__ == "__main__":
    main()