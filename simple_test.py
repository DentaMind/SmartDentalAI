import requests
import base64
from PIL import Image
import io
from pathlib import Path

# Convert the image to base64
def image_to_base64_str(image_path):
    with open(image_path, 'rb') as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

# Save the test image
def save_test_image():
    # Create a simple test image (1x1 black pixel)
    img = Image.new('RGB', (1, 1), color='black')
    img.save('test.png')
    return 'test.png'

# Test the API
def test_api():
    # Save a test image
    image_path = save_test_image()
    
    try:
        # Convert to base64
        base64_str = image_to_base64_str(image_path)
        
        # Send to API
        response = requests.post(
            "http://127.0.0.1:8001/image/upload",
            json={"image_base64": base64_str}
        )
        
        print("\nAPI Response:")
        print(f"Status: {response.status_code}")
        print("Response:", response.json())
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Clean up
        if Path(image_path).exists():
            Path(image_path).unlink()

if __name__ == "__main__":
    test_api() 