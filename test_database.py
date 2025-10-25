#!/usr/bin/env python3
"""
Test script to manually insert a tweet into Supabase
"""

import os
import json
import requests
from datetime import datetime

# You'll need to set these environment variables
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

def test_direct_supabase():
    """Test direct Supabase connection"""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print("❌ Missing Supabase environment variables")
        print("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
        return False
    
    print(f"Testing Supabase connection...")
    print(f"URL: {SUPABASE_URL}")
    print(f"Key: {SUPABASE_ANON_KEY[:20]}...")
    
    # Test reading from tweets table
    url = f"{SUPABASE_URL}/rest/v1/tweets"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Supabase response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} tweets in database")
            for tweet in data[:3]:  # Show first 3 tweets
                print(f"  - {tweet.get('author', 'Unknown')}: {tweet.get('text', 'No text')[:50]}...")
            return True
        else:
            print(f"Supabase error: {response.text}")
            return False
            
    except Exception as e:
        print(f"Supabase connection error: {e}")
        return False

def insert_test_tweet():
    """Insert a test tweet directly into Supabase"""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print("❌ Missing Supabase environment variables")
        return False
    
    test_tweet = {
        "id": f"test_manual_{int(datetime.now().timestamp())}",
        "author": "Test Emergency Service",
        "handle": "test_emergency",
        "created_at": datetime.now().isoformat(),
        "text": "🚨 TEST TWEET: This is a manual test tweet to verify the database is working. Hurricane Melissa emergency response system test.",
        "url": "https://twitter.com/test/status/test",
        "raw": {"test": True}
    }
    
    url = f"{SUPABASE_URL}/rest/v1/tweets"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(test_tweet))
        print(f"Insert response status: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ Test tweet inserted successfully!")
            return True
        else:
            print(f"❌ Insert failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Insert error: {e}")
        return False

def main():
    print("🔍 Testing Database Connection...")
    print("=" * 50)
    
    # Test reading
    read_ok = test_direct_supabase()
    
    if read_ok:
        print("\n📝 Inserting test tweet...")
        insert_ok = insert_test_tweet()
        
        if insert_ok:
            print("\n🔄 Checking API again...")
            # Test the Next.js API
            try:
                import requests
                response = requests.get('http://localhost:3000/api/tweets')
                if response.status_code == 200:
                    data = response.json()
                    print(f"API now returns {len(data.get('tweets', []))} tweets")
                    if data.get('tweets'):
                        print("✅ SUCCESS! Check your News Feed tab now!")
                    else:
                        print("❌ API still returns empty - there might be a filtering issue")
                else:
                    print(f"❌ API error: {response.status_code}")
            except Exception as e:
                print(f"❌ API test error: {e}")
        else:
            print("❌ Could not insert test tweet")
    else:
        print("❌ Could not connect to database")

if __name__ == "__main__":
    main()
