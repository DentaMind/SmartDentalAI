#!/usr/bin/env python3
"""
Create a test FMX grid image for DentaMind testing.
This script generates a simple FMX grid with numbered positions.
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont

def create_fmx_grid(output_path="fmx_test/fmx_grid.jpg"):
    """Create a test FMX grid image"""
    # Set up the image
    width, height = 1400, 1000
    bg_color = (240, 240, 240)
    grid_color = (200, 200, 200)
    text_color = (50, 50, 50)
    
    # Create a new image
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Try to load a font
    try:
        font = ImageFont.truetype("Arial.ttf", 20)
    except IOError:
        # Fall back to default font
        font = ImageFont.load_default()
    
    # Draw grid lines
    rows, cols = 4, 5
    cell_width, cell_height = width // cols, height // rows
    
    # Draw horizontal grid lines
    for i in range(rows + 1):
        y = i * cell_height
        draw.line([(0, y), (width, y)], fill=grid_color, width=2)
    
    # Draw vertical grid lines
    for i in range(cols + 1):
        x = i * cell_width
        draw.line([(x, 0), (x, height)], fill=grid_color, width=2)
    
    # Add text to each cell
    positions = [
        # Row 1
        "PA_14", "PA_15", "BW_15", "BW_7-10", "PA_13",
        # Row 2
        "PA_19-20", "BW_30-31", "BW_7-8", "BW_9-10", "PA_9-10",
        # Row 3
        "PA_31-30", "BW_31-30", "SCAN_28-25", "PA_22-24", "PA_19-21",
        # Row 4
        "PA_Implant_31", "PA_Implant_22-19", "PA_RCT_22", "PA_19-18", "PANO"
    ]
    
    for i in range(rows):
        for j in range(cols):
            index = i * cols + j
            if index < len(positions):
                x = j * cell_width + cell_width // 2
                y = i * cell_height + cell_height // 2
                
                # Draw position identifier
                position_text = positions[index]
                text_bbox = draw.textbbox((0, 0), position_text, font=font)
                text_width = text_bbox[2] - text_bbox[0]
                text_height = text_bbox[3] - text_bbox[1]
                
                text_x = x - text_width // 2
                text_y = y - text_height // 2
                draw.text((text_x, text_y), position_text, fill=text_color, font=font)
                
                # Draw placeholder for image
                rect_margin = 20
                draw.rectangle(
                    [
                        (j * cell_width + rect_margin, i * cell_height + rect_margin),
                        ((j + 1) * cell_width - rect_margin, (i + 1) * cell_height - rect_margin)
                    ],
                    outline=(100, 100, 100),
                    width=1
                )
    
    # Add title
    title = "FMX Grid - DentaMind Test"
    title_font = ImageFont.load_default()
    try:
        title_font = ImageFont.truetype("Arial.ttf", 30)
    except IOError:
        pass
    
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    draw.text(((width - title_width) // 2, 10), title, fill=(0, 0, 0), font=title_font)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Save the image
    img.save(output_path)
    print(f"Created FMX grid image at {output_path}")
    
    return output_path

def main():
    """Main function"""
    print("=== DentaMind FMX Grid Creator ===")
    
    # Create FMX grid
    grid_path = create_fmx_grid()
    
    print(f"\nNext steps:")
    print(f"1. Use this grid as a reference for placement of FMX images")
    print(f"2. Run save_sample_fmx.py to download sample FMX images")
    print(f"3. Run fmx_analyzer.py to analyze the images with DentaMind")

if __name__ == "__main__":
    main() 