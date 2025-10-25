#!/usr/bin/env python3
"""
Test script to verify the scraper works locally
"""

import os
import sys

# Add current directory to path
sys.path.append('.')

# Set test environment variables
os.environ['TW_LIST'] = '1981892452895117355'
os.environ['INGEST_URL'] = 'http://localhost:3000/api/ingest'
os.environ['INGEST_TOKEN'] = 'test-token-123'

# Import and run the scraper
from scrape_and_push import run_snscrape, push_tweets

def test_scraper():
    print("Testing snscrape...")
    tweets = run_snscrape()
    print(f"Found {len(tweets)} tweets")
    
    if tweets:
        print("Sample tweet:")
        print(f"  ID: {tweets[0]['id']}")
        print(f"  Author: {tweets[0]['authorName']}")
        print(f"  Content: {tweets[0]['content'][:100]}...")
    
    return tweets

if __name__ == "__main__":
    tweets = test_scraper()
    print(f"\nScraper test completed. Found {len(tweets)} tweets.")
