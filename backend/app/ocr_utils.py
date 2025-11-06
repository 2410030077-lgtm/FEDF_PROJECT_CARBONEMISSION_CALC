# ocr_utils.py
import re
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import os

def extract_kwh_from_image(path):
    # support PDF: convert first page to image
    _, ext = os.path.splitext(path.lower())
    imgs = []
    if ext == ".pdf":
        imgs = convert_from_path(path, dpi=300)
    else:
        imgs = [Image.open(path)]

    text = ""
    for img in imgs[:2]:  # only first two pages
        text += pytesseract.image_to_string(img)

    # crude search for patterns like "kWh" or "units"
    m = re.search(r'([\d,\.]{2,7})\s*(kwh|units|k·wh|k w h)', text, re.IGNORECASE)
    if m:
        num = m.group(1).replace(",", "")
        try:
            return float(num)
        except:
            pass
    # fallback: search any number and return
    nums = re.findall(r'[\d,]{2,7}\.?\d*', text)
    for n in nums:
        nn = n.replace(",", "")
        try:
            return float(nn)
        except:
            continue
    raise ValueError("No kWh value found in bill")
