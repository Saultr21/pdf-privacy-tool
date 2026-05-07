from pydantic import BaseModel
from typing import Literal


class RedactSettings(BaseModel):
    confidence_threshold: float = 0.5
    ocr_language: str = "spa+eng"
    categories: list[str] = [
        "private_person",
        "private_address",
        "private_email",
        "private_phone",
        "private_url",
        "private_date",
        "account_number",
        "secret",
    ]
    replacement_style: Literal["label", "block"] = "label"
