#!/usr/bin/env python3
"""
Test script to verify frontend-backend connectivity
"""
import requests
import json
from datetime import datetime

API_URL = "http://127.0.0.1:8000/api"

def test_api_endpoints():
    """Test key API endpoints"""
    tests = [
        ("Backend Health", "GET", f"{API_URL}/auth/me/", None, [401]),
        ("Offers List", "GET", f"{API_URL}/offers/", None, [401, 200]),
        ("Applications List", "GET", f"{API_URL}/applications/", None, [401, 200]),
        ("Notifications", "GET", f"{API_URL}/notifications/", None, [401, 200]),
        ("Conventions", "GET", f"{API_URL}/conventions/mine/", None, [401, 200]),
    ]
    
    print("=" * 70)
    print("Frontend-Backend Connectivity Test")
    print("=" * 70)
    print(f"\nTesting API Base URL: {API_URL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = []
    for test_name, method, url, data, expected_codes in tests:
        try:
            if method == "GET":
                response = requests.get(url, timeout=5)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=5)
            
            status = response.status_code
            is_pass = status in expected_codes
            results.append({
                "name": test_name,
                "status": "✅ PASS" if is_pass else "❌ FAIL",
                "code": status,
                "url": url
            })
            print(f"{'✅ PASS' if is_pass else '❌ FAIL'} | {test_name:20} | Status: {status:3} | {url}")
            
        except requests.exceptions.ConnectionError as e:
            print(f"❌ FAIL | {test_name:20} | Error: Connection refused - {e}")
            results.append({
                "name": test_name,
                "status": "❌ FAIL",
                "error": "Connection refused",
                "url": url
            })
        except requests.exceptions.Timeout:
            print(f"❌ FAIL | {test_name:20} | Error: Timeout")
            results.append({
                "name": test_name,
                "status": "❌ FAIL",
                "error": "Timeout",
                "url": url
            })
        except Exception as e:
            print(f"❌ FAIL | {test_name:20} | Error: {str(e)}")
            results.append({
                "name": test_name,
                "status": "❌ FAIL",
                "error": str(e),
                "url": url
            })
    
    # Summary
    passed = sum(1 for r in results if "PASS" in r["status"])
    total = len(results)
    
    print("\n" + "=" * 70)
    print(f"Summary: {passed}/{total} tests passed")
    print("=" * 70)
    
    if passed == total:
        print("\n🎉 All tests passed! Frontend and backend are properly linked.")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check the backend server is running.")
        return False

def test_cors():
    """Test CORS headers"""
    print("\n" + "=" * 70)
    print("CORS Configuration Test")
    print("=" * 70)
    
    try:
        response = requests.get(f"{API_URL}/offers/", timeout=5)
        headers = response.headers
        
        cors_headers = {
            "Access-Control-Allow-Origin": headers.get("Access-Control-Allow-Origin", "NOT SET"),
            "Access-Control-Allow-Methods": headers.get("Access-Control-Allow-Methods", "NOT SET"),
            "Access-Control-Allow-Credentials": headers.get("Access-Control-Allow-Credentials", "NOT SET"),
        }
        
        print("\nCORS Headers received:")
        for header, value in cors_headers.items():
            print(f"  {header}: {value}")
        
        if "Access-Control-Allow-Origin" in headers:
            print("\n✅ CORS is properly configured!")
            return True
        else:
            print("\n⚠️  CORS headers not found in response.")
            return False
            
    except Exception as e:
        print(f"\n❌ Error testing CORS: {str(e)}")
        return False

if __name__ == "__main__":
    try:
        api_test = test_api_endpoints()
        cors_test = test_cors()
        
        print("\n" + "=" * 70)
        print("FINAL RESULT")
        print("=" * 70)
        if api_test and cors_test:
            print("✅ Frontend and backend are fully linked and operational!")
        else:
            print("⚠️  Some issues detected. Review above for details.")
        print("=" * 70)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
