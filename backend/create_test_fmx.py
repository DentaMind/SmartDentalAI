#!/usr/bin/env python3
"""
Create test FMX images for DentaMind testing.
This script generates a set of simulated X-ray images for testing the analysis pipeline.
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

def create_test_xray(
    filename, 
    width=600, 
    height=400, 
    tooth_numbers=None, 
    has_caries=False,
    has_periapical=False,
    has_restoration=False,
    has_implant=False,
    output_dir="fmx_test"
):
    """Create a simulated X-ray image with optional findings"""
    # Ensure directory exists
    ensure_directory(output_dir)
    filepath = os.path.join(output_dir, filename)
    
    # Create base image (dark gray background resembling X-ray)
    img = Image.new('RGB', (width, height), color=(30, 30, 30))
    draw = ImageDraw.Draw(img)
    
    # Try to load a font
    try:
        font = ImageFont.truetype("Arial.ttf", 24)
        small_font = ImageFont.truetype("Arial.ttf", 16)
    except IOError:
        # Fall back to default font
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Add basic tooth structure
    if tooth_numbers:
        for i, tooth_number in enumerate(tooth_numbers):
            # Position teeth evenly across the image
            x_pos = width // (len(tooth_numbers) + 1) * (i + 1)
            y_pos = height // 2
            
            # Draw tooth outline (white for tooth structure)
            tooth_width = 60
            tooth_height = 120
            
            # Draw root structure
            root_width = 40
            root_height = 100
            
            # Draw crown
            draw.rectangle(
                [
                    (x_pos - tooth_width//2, y_pos - tooth_height//3),
                    (x_pos + tooth_width//2, y_pos + tooth_height//4)
                ],
                fill=(200, 200, 200),
                outline=(220, 220, 220),
                width=2
            )
            
            # Draw root
            draw.rectangle(
                [
                    (x_pos - root_width//2, y_pos + tooth_height//4),
                    (x_pos + root_width//2, y_pos + tooth_height//2)
                ],
                fill=(180, 180, 180),
                outline=(200, 200, 200),
                width=1
            )
            
            # Add tooth number
            draw.text(
                (x_pos - 10, y_pos - tooth_height//2 - 30),
                f"#{tooth_number}",
                fill=(255, 255, 255),
                font=font
            )
            
            # Add findings based on parameters
            if has_caries:
                # Add caries indicator (dark spot in crown)
                caries_severity = random.choice(["mild", "moderate", "severe"])
                if caries_severity == "mild":
                    caries_color = (150, 150, 150)
                elif caries_severity == "moderate":
                    caries_color = (100, 100, 100)
                else:
                    caries_color = (50, 50, 50)
                
                # Random position within crown
                caries_x = x_pos + random.randint(-20, 20)
                caries_y = y_pos - random.randint(0, 20)
                caries_size = random.randint(5, 15)
                
                draw.ellipse(
                    [
                        (caries_x - caries_size, caries_y - caries_size),
                        (caries_x + caries_size, caries_y + caries_size)
                    ],
                    fill=caries_color
                )
                
                # Label the caries
                draw.text(
                    (caries_x - 30, caries_y - 25),
                    f"Caries ({caries_severity})",
                    fill=(255, 200, 200),
                    font=small_font
                )
            
            if has_periapical:
                # Add periapical lesion indicator (dark area at apex)
                lesion_x = x_pos
                lesion_y = y_pos + tooth_height//2 + 20
                lesion_size = random.randint(10, 25)
                
                draw.ellipse(
                    [
                        (lesion_x - lesion_size, lesion_y - lesion_size),
                        (lesion_x + lesion_size, lesion_y + lesion_size)
                    ],
                    fill=(20, 20, 20),
                    outline=(50, 50, 50),
                    width=1
                )
                
                # Label the lesion
                draw.text(
                    (lesion_x - 40, lesion_y + lesion_size + 5),
                    "Periapical lesion",
                    fill=(200, 200, 255),
                    font=small_font
                )
            
            if has_restoration:
                # Add restoration indicator (bright area in crown)
                resto_type = random.choice(["amalgam", "composite", "crown"])
                if resto_type == "amalgam":
                    resto_color = (250, 250, 250)
                elif resto_type == "composite":
                    resto_color = (220, 220, 220)
                else:  # crown
                    resto_color = (255, 255, 255)
                
                # Position restoration in crown
                resto_width = random.randint(30, 50)
                resto_height = random.randint(20, 30)
                
                draw.rectangle(
                    [
                        (x_pos - resto_width//2, y_pos - tooth_height//4 - resto_height//2),
                        (x_pos + resto_width//2, y_pos - tooth_height//4 + resto_height//2)
                    ],
                    fill=resto_color,
                    outline=(255, 255, 255),
                    width=1
                )
                
                # Label the restoration
                draw.text(
                    (x_pos - 40, y_pos - tooth_height//4 - 25),
                    f"Restoration ({resto_type})",
                    fill=(200, 255, 200),
                    font=small_font
                )
            
            if has_implant:
                # Add implant indicator (bright metallic structure)
                draw.rectangle(
                    [
                        (x_pos - 15, y_pos - tooth_height//3),
                        (x_pos + 15, y_pos + tooth_height//2)
                    ],
                    fill=(255, 255, 255),
                    outline=(200, 200, 200),
                    width=2
                )
                
                # Add implant thread pattern
                for y in range(y_pos - tooth_height//3 + 10, y_pos + tooth_height//2, 10):
                    draw.line(
                        [(x_pos - 15, y), (x_pos + 15, y)],
                        fill=(200, 200, 200),
                        width=1
                    )
                
                # Label the implant
                draw.text(
                    (x_pos - 30, y_pos + tooth_height//2 + 10),
                    "Implant",
                    fill=(255, 255, 200),
                    font=small_font
                )
    
    # Add image type and info at the bottom
    image_type = "unknown"
    if "PA_" in filename:
        image_type = "Periapical"
    elif "BW_" in filename:
        image_type = "Bitewing"
    elif "PANO" in filename:
        image_type = "Panoramic"
    
    draw.text(
        (10, height - 30),
        f"{image_type} X-ray - {filename}",
        fill=(255, 255, 255),
        font=small_font
    )
    
    # Save the image
    img.save(filepath)
    print(f"Created test X-ray image: {filepath}")
    
    return filepath

def create_test_fmx_set():
    """Create a complete set of test FMX images"""
    output_dir = "fmx_test"
    ensure_directory(output_dir)
    
    # Define test cases
    test_cases = [
        # Periapical images
        {
            "filename": "PA_14.jpg", 
            "tooth_numbers": ["14"], 
            "has_caries": True
        },
        {
            "filename": "PA_15.jpg", 
            "tooth_numbers": ["15"], 
            "has_restoration": True
        },
        {
            "filename": "PA_13.jpg", 
            "tooth_numbers": ["13"], 
            "has_implant": True
        },
        {
            "filename": "PA_9_10.jpg", 
            "tooth_numbers": ["9", "10"], 
            "has_restoration": True
        },
        {
            "filename": "PA_19_20.jpg", 
            "tooth_numbers": ["19", "20"], 
            "has_caries": True,
            "has_periapical": True
        },
        {
            "filename": "PA_31_30.jpg", 
            "tooth_numbers": ["31", "30"], 
            "has_caries": True,
            "has_restoration": True
        },
        {
            "filename": "PA_22_24.jpg", 
            "tooth_numbers": ["22", "23", "24"], 
            "has_periapical": True
        },
        {
            "filename": "PA_19_21.jpg", 
            "tooth_numbers": ["19", "20", "21"], 
            "has_restoration": True
        },
        {
            "filename": "PA_Implant_31.jpg", 
            "tooth_numbers": ["31"], 
            "has_implant": True
        },
        {
            "filename": "PA_Implant_22_19.jpg", 
            "tooth_numbers": ["22", "19"], 
            "has_implant": True
        },
        {
            "filename": "PA_RCT_22.jpg", 
            "tooth_numbers": ["22"], 
            "has_restoration": True,
            "has_periapical": True
        },
        {
            "filename": "PA_19_18.jpg", 
            "tooth_numbers": ["19", "18"], 
            "has_caries": True
        },
        
        # Bitewing images
        {
            "filename": "BW_15.jpg",
            "tooth_numbers": ["15", "16", "17", "18"], 
            "has_caries": True,
            "has_restoration": True
        },
        {
            "filename": "BW_7_10.jpg",
            "tooth_numbers": ["7", "8", "9", "10"],
            "has_caries": True
        },
        {
            "filename": "BW_30_31.jpg",
            "tooth_numbers": ["30", "31", "32"],
            "has_caries": True,
            "has_restoration": True
        },
        {
            "filename": "BW_7_8.jpg",
            "tooth_numbers": ["7", "8"],
            "has_restoration": True
        },
        {
            "filename": "BW_9_10.jpg",
            "tooth_numbers": ["9", "10"],
            "has_restoration": True
        },
        {
            "filename": "BW_31_30.jpg",
            "tooth_numbers": ["31", "30"],
            "has_caries": True
        },
        
        # Panoramic
        {
            "filename": "PANO.jpg",
            "tooth_numbers": ["1", "16", "17", "32"],
            "has_caries": True,
            "has_periapical": True,
            "has_restoration": True,
            "has_implant": True,
            "width": 800,
            "height": 400
        }
    ]
    
    created_files = []
    
    # Create each test image
    for case in test_cases:
        filename = case.pop("filename")
        width = case.pop("width", 600)
        height = case.pop("height", 400)
        
        filepath = create_test_xray(
            filename=filename,
            width=width,
            height=height,
            output_dir=output_dir,
            **case
        )
        created_files.append(filepath)
    
    return created_files

def main():
    """Main function"""
    print("=== DentaMind Test FMX Creator ===")
    
    created_files = create_test_fmx_set()
    
    print(f"\nCreated {len(created_files)} test FMX images in fmx_test directory.")
    
    print(f"\nNext steps:")
    print(f"1. Run the FMX analyzer script: python fmx_analyzer.py")
    print(f"2. Make sure the debug server is running on port 8092 (./start_alt_server.sh)")
    print(f"3. Check the fmx_analysis_report.json for results")

if __name__ == "__main__":
    main() 