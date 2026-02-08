#!/usr/bin/env python3
"""
BeSmile AI Logo Asset Generator
Generates all logo assets for iOS, Android, and web with:
- BS letters in bold white
- Smooth vertical gradient: purple → pink → red → orange → yellow
- Subtle diagonal lens flare/glint at top-right edge of "S" (NOT a star)
- Splash screen with "BeSmile AI" text on white background
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import math

def create_gradient_background(size):
    """Create a smooth DIAGONAL gradient from purple (top-left) to yellow (bottom-right)"""
    img = Image.new('RGB', (size, size))
    pixels = img.load()
    
    # Define gradient colors (matching reference image exactly)
    # Purple (top-left) → Pink → Red/Orange → Yellow (bottom-right)
    gradient_colors = [
        (147, 51, 234),     # Purple
        (219, 39, 119),     # Pink/Magenta
        (239, 68, 68),      # Red
        (249, 115, 22),     # Orange
        (250, 204, 21),     # Yellow
    ]
    
    # Create DIAGONAL gradient (top-left to bottom-right)
    for y in range(size):
        for x in range(size):
            # Calculate diagonal progress (0.0 at top-left, 1.0 at bottom-right)
            progress = (x + y) / (2 * (size - 1)) if size > 1 else 0
            
            # Find which two colors we're between
            color_index = progress * (len(gradient_colors) - 1)
            color1_idx = int(color_index)
            color2_idx = min(color1_idx + 1, len(gradient_colors) - 1)
            
            # Interpolate between the two colors
            local_progress = color_index - color1_idx
            color1 = gradient_colors[color1_idx]
            color2 = gradient_colors[color2_idx]
            
            r = int(color1[0] * (1 - local_progress) + color2[0] * local_progress)
            g = int(color1[1] * (1 - local_progress) + color2[1] * local_progress)
            b = int(color1[2] * (1 - local_progress) + color2[2] * local_progress)
            
            pixels[x, y] = (r, g, b)
    
    return img


def create_bs_logo(size):
    """
    Create BS logo with:
    - Smooth gradient background
    - Bold white "BS" text centered
    - Diagonal lens flare/glint at top-right edge of "S" (NOT a star)
    """
    # Create image with gradient background
    img = create_gradient_background(size)
    
    # Convert to RGBA for transparency support
    img = img.convert('RGBA')
    draw = ImageDraw.Draw(img)
    
    # Calculate font size based on image size
    font_size = int(size * 0.55)
    
    # Load bold font
    try:
        font = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
    
    # Draw "BS" text centered
    text = "BS"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - int(size * 0.05)
    
    # Draw white text with subtle shadow for depth
    shadow_offset = max(2, int(size * 0.003))
    draw.text((x + shadow_offset, y + shadow_offset), text, fill=(100, 100, 100, 60), font=font)
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    # ========================================
    # DIAGONAL SHINE / GLINT EFFECT
    # Position: Exactly at top-right corner of letter "S"
    # Shape: DIAGONAL shine only (NO star, NO plus, NO circle)
    # Like light reflecting off glass at an angle
    # ========================================
    
    # Position: top-right corner of the "S" letter
    sparkle_x = int(size * 0.685)  # Right edge of S curve
    sparkle_y = int(size * 0.26)   # Top of S
    
    # Diagonal shine parameters
    main_length = max(15, int(size * 0.045))   # Main diagonal ray
    short_length = max(8, int(size * 0.025))   # Short perpendicular ray
    line_width = max(1, int(size * 0.005))     # Thin line
    
    # ONLY diagonal rays (creates diagonal shine effect)
    # Main diagonal: going from top-right to bottom-left direction
    draw.line(
        [(sparkle_x + main_length, sparkle_y - main_length),
         (sparkle_x - main_length, sparkle_y + main_length)],
        fill=(255, 255, 255, 255),
        width=line_width
    )
    
    # Secondary short diagonal: perpendicular to main (top-left to bottom-right)
    draw.line(
        [(sparkle_x - short_length, sparkle_y - short_length),
         (sparkle_x + short_length, sparkle_y + short_length)],
        fill=(255, 255, 255, 220),
        width=max(1, line_width - 1)
    )
    
    # Tiny bright center point
    center_size = max(1, int(size * 0.004))
    draw.ellipse(
        [(sparkle_x - center_size, sparkle_y - center_size),
         (sparkle_x + center_size, sparkle_y + center_size)],
        fill=(255, 255, 255, 255)
    )
    
    return img


def create_splash_screen(width=1024, height=1024):
    """
    Create splash screen with:
    - White background
    - BS logo centered
    - "BeSmile AI" text below the logo
    """
    # White background
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Create the BS logo (scaled for splash screen)
    logo_size = 400
    bs_logo = create_bs_logo(logo_size)
    
    # Paste logo centered on splash screen
    logo_x = (width - logo_size) // 2
    logo_y = int((height - logo_size) * 0.35)
    img.paste(bs_logo, (logo_x, logo_y), bs_logo)
    
    # Add "BeSmile AI" text below the logo
    try:
        text_font = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", int(height * 0.07))
    except:
        try:
            text_font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", int(height * 0.07))
        except:
            text_font = ImageFont.load_default()
    
    text = "BeSmile AI"
    bbox = draw.textbbox((0, 0), text, font=text_font)
    text_width = bbox[2] - bbox[0]
    text_x = (width - text_width) // 2
    text_y = logo_y + logo_size + int(height * 0.05)
    
    # Draw text in black
    draw.text((text_x, text_y), text, fill=(0, 0, 0), font=text_font)
    
    return img


def main():
    """Generate all required logo asset sizes"""
    # Get the project root directory (parent of scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    assets_dir = os.path.join(project_root, "assets")
    
    # Create assets directory if it doesn't exist
    os.makedirs(assets_dir, exist_ok=True)
    
    print("=" * 50)
    print("BeSmile AI Logo Asset Generator")
    print("=" * 50)
    print("\nGenerating logo assets with:")
    print("  ✓ Gradient: Purple → Pink → Red → Orange → Yellow")
    print("  ✓ Sparkle: Diagonal lens flare at top-right of 'S'")
    print("  ✓ Text: Bold white 'BS' centered")
    print("")
    
    # 1. App Icon (1024x1024)
    print("  [1/6] Creating icon.png (1024x1024)...")
    icon = create_bs_logo(1024)
    icon.save(os.path.join(assets_dir, "icon.png"), "PNG", quality=95)
    print("        ✓ Saved to assets/icon.png")
    
    # 2. Splash Screen (1024x1024)
    print("  [2/6] Creating splash-icon.png (1024x1024)...")
    splash = create_splash_screen(1024, 1024)
    splash.save(os.path.join(assets_dir, "splash-icon.png"), "PNG", quality=95)
    print("        ✓ Saved to assets/splash-icon.png")
    
    # 3. Android Foreground (1024x1024)
    print("  [3/6] Creating android-icon-foreground.png (1024x1024)...")
    android_fg = create_bs_logo(1024)
    android_fg.save(os.path.join(assets_dir, "android-icon-foreground.png"), "PNG", quality=95)
    print("        ✓ Saved to assets/android-icon-foreground.png")
    
    # 4. Android Background (1024x1024) - Light blue solid
    print("  [4/6] Creating android-icon-background.png (1024x1024)...")
    android_bg = Image.new('RGB', (1024, 1024), (230, 244, 254))
    android_bg.save(os.path.join(assets_dir, "android-icon-background.png"), "PNG", quality=95)
    print("        ✓ Saved to assets/android-icon-background.png")
    
    # 5. Android Monochrome (1024x1024) - Grayscale for themed icons
    print("  [5/6] Creating android-icon-monochrome.png (1024x1024)...")
    mono = create_bs_logo(1024)
    mono = mono.convert('L').convert('RGBA')
    mono.save(os.path.join(assets_dir, "android-icon-monochrome.png"), "PNG", quality=95)
    print("        ✓ Saved to assets/android-icon-monochrome.png")
    
    # 6. Web Favicon (192x192)
    print("  [6/6] Creating favicon.png (192x192)...")
    favicon = create_bs_logo(192)
    favicon.save(os.path.join(assets_dir, "favicon.png"), "PNG", quality=95)
    print("        ✓ Saved to assets/favicon.png")
    
    print("\n" + "=" * 50)
    print("✅ ALL LOGO ASSETS GENERATED SUCCESSFULLY!")
    print("=" * 50)
    print(f"\nOutput directory: {assets_dir}")
    print("\nFiles created:")
    print("  • icon.png              - App icon")
    print("  • splash-icon.png       - Splash screen")
    print("  • android-icon-foreground.png")
    print("  • android-icon-background.png")
    print("  • android-icon-monochrome.png")
    print("  • favicon.png           - Web favicon")
    print("")


if __name__ == "__main__":
    main()
