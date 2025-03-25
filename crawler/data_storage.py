#!/usr/bin/env python3
"""
Data Storage Module for Reddit Crawler

This module handles persistence, database access, and data conversion
for the Reddit opportunity crawler system.
"""

import json
import os
import time
from typing import List, Dict, Any, Optional
from datetime import datetime
from tinydb import TinyDB, Query

# Constants
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'crawler', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

RAW_DATA_PATH = os.path.join(DATA_DIR, 'threads_raw.json')
OPPORTUNITIES_PATH = os.path.join(DATA_DIR, 'opportunities.json')
DB_PATH = os.path.join(DATA_DIR, 'affiliate_data.json')

# Initialize TinyDB
db = TinyDB(DB_PATH)
opportunities_table = db.table('opportunities')

def save_to_db(opportunities: List[Dict[str, Any]]) -> int:
    """
    Save opportunities to TinyDB
    
    Args:
        opportunities: List of opportunity objects
        
    Returns:
        Number of new records inserted
    """
    Thread = Query()
    new_count = 0
    
    for opp in opportunities:
        # Check if this thread is already in the DB
        existing = opportunities_table.get(Thread.thread_id == opp.get('thread_id'))
        
        if not existing:
            # Insert new record
            opportunities_table.insert(opp)
            new_count += 1
        else:
            # Update existing record if score or other relevant fields have changed
            if (opp.get('opportunity_score') != existing.get('opportunity_score') or
                opp.get('action_type') != existing.get('action_type') or
                opp.get('status') == 'new'):  # Always update new status opportunities
                
                opportunities_table.update(opp, Thread.thread_id == opp.get('thread_id'))
    
    return new_count

def get_opportunities(
    limit: Optional[int] = None,
    status: Optional[str] = None,
    min_score: Optional[float] = None,
    subreddit: Optional[str] = None,
    action_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get opportunities with optional filtering
    
    Args:
        limit: Maximum number of results
        status: Filter by status (new, queued, processed, ignored)
        min_score: Minimum opportunity score
        subreddit: Filter by subreddit
        action_type: Filter by action type (comment, post)
        
    Returns:
        List of opportunity objects
    """
    Thread = Query()
    query_parts = []
    
    # Build query
    if status:
        query_parts.append(Thread.status == status)
    
    if min_score is not None:
        query_parts.append(Thread.opportunity_score >= min_score)
    
    if subreddit:
        query_parts.append(Thread.subreddit == subreddit)
    
    if action_type:
        query_parts.append(Thread.action_type == action_type)
    
    # Execute query
    if query_parts:
        # Combine all conditions with AND
        result = opportunities_table.search(
            query_parts[0] if len(query_parts) == 1 else 
            (query_parts[0] & query_parts[1] if len(query_parts) == 2 else
             (query_parts[0] & query_parts[1] & query_parts[2]) if len(query_parts) == 3 else
             (query_parts[0] & query_parts[1] & query_parts[2] & query_parts[3]))
        )
    else:
        result = opportunities_table.all()
    
    # Sort by opportunity score (highest first)
    result.sort(key=lambda x: x.get('opportunity_score', 0), reverse=True)
    
    # Apply limit
    if limit:
        result = result[:limit]
    
    return result

def update_opportunity_status(thread_id: str, status: str) -> bool:
    """
    Update the status of an opportunity
    
    Args:
        thread_id: Thread ID
        status: New status (new, queued, processed, ignored)
        
    Returns:
        True if successful, False otherwise
    """
    Thread = Query()
    result = opportunities_table.update({'status': status}, Thread.thread_id == thread_id)
    return len(result) > 0

def get_top_opportunities(count: int = 10) -> List[Dict[str, Any]]:
    """
    Get top opportunities by score
    
    Args:
        count: Number of opportunities to return
        
    Returns:
        List of top opportunities
    """
    opps = opportunities_table.all()
    opps.sort(key=lambda x: x.get('opportunity_score', 0), reverse=True)
    return opps[:count]

def export_to_json() -> str:
    """
    Export all opportunities to a JSON file
    
    Returns:
        Path to the exported file
    """
    opps = opportunities_table.all()
    export_path = os.path.join(DATA_DIR, f'export_{int(time.time())}.json')
    
    with open(export_path, 'w') as f:
        json.dump(opps, f, indent=2)
    
    return export_path

def import_from_json(file_path: str) -> int:
    """
    Import opportunities from a JSON file
    
    Args:
        file_path: Path to the JSON file
        
    Returns:
        Number of imported records
    """
    try:
        with open(file_path, 'r') as f:
            opps = json.load(f)
        
        if not isinstance(opps, list):
            print(f"Error: Expected a list of opportunities, got {type(opps)}")
            return 0
        
        return save_to_db(opps)
        
    except Exception as e:
        print(f"Error importing from {file_path}: {str(e)}")
        return 0

def sync_opportunities_from_file() -> int:
    """
    Synchronize opportunities from the opportunities.json file to TinyDB
    
    Returns:
        Number of new records imported
    """
    if not os.path.exists(OPPORTUNITIES_PATH):
        print(f"Opportunities file not found: {OPPORTUNITIES_PATH}")
        return 0
    
    try:
        with open(OPPORTUNITIES_PATH, 'r') as f:
            opps = json.load(f)
        
        return save_to_db(opps)
        
    except Exception as e:
        print(f"Error syncing from {OPPORTUNITIES_PATH}: {str(e)}")
        return 0

def main():
    """Main entry point for testing."""
    print("Syncing opportunities from file to database...")
    new_count = sync_opportunities_from_file()
    print(f"Imported {new_count} new opportunities.")
    
    # Print some stats
    total = len(opportunities_table.all())
    new_opps = len(opportunities_table.search(Query().status == 'new'))
    processed = len(opportunities_table.search(Query().status == 'processed'))
    
    print(f"\nDatabase Statistics:")
    print(f"  Total opportunities: {total}")
    print(f"  New opportunities: {new_opps}")
    print(f"  Processed opportunities: {processed}")
    
    # Show top 3 opportunities
    top = get_top_opportunities(3)
    print("\nTop 3 Opportunities:")
    for i, opp in enumerate(top, 1):
        print(f"  {i}. {opp.get('title')} (Score: {opp.get('opportunity_score'):.1f})")

if __name__ == "__main__":
    main()