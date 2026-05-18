#!/usr/bin/env python3
"""
Debug login issue for ahmed@esi.edu.dz
"""
import requests
import json

API_URL = "http://127.0.0.1:8000/api"

def test_login():
    print("Testing login for ahmed@esi.edu.dz with password 123456789")

    # Test 1: Login with email (frontend first attempt)
    print("\n1. Testing login with email field:")
    data1 = {'email': 'ahmed@esi.edu.dz', 'password': '123456789'}
    try:
        response1 = requests.post(f"{API_URL}/auth/login/", json=data1, timeout=5)
        print(f"Status: {response1.status_code}")
        print(f"Response: {response1.json()}")
    except Exception as e:
        print(f"Error: {e}")

    # Test 2: Login with username (frontend fallback)
    print("\n2. Testing login with username field:")
    data2 = {'username': 'ahmed@esi.edu.dz', 'password': '123456789'}
    try:
        response2 = requests.post(f"{API_URL}/auth/login/", json=data2, timeout=5)
        print(f"Status: {response2.status_code}")
        print(f"Response: {response2.json()}")
    except Exception as e:
        print(f"Error: {e}")

    # Test 3: Check if user exists
    print("\n3. Checking if user exists in database...")
    import sqlite3
    import os
    path = r'd:\TI\Stagio-main\Stagio-main\backend1\db.sqlite3'
    if os.path.exists(path):
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        cur.execute("SELECT id, username, email, is_active, role FROM users_customuser WHERE email = ?", ('ahmed@esi.edu.dz',))
        user = cur.fetchone()
        if user:
            print(f"User found: ID={user[0]}, username='{user[1]}', email='{user[2]}', active={user[3]}, role='{user[4]}'")
        else:
            print("User not found in database!")
        conn.close()
    else:
        print("Database file not found!")

if __name__ == "__main__":
    test_login()