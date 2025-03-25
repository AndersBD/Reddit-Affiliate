#!/usr/bin/env python3
"""
Reddit Opportunity Crawler - Main Runner

This script ties together all the crawler components to:
1. Scrape Reddit posts
2. Match them against affiliate keywords
3. Score and save opportunities
4. Make them available for the Node.js server
"""

import os
import sys
import time
import json
import argparse
from datetime import datetime, timedelta

# Add the project root to the Python path so we can import the crawler modules
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from crawler.reddit_scraper import fetch_multiple_subreddits, save_raw_threads
from crawler.keyword_matcher import process_threads_to_opportunities
from crawler.data_storage import sync_opportunities_from_file, get_top_opportunities

# Constants
DATA_DIR = os.path.join(project_root, 'crawler', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

LOG_FILE = os.path.join(DATA_DIR, 'crawler_log.txt')
STATUS_FILE = os.path.join(DATA_DIR, 'status.json')

def log_message(message: str):
    """Log a message to the log file and console."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_line = f"[{timestamp}] {message}"
    
    print(log_line)
    
    with open(LOG_FILE, 'a') as f:
        f.write(log_line + '\n')

def update_status(status: str, details: dict = None):
    """Update the crawler status file."""
    status_data = {
        'status': status,
        'last_updated': datetime.now().isoformat(),
        'details': details or {}
    }
    
    with open(STATUS_FILE, 'w') as f:
        json.dump(status_data, f, indent=2)

def check_last_run() -> bool:
    """
    Check if enough time has passed since the last run
    
    Returns:
        True if we should run again, False otherwise
    """
    try:
        if os.path.exists(STATUS_FILE):
            with open(STATUS_FILE, 'r') as f:
                status_data = json.load(f)
            
            last_updated = datetime.fromisoformat(status_data.get('last_updated', '2000-01-01T00:00:00'))
            time_since_last = datetime.now() - last_updated
            
            # Only run if it's been at least 1 hour since the last run
            return time_since_last.total_seconds() >= 3600
        
        return True
    except Exception:
        return True

def run_full_crawler(force: bool = False, subreddits: list = None):
    """
    Run the full crawler pipeline
    
    Args:
        force: Force run even if it hasn't been long enough since last run
        subreddits: List of subreddits to scrape (without r/ prefix)
    """
    if not force and not check_last_run():
        log_message("Skipping crawler run - not enough time since last run")
        return False
    
    try:
        start_time = time.time()
        log_message("Starting Reddit opportunity crawler")
        update_status('running', {'start_time': datetime.now().isoformat()})
        
        # Default subreddits if none provided
        if not subreddits:
            subreddits = [
                'SaaS', 'Blogging', 'SEO', 'contentmarketing', 'marketing', 
                'startups', 'SmallBusiness', 'Entrepreneur', 'webdev', 'programming'
            ]
        
        # Step 1: Scrape Reddit
        log_message(f"Scraping {len(subreddits)} subreddits: {', '.join(subreddits)}")
        threads = fetch_multiple_subreddits(subreddits, ['hot', 'new'])
        log_message(f"Found {len(threads)} threads")
        save_raw_threads(threads)
        
        # Step 2: Process opportunities
        log_message("Processing threads to find affiliate opportunities")
        opportunities = process_threads_to_opportunities()
        log_message(f"Identified {len(opportunities)} potential opportunities")
        
        # Step 3: Sync to database
        log_message("Syncing opportunities to database")
        new_count = sync_opportunities_from_file()
        log_message(f"Added {new_count} new opportunities to database")
        
        # Step 4: Show top opportunities
        top_opps = get_top_opportunities(5)
        log_message("\nTop 5 Opportunities:")
        for i, opp in enumerate(top_opps, 1):
            log_message(f"  {i}. {opp.get('title')} (Score: {opp.get('opportunity_score'):.1f}, Subreddit: {opp.get('subreddit')})")
        
        # Complete
        elapsed = time.time() - start_time
        log_message(f"Crawler completed in {elapsed:.2f} seconds")
        
        update_status('completed', {
            'threads_found': len(threads),
            'opportunities_found': len(opportunities),
            'new_opportunities': new_count,
            'elapsed_seconds': elapsed,
            'completion_time': datetime.now().isoformat()
        })
        
        return True
        
    except Exception as e:
        log_message(f"Error in crawler: {str(e)}")
        update_status('error', {'error': str(e)})
        return False

def main():
    """Main entry point with argument parsing."""
    parser = argparse.ArgumentParser(description='Reddit Opportunity Crawler')
    parser.add_argument('--force', action='store_true', help='Force run even if run recently')
    parser.add_argument('--subreddits', nargs='+', help='List of subreddits to scrape (without r/ prefix)')
    args = parser.parse_args()
    
    run_full_crawler(force=args.force, subreddits=args.subreddits)

if __name__ == "__main__":
    main()