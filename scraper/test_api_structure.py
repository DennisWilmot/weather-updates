#!/usr/bin/env python3
"""
Test the API structure without database
"""

import json
import requests

def test_tweets_api():
    """Test the tweets API"""
    try:
        response = requests.get('http://localhost:3000/api/tweets')
        print(f"Tweets API Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Tweets API Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"Tweets API Error: {response.text}")
            return False
    except Exception as e:
        print(f"Tweets API Error: {e}")
        return False

def test_ingest_api():
    """Test the ingest API (will fail without proper env vars)"""
    try:
        headers = {
            "X-INGEST-TOKEN": "test-token-123",
            "Content-Type": "application/json"
        }
        payload = {"tweets": []}
        
        response = requests.post(
            'http://localhost:3000/api/ingest',
            headers=headers,
            data=json.dumps(payload)
        )
        print(f"Ingest API Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Ingest API Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"Ingest API Error: {response.text[:200]}...")
            return False
    except Exception as e:
        print(f"Ingest API Error: {e}")
        return False

def main():
    print("Testing API endpoints...")
    print("=" * 50)
    
    tweets_ok = test_tweets_api()
    print()
    ingest_ok = test_ingest_api()
    
    print("=" * 50)
    print(f"Tweets API: {'✅ OK' if tweets_ok else '❌ FAILED'}")
    print(f"Ingest API: {'✅ OK' if ingest_ok else '❌ FAILED'}")
    
    if tweets_ok:
        print("\n🎉 The tweets API is working! You can check the News Feed tab.")
        print("The ingest API needs the SUPABASE_SERVICE_ROLE environment variable.")

if __name__ == "__main__":
    main()
