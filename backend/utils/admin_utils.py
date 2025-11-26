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
                        "email": "admin@example.com",
                        "password": "admin-secret-change-this",
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


def verify_admin(email: str, password: str) -> Optional[Dict[str, str]]:
    """
    Verify admin credentials against the admins list.
    
    Args:
        email: Admin's email address
        password: Admin's password
        
    Returns:
        Admin info dict if valid, None otherwise
    """
    admins = load_admins()
    
    for admin in admins:
        if admin.get("email") == email and admin.get("password") == password:
            return admin
    
    return None


def get_admin_by_email(email: str) -> Optional[Dict[str, str]]:
    """
    Get admin info by email.
    
    Args:
        email: Admin's email address
        
    Returns:
        Admin info dict (without password) if found, None otherwise
    """
    admins = load_admins()
    
    for admin in admins:
        if admin.get("email") == email:
            # Return without exposing the password
            return {
                "email": admin.get("email"),
                "name": admin.get("name")
            }
    
    return None


def add_admin(email: str, password: str, name: str) -> bool:
    """
    Add a new admin to the admins.json file.
    
    Args:
        email: Admin's email address
        password: Admin's password
        name: Admin's name
        
    Returns:
        True if added successfully, False otherwise
    """
    try:
        admins = load_admins()
        
        # Check if email already exists
        if any(admin.get("email") == email for admin in admins):
            return False
        
        # Add new admin
        admins.append({
            "email": email,
            "password": password,
            "name": name
        })
        
        # Save back to file
        with open(ADMINS_FILE, 'w') as f:
            json.dump({"admins": admins}, f, indent=2)
        
        return True
    except Exception as e:
        print(f"Error adding admin: {e}")
        return False


def remove_admin(email: str) -> bool:
    """
    Remove an admin from the admins.json file.
    
    Args:
        email: Admin's email address
        
    Returns:
        True if removed successfully, False otherwise
    """
    try:
        admins = load_admins()
        
        # Filter out the admin to remove
        new_admins = [admin for admin in admins if admin.get("email") != email]
        
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
    List all admins (without exposing passwords).
    
    Returns:
        List of admin info dicts (without passwords)
    """
    admins = load_admins()
    return [
        {
            "email": admin.get("email"),
            "name": admin.get("name")
        }
        for admin in admins
    ]
