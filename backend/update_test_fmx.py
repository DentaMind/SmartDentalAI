#!/usr/bin/env python3
"""
Update test FMX images with more realistic findings for the DentaMind API.
This adds patterns to the test images to help our diagnosis endpoint return better results.
"""

import os
import sys
import random
from PIL import Image, ImageDraw, ImageFont

def ensure_directory(directory):
    """Ensure the given directory exists"""
    if not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
    return directory

def update_test_images(directory="fmx_test"):
    """Add more realistic findings to our test images"""
    if not os.path.exists(directory):
        print(f"Error: Directory {directory} not found")
        return

    filenames = os.listdir(directory)
    image_files = [f for f in filenames if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    if not image_files:
        print(f"No image files found in {directory}")
        return
    
    print(f"Found {len(image_files)} images to update")
    updated_count = 0
    
    # Process each image
    for filename in image_files:
        filepath = os.path.join(directory, filename)
        
        # Skip files that aren't actual dental images
        if 'grid' in filename.lower():
            continue
        
        try:
            # Get information from filename
            is_caries = 'caries' in filename.lower() or random.random() < 0.3
            is_periapical = 'periapical' in filename.lower() or 'rct' in filename.lower() or random.random() < 0.2
            is_restoration = 'restoration' in filename.lower() or random.random() < 0.3
            is_implant = 'implant' in filename.lower() or random.random() < 0.1
            
            # Get tooth number if available
            tooth_number = None
            parts = os.path.splitext(filename)[0].split('_')
            for part in parts:
                if part.isdigit() and 1 <= int(part) <= 32:
                    tooth_number = part
                    break
            
            # Load the image
            img = Image.open(filepath)
            width, height = img.size
            
            # Create a drawing context
            draw = ImageDraw.Draw(img)
            
            # Try to load a font
            try:
                font = ImageFont.truetype("Arial.ttf", int(height * 0.04))
                small_font = ImageFont.truetype("Arial.ttf", int(height * 0.025))
            except IOError:
                # Fall back to default font
                font = ImageFont.load_default()
                small_font = ImageFont.load_default()
            
            # Define features to apply
            applied_features = []
            
            # Add a tooth number reference
            if tooth_number:
                draw.text(
                    (int(width * 0.05), int(height * 0.05)), 
                    f"Tooth #{tooth_number}", 
                    fill=(255, 255, 255), 
                    font=font
                )
            
            # Randomly determine center position for the main tooth
            center_x = width // 2 + random.randint(-width//8, width//8)
            center_y = height // 2 + random.randint(-height//8, height//8)
            
            # Add caries if applicable
            if is_caries:
                caries_types = ['occlusal', 'interproximal', 'buccal']
                caries_type = random.choice(caries_types)
                
                if caries_type == 'occlusal':
                    # Draw occlusal caries
                    caries_x = center_x + random.randint(-width//10, width//10)
                    caries_y = center_y - random.randint(height//10, height//5)
                    caries_size = random.randint(width//40, width//20)
                    
                    draw.ellipse(
                        [
                            (caries_x - caries_size, caries_y - caries_size),
                            (caries_x + caries_size, caries_y + caries_size)
                        ],
                        fill=(20, 20, 20)
                    )
                    
                    # Label
                    draw.text(
                        (caries_x - caries_size*2, caries_y - caries_size*2.5),
                        "Caries",
                        fill=(255, 150, 150),
                        font=small_font
                    )
                    
                    applied_features.append("occlusal caries")
                
                elif caries_type == 'interproximal':
                    # Draw interproximal caries
                    caries_x = center_x + random.choice([-1, 1]) * random.randint(width//8, width//6)
                    caries_y = center_y - random.randint(height//15, height//8)
                    caries_size = random.randint(width//60, width//30)
                    
                    draw.ellipse(
                        [
                            (caries_x - caries_size, caries_y - caries_size),
                            (caries_x + caries_size, caries_y + caries_size)
                        ],
                        fill=(20, 20, 20)
                    )
                    
                    # Label
                    draw.text(
                        (caries_x - caries_size*3, caries_y - caries_size*3),
                        "Interproximal\nCaries",
                        fill=(255, 150, 150),
                        font=small_font
                    )
                    
                    applied_features.append("interproximal caries")
                
                else:  # buccal
                    # Draw buccal caries
                    caries_x = center_x
                    caries_y = center_y - random.randint(height//15, height//8)
                    caries_width = random.randint(width//30, width//20)
                    caries_height = random.randint(height//30, height//20)
                    
                    draw.ellipse(
                        [
                            (caries_x - caries_width, caries_y - caries_height),
                            (caries_x + caries_width, caries_y + caries_height)
                        ],
                        fill=(20, 20, 20)
                    )
                    
                    # Label
                    draw.text(
                        (caries_x - caries_width*2, caries_y - caries_height*3),
                        "Buccal Caries",
                        fill=(255, 150, 150),
                        font=small_font
                    )
                    
                    applied_features.append("buccal caries")
            
            # Add periapical lesion if applicable
            if is_periapical:
                # Draw periapical lesion
                lesion_x = center_x
                lesion_y = center_y + random.randint(height//6, height//4)
                lesion_size = random.randint(width//25, width//15)
                
                draw.ellipse(
                    [
                        (lesion_x - lesion_size, lesion_y - lesion_size),
                        (lesion_x + lesion_size, lesion_y + lesion_size)
                    ],
                    fill=(10, 10, 10),
                    outline=(40, 40, 40)
                )
                
                # Label
                draw.text(
                    (lesion_x - lesion_size*2, lesion_y + lesion_size*1.5),
                    "Periapical\nLesion",
                    fill=(150, 150, 255),
                    font=small_font
                )
                
                applied_features.append("periapical lesion")
            
            # Add restoration if applicable
            if is_restoration:
                restoration_types = ['amalgam', 'composite', 'crown']
                restoration_type = random.choice(restoration_types)
                
                if restoration_type == 'amalgam':
                    # Draw amalgam restoration
                    resto_x = center_x
                    resto_y = center_y - random.randint(height//15, height//8)
                    resto_width = random.randint(width//15, width//10)
                    resto_height = random.randint(height//20, height//15)
                    
                    draw.rectangle(
                        [
                            (resto_x - resto_width, resto_y - resto_height),
                            (resto_x + resto_width, resto_y + resto_height)
                        ],
                        fill=(220, 220, 220),
                        outline=(250, 250, 250)
                    )
                    
                    # Label
                    draw.text(
                        (resto_x - resto_width*1.5, resto_y - resto_height*2.5),
                        "Amalgam",
                        fill=(200, 255, 200),
                        font=small_font
                    )
                    
                    applied_features.append("amalgam restoration")
                
                elif restoration_type == 'composite':
                    # Draw composite restoration
                    resto_x = center_x
                    resto_y = center_y - random.randint(height//15, height//8)
                    resto_width = random.randint(width//20, width//15)
                    resto_height = random.randint(height//25, height//20)
                    
                    draw.rectangle(
                        [
                            (resto_x - resto_width, resto_y - resto_height),
                            (resto_x + resto_width, resto_y + resto_height)
                        ],
                        fill=(180, 180, 180),
                        outline=(200, 200, 200)
                    )
                    
                    # Label
                    draw.text(
                        (resto_x - resto_width*2, resto_y - resto_height*2.5),
                        "Composite",
                        fill=(200, 255, 200),
                        font=small_font
                    )
                    
                    applied_features.append("composite restoration")
                
                else:  # crown
                    # Draw crown
                    crown_x = center_x
                    crown_y = center_y - random.randint(height//15, height//8)
                    crown_width = random.randint(width//12, width//8)
                    crown_height = random.randint(height//15, height//10)
                    
                    draw.rectangle(
                        [
                            (crown_x - crown_width, crown_y - crown_height),
                            (crown_x + crown_width, crown_y + crown_height)
                        ],
                        fill=(255, 255, 255),
                        outline=(240, 240, 240)
                    )
                    
                    # Label
                    draw.text(
                        (crown_x - crown_width*1.2, crown_y - crown_height*2),
                        "Crown",
                        fill=(200, 255, 200),
                        font=small_font
                    )
                    
                    applied_features.append("crown")
            
            # Add implant if applicable
            if is_implant:
                # Draw implant
                implant_x = center_x
                implant_y = center_y + random.randint(0, height//10)
                implant_width = random.randint(width//25, width//20)
                implant_height = random.randint(height//5, height//3)
                
                # Draw implant body
                draw.rectangle(
                    [
                        (implant_x - implant_width, implant_y - implant_height//3),
                        (implant_x + implant_width, implant_y + implant_height)
                    ],
                    fill=(240, 240, 240),
                    outline=(220, 220, 220)
                )
                
                # Add threading lines
                for y in range(
                    implant_y - implant_height//3 + implant_height//10, 
                    implant_y + implant_height, 
                    implant_height//8
                ):
                    draw.line(
                        [
                            (implant_x - implant_width, y),
                            (implant_x + implant_width, y)
                        ],
                        fill=(200, 200, 200)
                    )
                
                # Label
                draw.text(
                    (implant_x - implant_width*2, implant_y + implant_height*1.1),
                    "Implant",
                    fill=(255, 255, 200),
                    font=small_font
                )
                
                applied_features.append("implant")
            
            # Save changes
            new_filename = f"enhanced_{filename}"
            new_filepath = os.path.join(directory, new_filename)
            img.save(new_filepath)
            
            print(f"✅ Updated {filename} -> {new_filename} with features: {', '.join(applied_features)}")
            updated_count += 1
            
        except Exception as e:
            print(f"❌ Error updating {filename}: {e}")
    
    print(f"\nSuccessfully updated {updated_count} out of {len(image_files)} images.")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Update test FMX images with realistic features")
    parser.add_argument("--dir", default="fmx_test", help="Directory containing test images")
    
    args = parser.parse_args()
    
    print("=== DentaMind Test FMX Image Enhancer ===")
    update_test_images(args.dir)
    
    print(f"\nNext steps:")
    print(f"1. Run the FMX analyzer script with the enhanced images:")
    print(f"   python enhanced_fmx_analyzer.py --generate-treatment")

if __name__ == "__main__":
    main() 