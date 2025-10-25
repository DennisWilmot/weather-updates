#!/usr/bin/env python3
"""
Twitter/X List Scraper for Hurricane Emergency Updates
Scrapes tweets from a specific X list and pushes them to the Next.js app
"""

import json
import os
import subprocess
import requests
import sys
from datetime import datetime

# Configuration from environment variables
LIST_SPEC = os.environ.get("TW_LIST", "1981892452895117355")  # Default to the provided list ID
INGEST_URL = os.environ.get("INGEST_URL")
INGEST_TOKEN = os.environ.get("INGEST_TOKEN")

def run_snscrape():
    """Run snscrape to get tweets from the X list"""
    print(f"Scraping tweets from list: {LIST_SPEC}")
    
    # Use the list ID directly with snscrape
    cmd = ["snscrape", "--jsonl", "twitter-list-posts", LIST_SPEC]
    
    try:
        proc = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True
        )
        
        tweets = []
        for line in proc.stdout:
            try:
                tweet_data = json.loads(line.strip())
                tweets.append({
                    "id": tweet_data.get("id"),
                    "date": tweet_data.get("date"),
                    "content": tweet_data.get("content"),
                    "url": tweet_data.get("url"),
                    "authorName": tweet_data.get("user", {}).get("displayname"),
                    "authorHandle": tweet_data.get("user", {}).get("username"),
                    "raw": tweet_data
                })
            except json.JSONDecodeError:
                continue
            except Exception as e:
                print(f"Error processing tweet: {e}")
                continue
        
        # Wait for process to complete
        proc.wait()
        
        if proc.returncode != 0:
            stderr_output = proc.stderr.read()
            print(f"snscrape error: {stderr_output}")
            return []
        
        # Sort by date (newest first) and limit to ~200 tweets
        tweets.sort(key=lambda x: x["date"], reverse=True)
        return tweets[:200]
        
    except FileNotFoundError:
        print("Error: snscrape not found. Please install it with: pip install snscrape")
        return []
    except Exception as e:
        print(f"Error running snscrape: {e}")
        return []

def push_tweets(tweets):
    """Push tweets to the Next.js ingest API"""
    if not INGEST_URL or not INGEST_TOKEN:
        print("Error: INGEST_URL and INGEST_TOKEN environment variables must be set")
        return False
    
    try:
        headers = {
            "X-INGEST-TOKEN": INGEST_TOKEN,
            "Content-Type": "application/json"
        }
        
        payload = {"tweets": tweets}
        
        print(f"Pushing {len(tweets)} tweets to {INGEST_URL}")
        
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
    """Main function to scrape and push tweets"""
    print(f"Starting tweet scraping at {datetime.now().isoformat()}")
    
    # Check required environment variables
    if not INGEST_URL:
        print("Error: INGEST_URL environment variable not set")
        sys.exit(1)
    
    if not INGEST_TOKEN:
        print("Error: INGEST_TOKEN environment variable not set")
        sys.exit(1)
    
    # Scrape tweets
    tweets = run_snscrape()
    
    if not tweets:
        print("No tweets scraped.")
        return
    
    print(f"Scraped {len(tweets)} tweets")
    
    # Push tweets to API
    success = push_tweets(tweets)
    
    if success:
        print("Tweet scraping and ingestion completed successfully")
    else:
        print("Tweet ingestion failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
