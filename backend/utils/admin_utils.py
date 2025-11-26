"""
Admin management utilities for loading and verifying admin credentials.
"""
import json
import os
from typing import Optional, Dict, List
from pathlib import Path

ADMINS_FILE = Path(__file__).parent.parent / "admins.json"


def load_admins() -> List[Dict[str, str]]:
    """
    Load admin list from admins.json file.
    
    Returns:
        List of admin dictionaries
    """
    try:
        if not ADMINS_FILE.exists():
            # Create default admins file if it doesn't exist
            default_admins = {
                "admins": [
                    {
                        "admin_id": "admin1",
                        "admin_key": "admin-secret-change-this",
                        "email": "admin1@example.com",
                        "name": "Primary Admin"
                    }
                ]
            }
            with open(ADMINS_FILE, 'w') as f:
                json.dump(default_admins, f, indent=2)
            return default_admins["admins"]
        
        with open(ADMINS_FILE, 'r') as f:
            data = json.load(f)
            return data.get("admins", [])
    except Exception as e:
        print(f"Error loading admins: {e}")
        return []


def verify_admin(admin_id: str, admin_key: str) -> Optional[Dict[str, str]]:
    """
    Verify admin credentials against the admins list.
    
    Args:
        admin_id: Admin's unique identifier
        admin_key: Admin's secret key
        
    Returns:
        Admin info dict if valid, None otherwise
    """
    admins = load_admins()
    
    for admin in admins:
        if admin.get("admin_id") == admin_id and admin.get("admin_key") == admin_key:
            return admin
    
    return None


def get_admin_by_id(admin_id: str) -> Optional[Dict[str, str]]:
    """
    Get admin info by admin_id.
    
    Args:
        admin_id: Admin's unique identifier
        
    Returns:
        Admin info dict (without key) if found, None otherwise
    """
    admins = load_admins()
    
    for admin in admins:
        if admin.get("admin_id") == admin_id:
            # Return without exposing the key
            return {
                "admin_id": admin.get("admin_id"),
                "email": admin.get("email"),
                "name": admin.get("name")
            }
    
    return None


def add_admin(admin_id: str, admin_key: str, email: str, name: str) -> bool:
    """
    Add a new admin to the admins.json file.
    
    Args:
        admin_id: Admin's unique identifier
        admin_key: Admin's secret key
        email: Admin's email
        name: Admin's name
        
    Returns:
        True if added successfully, False otherwise
    """
    try:
        admins = load_admins()
        
        # Check if admin_id already exists
        if any(admin.get("admin_id") == admin_id for admin in admins):
            return False
        
        # Add new admin
        admins.append({
            "admin_id": admin_id,
            "admin_key": admin_key,
            "email": email,
            "name": name
        })
        
        # Save back to file
        with open(ADMINS_FILE, 'w') as f:
            json.dump({"admins": admins}, f, indent=2)
        
        return True
    except Exception as e:
        print(f"Error adding admin: {e}")
        return False


def remove_admin(admin_id: str) -> bool:
    """
    Remove an admin from the admins.json file.
    
    Args:
        admin_id: Admin's unique identifier
        
    Returns:
        True if removed successfully, False otherwise
    """
    try:
        admins = load_admins()
        
        # Filter out the admin to remove
        new_admins = [admin for admin in admins if admin.get("admin_id") != admin_id]
        
        # Check if anything was removed
        if len(new_admins) == len(admins):
            return False
        
        # Save back to file
        with open(ADMINS_FILE, 'w') as f:
            json.dump({"admins": new_admins}, f, indent=2)
        
        return True
    except Exception as e:
        print(f"Error removing admin: {e}")
        return False


def list_admins() -> List[Dict[str, str]]:
    """
    List all admins (without exposing keys).
    
    Returns:
        List of admin info dicts (without keys)
    """
    admins = load_admins()
    return [
        {
            "admin_id": admin.get("admin_id"),
            "email": admin.get("email"),
            "name": admin.get("name")
        }
        for admin in admins
    ]
