#!/usr/bin/env python3
"""
Reddit Scraper - No API Required

This module provides functions to scrape Reddit posts without needing API access.
It uses BeautifulSoup to parse HTML pages and extract relevant information.
"""

import time
import random
import json
import os
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional

# Constants
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
]

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'crawler', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

RAW_DATA_PATH = os.path.join(DATA_DIR, 'threads_raw.json')
OPPORTUNITIES_PATH = os.path.join(DATA_DIR, 'opportunities.json')

def get_random_user_agent() -> str:
    """Return a random user agent from the list."""
    return random.choice(USER_AGENTS)

def make_request(url: str, retries: int = 3, delay: int = 5) -> Optional[str]:
    """
    Make HTTP request with retry logic and random user agents
    
    Args:
        url: The URL to request
        retries: Number of retry attempts
        delay: Base delay between retries (will be randomized)
        
    Returns:
        HTML content as string or None if all retries failed
    """
    headers = {
        'User-Agent': get_random_user_agent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9'
    }
    
    for attempt in range(retries):
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                return response.text
            else:
                print(f"Got status code {response.status_code} for {url}")
        except Exception as e:
            print(f"Error fetching {url}: {str(e)}")
        
        # Add randomized delay before retry
        sleep_time = delay + random.uniform(1, 3)
        print(f"Retrying in {sleep_time:.2f} seconds... (Attempt {attempt + 1}/{retries})")
        time.sleep(sleep_time)
    
    return None

def parse_reddit_thread(html: str, subreddit: str) -> List[Dict[str, Any]]:
    """
    Parse Reddit HTML to extract thread data
    
    Args:
        html: HTML content from Reddit
        subreddit: Name of the subreddit
        
    Returns:
        List of thread dictionaries with extracted data
    """
    soup = BeautifulSoup(html, 'html.parser')
    threads = []
    
    # Find all posts in the feed
    posts = soup.find_all('div', {'data-testid': 'post-container'})
    
    for post in posts:
        try:
            # Extract post data
            title_element = post.find('h3')
            title = title_element.text.strip() if title_element else "No Title"
            
            # Get post URL
            link_element = post.find('a', {'data-click-id': 'body'})
            url = f"https://www.reddit.com{link_element['href']}" if link_element and 'href' in link_element.attrs else None
            
            if url is None:
                continue
                
            # Get post ID from URL
            post_id = url.split('comments/')[1].split('/')[0] if '/comments/' in url else None
            
            # Get author
            author_element = post.find('a', {'data-testid': 'post_author_link'})
            author = author_element.text.strip() if author_element else "Unknown"
            
            # Get upvotes
            upvote_element = post.find('div', {'data-testid': 'post-voting-value'})
            upvotes_text = upvote_element.text.strip() if upvote_element else "0"
            
            # Handle k/m formatting
            if 'k' in upvotes_text.lower():
                upvotes = int(float(upvotes_text.lower().replace('k', '')) * 1000)
            elif 'm' in upvotes_text.lower():
                upvotes = int(float(upvotes_text.lower().replace('m', '')) * 1000000)
            else:
                upvotes = int(upvotes_text) if upvotes_text.isdigit() else 0
            
            # Get comments count
            comments_element = post.find('span', string=lambda text: text and 'comments' in text.lower())
            comments_text = comments_element.text.strip() if comments_element else "0 comments"
            comments_count = int(comments_text.split()[0]) if comments_text.split()[0].isdigit() else 0
            
            # Get flair if any
            flair_element = post.find('div', {'data-testid': 'post-flairs'})
            flair = flair_element.text.strip() if flair_element else None
            
            # Get timestamp (approximation from relative time)
            time_element = post.find('span', {'data-testid': 'post_timestamp'})
            time_text = time_element.text.strip() if time_element else ""
            
            # Convert relative time to timestamp
            timestamp = datetime.now().isoformat()  # Default to now
            
            # Get post body preview (if available)
            body_element = post.find('div', {'data-testid': 'post-content'})
            body = ""
            if body_element:
                paragraphs = body_element.find_all('p')
                if paragraphs:
                    body = " ".join([p.text.strip() for p in paragraphs])
                else:
                    body_text = body_element.text.strip()
                    if body_text and body_text != title:
                        body = body_text
            
            # Create thread object
            thread = {
                'id': post_id,
                'title': title,
                'url': url,
                'author': author,
                'subreddit': subreddit,
                'body': body,
                'upvotes': upvotes,
                'comments': comments_count,
                'flair': flair,
                'created_utc': timestamp,
                'fetched_at': datetime.now().isoformat()
            }
            
            threads.append(thread)
            
        except Exception as e:
            print(f"Error parsing thread: {str(e)}")
            continue
    
    return threads

