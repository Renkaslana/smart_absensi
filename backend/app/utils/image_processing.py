"""
Image processing utilities.
"""

import base64
import io
from PIL import Image
import numpy as np
from typing import Tuple, Optional


def decode_base64_image(base64_string: str) -> Image.Image:
    """
    Decode base64 string to PIL Image.
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        PIL Image object
    """
    # Remove data URL prefix if present
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data))
    return image


def image_to_numpy(image: Image.Image) -> np.ndarray:
    """
    Convert PIL Image to numpy array (RGB format).
    
    Args:
        image: PIL Image object
        
    Returns:
        Numpy array in RGB format
    """
    if image.mode != "RGB":
        image = image.convert("RGB")
    return np.array(image)


def resize_image(image: Image.Image, max_size: Tuple[int, int] = (1280, 720)) -> Image.Image:
    """
    Resize image while maintaining aspect ratio.
    
    Args:
        image: PIL Image object
        max_size: Maximum (width, height)
        
    Returns:
        Resized PIL Image
    """
    image.thumbnail(max_size, Image.Resampling.LANCZOS)
    return image


def save_image(image: Image.Image, path: str, quality: int = 85) -> None:
    """
    Save PIL Image to file.
    
    Args:
        image: PIL Image object
        path: File path to save
        quality: JPEG quality (1-100)
    """
    if image.mode != "RGB":
        image = image.convert("RGB")
    image.save(path, "JPEG", quality=quality, optimize=True)


def validate_image_quality(image: Image.Image, min_size: Tuple[int, int] = (200, 200)) -> Tuple[bool, Optional[str]]:
    """
    Validate image quality for face recognition.
    
    Args:
        image: PIL Image object
        min_size: Minimum (width, height)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    width, height = image.size
    
    if width < min_size[0] or height < min_size[1]:
        return False, f"Image too small. Minimum size is {min_size[0]}x{min_size[1]}"
    
    # Check if image is too dark (simple heuristic)
    try:
        img_array = np.array(image.convert("L"))  # Convert to grayscale
        mean_brightness = np.mean(img_array)
        
        if mean_brightness < 30:
            return False, "Image too dark. Please improve lighting"
        
        if mean_brightness > 250:
            return False, "Image too bright. Please reduce lighting"
    except Exception:
        pass  # Skip brightness check if it fails
    
    return True, None
