#!/usr/bin/env python3
"""
Test script with mock data to verify the system works
"""

import json
import os
import requests
from datetime import datetime, timedelta

# Set test environment variables
INGEST_URL = 'http://localhost:3000/api/ingest'
INGEST_TOKEN = 'test-token-123'

def create_mock_tweets():
    """Create some mock tweets for testing"""
    now = datetime.now()
    tweets = []
    
    for i in range(5):
        tweet = {
            "id": f"test_tweet_{i}_{int(now.timestamp())}",
            "date": (now - timedelta(hours=i)).isoformat(),
            "content": f"Mock emergency update #{i+1}: This is a test tweet for Hurricane Melissa emergency response system. Update #{i+1} of 5.",
            "url": f"https://twitter.com/test_user/status/test_tweet_{i}",
            "authorName": f"Emergency Service {i+1}",
            "authorHandle": f"emergency_service_{i+1}",
            "raw": {
                "id": f"test_tweet_{i}",
                "content": f"Mock emergency update #{i+1}",
                "user": {
                    "displayname": f"Emergency Service {i+1}",
                    "username": f"emergency_service_{i+1}"
                }
            }
        }
        tweets.append(tweet)
    
    return tweets

def push_tweets(tweets):
    """Push tweets to the Next.js ingest API"""
    try:
        headers = {
            "X-INGEST-TOKEN": INGEST_TOKEN,
            "Content-Type": "application/json"
        }
        
        payload = {"tweets": tweets}
        
        print(f"Pushing {len(tweets)} mock tweets to {INGEST_URL}")
        
        response = requests.post(
            INGEST_URL,
            headers=headers,
            data=json.dumps(payload),
            timeout=60
        )
        
        response.raise_for_status()
        
        result = response.json()
        print(f"Success: {result.get('inserted', 0)} tweets inserted")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"Error pushing tweets: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

def main():
    """Test with mock data"""
    print("Creating mock tweets...")
    tweets = create_mock_tweets()
    
    print(f"Created {len(tweets)} mock tweets")
    for tweet in tweets:
        print(f"  - {tweet['authorName']}: {tweet['content'][:50]}...")
    
    print("\nPushing to API...")
    success = push_tweets(tweets)
    
    if success:
        print("✅ Mock data test completed successfully!")
        print("Check your News Feed tab to see the mock tweets.")
    else:
        print("❌ Mock data test failed!")

if __name__ == "__main__":
    main()
