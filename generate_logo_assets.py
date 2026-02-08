#!/usr/bin/env python3
"""Generate BeSmile BS logo assets for iOS, Android, and web"""

from PIL import Image, ImageDraw
import os

def create_gradient_background(size):
    """Create a smooth vertical gradient from purple to yellow"""
    img = Image.new('RGB', (size, size))
    pixels = img.load()
    
    # Define gradient colors
    gradient_colors = [
        (147, 51, 234),     # Purple at top
        (236, 72, 153),     # Pink
        (239, 68, 68),      # Red
        (249, 115, 22),     # Orange
        (234, 179, 8),      # Yellow at bottom
    ]
    
    # Create smooth gradient
    for y in range(size):
        # Calculate position in gradient (0.0 to 1.0)
        progress = y / (size - 1)
        
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
        
        # Draw horizontal line at this y position
        for x in range(size):
            pixels[x, y] = (r, g, b)
    
    return img

def create_bs_logo(size, with_background=False, bg_color=(230, 244, 254)):
    """Create BS logo with smooth gradient and shine effect"""
    # Create image with gradient background
    img = create_gradient_background(size)
    
    # Convert to RGBA for transparency support
    img = img.convert('RGBA')
    draw = ImageDraw.Draw(img)
    
    # Draw "BS" text in white with bold font
    # Calculate font size based on image size
    font_size = int(size * 0.55)
    
    # Use default font (PIL's default)
    from PIL import ImageFont
    try:
        # Try to use a bold system font
        font = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()
    
    # Draw "BS" text centered
    text = "BS"
    # Get bounding box for text to center it
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - int(size * 0.05)
    
    # Draw white text with slight shadow effect for depth
    shadow_offset = 2
    draw.text((x + shadow_offset, y + shadow_offset), text, fill=(100, 100, 100, 80), font=font)
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    # Add diagonal lens flare/shine effect at top-right corner of S
    # Position at the very top-right edge of the S letter, matching reference image exactly
    sparkle_center_x = int(size * 0.70)  # Right edge of S
    sparkle_center_y = int(size * 0.23)  # Very top of S
    
    # Create a diagonal lens flare effect - smooth, glowing, bright white
    # The flare is oriented diagonally from top-left to bottom-right
    
    # Main diagonal lens flare (bright white)
    # Create a diagonal ellipse/lens flare shape
    flare_width = max(4, int(size * 0.035))   # Horizontal width
    flare_height = max(5, int(size * 0.055))  # Vertical height (larger)
    
    # Draw the main bright lens flare as a rotated ellipse approximation
    # Using a vertical ellipse at an angle
    draw.ellipse(
        [(sparkle_center_x - flare_width, sparkle_center_y - flare_height),
         (sparkle_center_x + flare_width, sparkle_center_y + flare_height)],
        fill=(255, 255, 255, 255)
    )
    
    # Add outer glow layer (softer, larger, semi-transparent)
    glow_width = flare_width + 3
    glow_height = flare_height + 3
    for i in range(3):
        alpha = int(100 - (i * 25))  # Gradient transparency
        glow_outline_color = (255, 255, 255, alpha)
        # Draw multiple circles for glow effect
        offset = i + 1
        draw.ellipse(
            [(sparkle_center_x - glow_width - offset, sparkle_center_y - glow_height - offset),
             (sparkle_center_x + glow_width + offset, sparkle_center_y + glow_height + offset)],
            outline=(255, 255, 255, alpha),
            width=1
        )
    
    # Add a small bright center dot for extra shine intensity
    center_dot_size = max(2, int(size * 0.005))
    draw.ellipse(
        [(sparkle_center_x - center_dot_size, sparkle_center_y - center_dot_size),
         (sparkle_center_x + center_dot_size, sparkle_center_y + center_dot_size)],
        fill=(255, 255, 255, 255)
    )
    
    return img

def create_splash_screen(width=1024, height=1024):
    """Create splash screen with BS logo and 'BeSmile AI' text on white background"""
    # White background
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Create the BS logo (smaller size for splash screen)
    logo_size = 400
    bs_logo = create_bs_logo(logo_size)
    
    # Paste logo centered on splash screen
    logo_x = (width - logo_size) // 2
    logo_y = int((height - logo_size) * 0.35)  # Position in upper-middle area
    img.paste(bs_logo, (logo_x, logo_y), bs_logo)
    
    # Add "BeSmile AI" text below the logo
    from PIL import ImageFont
    try:
        # Try to use bold system font
        text_font = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", int(height * 0.08))
    except:
        try:
            text_font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", int(height * 0.08))
        except:
            text_font = ImageFont.load_default()
    
    text = "BeSmile AI"
    bbox = draw.textbbox((0, 0), text, font=text_font)
    text_width = bbox[2] - bbox[0]
    text_x = (width - text_width) // 2
    text_y = logo_y + logo_size + int(height * 0.06)
    
    # Draw text in bold black
    draw.text((text_x, text_y), text, fill=(0, 0, 0), font=text_font)
    
    return img

def main():
    """Generate all required asset sizes"""
    assets_dir = "assets"
    os.makedirs(assets_dir, exist_ok=True)
    
    print("Generating BeSmile AI logo assets...\n")
    
    # Generate BS logo with gradient background
    print("  Creating icon.png (1024x1024)...")
    icon = create_bs_logo(1024)
    icon.save(os.path.join(assets_dir, "icon.png"), "PNG", quality=95)
    print("    ✓ Saved to assets/icon.png")
    
    # Generate splash screen with logo and text on white background
    print("  Creating splash-icon.png (1024x1024)...")
    splash = create_splash_screen(1024, 1024)
    splash.save(os.path.join(assets_dir, "splash-icon.png"), "PNG", quality=95)
    print("    ✓ Saved to assets/splash-icon.png")
    
    # Android foreground (BS logo with gradient)
    print("  Creating android-icon-foreground.png (1024x1024)...")
    android_fg = create_bs_logo(1024)
    android_fg.save(os.path.join(assets_dir, "android-icon-foreground.png"), "PNG", quality=95)
    print("    ✓ Saved to assets/android-icon-foreground.png")
    
    # Android background (light blue solid)
    print("  Creating android-icon-background.png (1024x1024)...")
    android_bg = Image.new('RGB', (1024, 1024), (230, 244, 254))
    android_bg.save(os.path.join(assets_dir, "android-icon-background.png"), "PNG", quality=95)
    print("    ✓ Saved to assets/android-icon-background.png")
    
    # Android monochrome (white BS on transparent for theme icons)
    print("  Creating android-icon-monochrome.png (1024x1024)...")
    mono = create_bs_logo(1024)
    # Convert to grayscale for monochrome
    mono = mono.convert('L')
    mono = mono.convert('RGBA')
    mono.save(os.path.join(assets_dir, "android-icon-monochrome.png"), "PNG", quality=95)
    print("    ✓ Saved to assets/android-icon-monochrome.png")
    
    # Web favicon (smaller size)
    print("  Creating favicon.png (192x192)...")
    favicon = create_bs_logo(192)
    favicon.save(os.path.join(assets_dir, "favicon.png"), "PNG", quality=95)
    print("    ✓ Saved to assets/favicon.png")
    
    print("\n✅ All logo assets generated successfully!")
    print(f"\nGenerated files in: {assets_dir}/")
    print("\nFiles created:")
    print("  - icon.png")
    print("  - splash-icon.png")
    print("  - android-icon-foreground.png")
    print("  - android-icon-background.png")
    print("  - android-icon-monochrome.png")
    print("  - favicon.png")

if __name__ == "__main__":
    main()