def fetch_subreddit_threads(subreddit: str, sort_mode: str = 'hot') -> List[Dict[str, Any]]:
    """
    Fetch threads from a subreddit
    
    Args:
        subreddit: Subreddit name without the r/ prefix
        sort_mode: Sorting mode (hot, new, top, rising)
        
    Returns:
        List of threads
    """
    valid_modes = ['hot', 'new', 'top', 'rising']
    if sort_mode not in valid_modes:
        sort_mode = 'hot'  # Default to hot
    
    url = f'https://www.reddit.com/r/{subreddit}/{sort_mode}/'
    print(f"Fetching threads from {url}")
    
    html = make_request(url)
    if not html:
        print(f"Failed to fetch {url}")
        return []
    
    threads = parse_reddit_thread(html, f"r/{subreddit}")
    return threads

def save_raw_threads(threads: List[Dict[str, Any]]):
    """Save threads to raw data file, appending to existing data."""
    existing_threads = []
    
    # Load existing data if file exists
    if os.path.exists(RAW_DATA_PATH):
        try:
            with open(RAW_DATA_PATH, 'r') as f:
                existing_threads = json.load(f)
        except json.JSONDecodeError:
            # If file is corrupted, start fresh
            existing_threads = []
    
    # Get IDs of existing threads
    existing_ids = set(thread.get('id') for thread in existing_threads)
    
    # Add only new threads
    for thread in threads:
        if thread.get('id') not in existing_ids:
            existing_threads.append(thread)
    
    # Save merged data
    with open(RAW_DATA_PATH, 'w') as f:
        json.dump(existing_threads, f, indent=2)
    
    print(f"Saved {len(threads)} new threads. Total: {len(existing_threads)} threads.")
    return existing_threads

def fetch_multiple_subreddits(subreddits: List[str], sort_modes: List[str] = None) -> List[Dict[str, Any]]:
    """
    Fetch threads from multiple subreddits with different sort modes
    
    Args:
        subreddits: List of subreddit names without r/ prefix
        sort_modes: List of sort modes to use
        
    Returns:
        Combined list of threads
    """
    if sort_modes is None:
        sort_modes = ['hot', 'new', 'top']
    
    all_threads = []
    
    for subreddit in subreddits:
        for mode in sort_modes:
            print(f"Fetching r/{subreddit} - {mode}")
            threads = fetch_subreddit_threads(subreddit, mode)
            all_threads.extend(threads)
            
            # Add delay between requests to avoid rate limiting
            delay = random.uniform(2, 5)
            print(f"Waiting {delay:.2f} seconds before next request...")
            time.sleep(delay)
    
    return all_threads

def main():
    """Main entry point for the script."""
    # List of subreddits to scrape
    subreddits = ['SaaS', 'Blogging', 'SEO', 'contentmarketing', 'marketing', 'startups']
    
    # Fetch threads
    all_threads = fetch_multiple_subreddits(subreddits)
    
    # Save raw data
    save_raw_threads(all_threads)
    
    print(f"Completed scraping {len(all_threads)} threads from {len(subreddits)} subreddits.")

if __name__ == '__main__':
    main()