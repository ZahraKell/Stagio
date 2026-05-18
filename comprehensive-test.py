#!/usr/bin/env python3
"""
Comprehensive frontend-backend connectivity test with browser simulation
"""
import requests
import json
from datetime import datetime

API_URL = "http://127.0.0.1:8000/api"

def test_cors_preflight():
    """Test CORS preflight requests (OPTIONS)"""
    print("\n" + "=" * 70)
    print("CORS Preflight Test (OPTIONS Request)")
    print("=" * 70)
    
    try:
        headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        }
        
        response = requests.options(f"{API_URL}/offers/", headers=headers, timeout=5)
        
        print(f"\nRequest URL: {API_URL}/offers/")
        print(f"Request Headers:")
        for key, value in headers.items():
            print(f"  {key}: {value}")
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"\nResponse Headers:")
        cors_headers = [h for h in response.headers.keys() if 'Access-Control' in h or 'access-control' in h]
        
        if cors_headers:
            for header in cors_headers:
                print(f"  {header}: {response.headers[header]}")
            print("\n✅ CORS preflight successful!")
            return True
        else:
            print("  No CORS headers found")
            print("\n⚠️  CORS may not be properly configured")
            print("\nAll response headers:")
            for key, value in response.headers.items():
                print(f"  {key}: {value}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error testing CORS: {str(e)}")
        return False

def test_registration():
    """Test user registration endpoint"""
    print("\n" + "=" * 70)
    print("Registration Endpoint Test")
    print("=" * 70)
    
    try:
        payload = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "role": "student"
        }
        
        response = requests.post(
            f"{API_URL}/auth/register/",
            json=payload,
            timeout=5
        )
        
        print(f"\nRequest: POST {API_URL}/auth/register/")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code in [200, 201, 400]:
            print(f"Response: {response.json()}")
            print("\n✅ Registration endpoint is accessible!")
            return True
        else:
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

def test_browser_simulation():
    """Simulate browser requests with typical headers"""
    print("\n" + "=" * 70)
    print("Browser Simulation Test")
    print("=" * 70)
    
    browser_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Origin": "http://localhost:5173",
        "Referer": "http://localhost:5173/",
    }
    
    try:
        response = requests.get(
            f"{API_URL}/offers/",
            headers=browser_headers,
            timeout=5
        )
        
        print(f"\nRequest: GET {API_URL}/offers/")
        print(f"Headers: {json.dumps(browser_headers, indent=2)}")
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"✅ Response is valid JSON (array with {len(data)} items)")
            else:
                print(f"✅ Response is valid JSON")
            print("✅ Browser simulation successful!")
            return True
        else:
            print(f"⚠️  Unexpected status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

def test_jwt_endpoints():
    """Test JWT token endpoints"""
    print("\n" + "=" * 70)
    print("JWT Token Endpoints Test")
    print("=" * 70)
    
    try:
        # Test login endpoint
        login_payload = {
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
        
        response = requests.post(
            f"{API_URL}/auth/login/",
            json=login_payload,
            timeout=5
        )
        
        print(f"\nTest 1: Login Endpoint")
        print(f"Request: POST {API_URL}/auth/login/")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "access" in data and "refresh" in data:
                print("✅ JWT tokens returned in response")
                return True
            else:
                print(f"⚠️  Response missing tokens: {data.keys()}")
        elif response.status_code == 401:
            print("⚠️  Credentials not found (expected for test account)")
        else:
            print(f"Response: {response.json()}")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("COMPREHENSIVE FRONTEND-BACKEND CONNECTIVITY TEST")
    print("=" * 70)
    print(f"Backend URL: {API_URL}")
    print(f"Frontend URL: http://localhost:5173")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {
        "CORS Preflight": test_cors_preflight(),
        "Browser Simulation": test_browser_simulation(),
        "JWT Endpoints": test_jwt_endpoints(),
        "Registration": test_registration(),
    }
    
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "⚠️  CHECK"
        print(f"{status} | {test_name}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 70)
    if all_passed:
        print("🎉 All tests passed! Frontend-Backend are fully operational!")
    else:
        print("⚠️  Some tests need review. See details above.")
    print("=" * 70)
    print("\n✨ You can now test the application at: http://localhost:5173")
    print("=" * 70)
