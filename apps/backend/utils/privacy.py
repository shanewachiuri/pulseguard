import re

def mask_kenyan_phone(phone: str) -> str:
    """
    Masks a Kenyan phone number for KDPA compliance.
    Converts '254712345678' to '254712***678' or '0712345678' to '0712***678'
    """
    # Keep the first 6 characters and the last 3, mask the middle
    if len(phone) >= 10:
        return phone[:6] + "***" + phone[-3:]
    return "***"

def sanitize_input_for_llm(text: str, phone: str) -> str:
    """
    Replaces occurrences of the user's raw phone number in the text with the masked version.
    """
    masked = mask_kenyan_phone(phone)
    return text.replace(phone, masked)