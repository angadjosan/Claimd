"""
Database utilities for converting BSON to JSON-safe formats.
"""
from bson import ObjectId
from datetime import datetime
from typing import Dict, Any


def bson_to_json(doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively converts MongoDB BSON types (ObjectId, datetime) into JSON-safe types.
    
    Args:
        doc: MongoDB document with BSON types
    
    Returns:
        Dictionary with JSON-safe values
    """
    if not doc:
        return {}

    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [bson_to_json(v) if isinstance(v, dict) else v for v in value]
        elif isinstance(value, dict):
            result[key] = bson_to_json(value)
        else:
            result[key] = value
    return result
