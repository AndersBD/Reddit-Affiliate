#!/usr/bin/env python3
"""
Keyword Matcher for Reddit Opportunities

This module analyzes scraped Reddit threads and matches them against affiliate keywords.
It scores opportunities based on relevance, intent, and potential for affiliate marketing.
"""

import json
import os
import re
from typing import List, Dict, Any, Tuple
from datetime import datetime
import random
from tinydb import TinyDB, Query

# Constants
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'crawler', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

RAW_DATA_PATH = os.path.join(DATA_DIR, 'threads_raw.json')
OPPORTUNITIES_PATH = os.path.join(DATA_DIR, 'opportunities.json')
DB_PATH = os.path.join(DATA_DIR, 'affiliate_data.json')

# Intent patterns
INTENT_PATTERNS = {
    'DISCOVERY': [
        r'best .*for', r'recommend .* (for|to)', r'looking for .* (that|which|to)', 
        r'what .* (should|would|could|is best)', r'suggest', r'advice', r'help.*choose',
        r'good .* for', r'need .* recommendation'
    ],
    'COMPARISON': [
        r'(vs|versus|or|\bor\b)', r'compare', r'difference between', r'which is better',
        r'(better|worse) than', r'(alternative|comparison)'
    ],
    'SHOWCASE': [
        r'(just|finally) .* (made|created|launched|finished|completed)', r'check out my',
        r'I made', r'look what', r'sharing my', r'I built', r'I created'
    ],
    'QUESTION': [
        r'how (do|to|can|should)', r'what is', r'\?$', r'(question|confused|help|advice) .* (about|with|on|for)',
        r'problem with', r'trouble with', r'issue with'
    ]
}

# Setup TinyDB for storing affiliate programs and keywords
db = TinyDB(DB_PATH)
affiliate_programs_table = db.table('affiliate_programs')
keywords_table = db.table('keywords')
subreddits_table = db.table('subreddits')

def setup_sample_data():
    """Initialize sample data if tables are empty."""
    # Only add if tables are empty
    if not affiliate_programs_table.all():
        affiliate_programs_table.insert_multiple([
            {
                'id': 1,
                'name': 'WriterAI',
                'description': 'AI writing assistant for content creators',
                'commission': '30%',
                'category': 'Content Creation',
                'target_audience': 'Bloggers, content marketers, writers',
                'keywords': ['AI writer', 'writing assistant', 'content generation', 'blog writing']
            },
            {
                'id': 2,
                'name': 'GamingGear',
                'description': 'Gaming peripherals and accessories',
                'commission': '15%',
                'category': 'Gaming',
                'target_audience': 'Gamers, streamers, e-sports enthusiasts',
                'keywords': ['gaming mouse', 'mechanical keyboard', 'gaming headset', 'gaming chair']
            }
        ])
    
    if not keywords_table.all():
        keywords_table.insert_multiple([
            {'id': 1, 'keyword': 'best gaming mouse', 'affiliate_program_id': 2, 'status': 'active'},
            {'id': 2, 'keyword': 'AI writer review', 'affiliate_program_id': 1, 'status': 'active'},
            {'id': 3, 'keyword': 'content generation tool', 'affiliate_program_id': 1, 'status': 'active'},
            {'id': 4, 'keyword': 'mechanical keyboard comparison', 'affiliate_program_id': 2, 'status': 'active'}
        ])
    
    if not subreddits_table.all():
        subreddits_table.insert_multiple([
            {'id': 1, 'name': 'r/Blogging', 'category': 'Content Creation', 'subscriber_count': 150000},
            {'id': 2, 'name': 'r/SEO', 'category': 'Marketing', 'subscriber_count': 175000},
            {'id': 3, 'name': 'r/contentmarketing', 'category': 'Marketing', 'subscriber_count': 90000},
            {'id': 4, 'name': 'r/GamingMouse', 'category': 'Gaming', 'subscriber_count': 50000},
            {'id': 5, 'name': 'r/MechanicalKeyboards', 'category': 'Gaming', 'subscriber_count': 700000},
        ])

def detect_thread_intent(title: str, body: str) -> str:
    """
    Detect the intent of a Reddit thread based on title and body patterns
    
    Args:
        title: Thread title
        body: Thread body/content
        
    Returns:
        Intent type: DISCOVERY, COMPARISON, SHOWCASE, QUESTION, or GENERAL
    """
    # Combine title and body for matching, prioritizing title
    text = f"{title.lower()} {body.lower() if body else ''}"
    
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return intent
    
    return "GENERAL"

def match_affiliate_keywords(title: str, body: str, subreddit: str) -> List[Dict[str, Any]]:
    """
    Match thread content against affiliate keywords and programs
    
    Args:
        title: Thread title
        body: Thread body/content
        subreddit: Subreddit name
        
    Returns:
        List of matching affiliate programs with match details
    """
    # Get all keywords
    all_keywords = keywords_table.all()
    matches = []
    
    # Combine title and body for matching
    text = f"{title.lower()} {body.lower() if body else ''}"
    
    for keyword_entry in all_keywords:
        keyword = keyword_entry['keyword'].lower()
        
        # Simple keyword matching (could be improved with NLP)
        if keyword in text:
            # Get the affiliate program for this keyword
            program = affiliate_programs_table.get(doc_id=keyword_entry['affiliate_program_id'])
            if program:
                # Calculate match strength (basic implementation)
                title_match = keyword in title.lower()
                count = text.count(keyword)
                strength = 0.7 if title_match else 0.4
                strength += min(0.3, count * 0.1)  # Increase slightly with frequency
                
                # Check if subreddit is relevant to program category
                relevant_subreddits = subreddits_table.search(
                    Query().category == program['category']
                )
                subreddit_relevant = any(s['name'].lower() == subreddit.lower() for s in relevant_subreddits)
                if subreddit_relevant:
                    strength += 0.2
                
                matches.append({
                    'keyword': keyword,
                    'program': program,
                    'strength': min(1.0, strength),  # Cap at 1.0
                    'title_match': title_match,
                    'count': count,
                    'subreddit_relevant': subreddit_relevant
                })
    
    return matches

def calculate_opportunity_score(
    thread: Dict[str, Any], 
    intent: str, 
    affiliate_matches: List[Dict[str, Any]]
) -> float:
    """
    Calculate opportunity score (0-100) based on various factors
    
    Args:
        thread: Reddit thread data
        intent: Detected intent
        affiliate_matches: List of affiliate match data
        
    Returns:
        Opportunity score from 0-100
    """
    base_score = 50  # Start at middle
    
    # Upvotes factor (0-15 points)
    upvotes = thread.get('upvotes', 0)
    upvote_score = min(15, upvotes / 20)  # Cap at 15 points
    
    # Comments factor (0-10 points)
    comments = thread.get('comments', 0)
    comment_score = min(10, comments / 5)  # Cap at 10 points
    
    # Intent factor (0-25 points)
    intent_scores = {
        'DISCOVERY': 25,    # Highest value - explicitly looking for recommendations
        'COMPARISON': 20,   # Comparing options - good for affiliate
        'QUESTION': 15,     # Asking questions - might be receptive to solutions
        'SHOWCASE': 5,      # Showing off - less receptive to recommendations
        'GENERAL': 10       # General discussion - moderate opportunity
    }
    intent_score = intent_scores.get(intent, 10)
    
    # Affiliate match factor (0-40 points)
    match_score = 0
    if affiliate_matches:
        # Take the highest match strength
        best_match = max(affiliate_matches, key=lambda x: x['strength'])
        match_score = best_match['strength'] * 40
    
    # Fresh content bonus (0-10 points)
    created_str = thread.get('created_utc', '')
    try:
        created_date = datetime.fromisoformat(created_str)
        now = datetime.now()
        age_hours = (now - created_date).total_seconds() / 3600
        freshness_score = max(0, 10 - (age_hours / 24))  # Newer is better
    except (ValueError, TypeError):
        freshness_score = 5  # Default if date parsing fails
    
    # Calculate total score
    total_score = base_score + upvote_score + comment_score + intent_score + match_score + freshness_score
    
    # Normalize to 0-100 range
    normalized_score = min(100, max(0, total_score))
    
    return normalized_score

def determine_action_type(score: float, intent: str) -> str:
    """
    Determine whether to comment or create a post based on opportunity score
    
    Args:
        score: Opportunity score
        intent: Thread intent
        
    Returns:
        'comment' or 'post'
    """
    # High scores or DISCOVERY/COMPARISON intents favor comments
    if score >= 70 or intent in ['DISCOVERY', 'COMPARISON', 'QUESTION']:
        return 'comment'
    # Lower scores or other intents might be better for creating new posts
    else:
        return 'post'

def process_threads_to_opportunities():
    """
    Process raw Reddit threads and create opportunities
    """
    # Ensure we have sample data
    setup_sample_data()
    
    # Load raw threads
    if not os.path.exists(RAW_DATA_PATH):
        print(f"Raw data file not found: {RAW_DATA_PATH}")
        return []
    
    with open(RAW_DATA_PATH, 'r') as f:
        threads = json.load(f)
    
    opportunities = []
    
    for thread in threads:
        # Extract thread data
        title = thread.get('title', '')
        body = thread.get('body', '')
        subreddit = thread.get('subreddit', '')
        
        # Skip if missing critical data
        if not title or not subreddit:
            continue
        
        # Detect intent
        intent = detect_thread_intent(title, body)
        
        # Match with affiliate keywords
        affiliate_matches = match_affiliate_keywords(title, body, subreddit)
        
        # Skip if no matches found
        if not affiliate_matches:
            continue
        
        # Calculate opportunity score
        score = calculate_opportunity_score(thread, intent, affiliate_matches)
        
        # Determine action type
        action_type = determine_action_type(score, intent)
        
        # Create opportunity object
        opportunity = {
            'thread_id': thread.get('id', ''),
            'title': title,
            'body': body[:500] + '...' if len(body) > 500 else body,  # Truncate long bodies
            'subreddit': subreddit,
            'url': thread.get('url', ''),
            'upvotes': thread.get('upvotes', 0),
            'comments': thread.get('comments', 0),
            'created_utc': thread.get('created_utc', ''),
            'fetched_at': thread.get('fetched_at', datetime.now().isoformat()),
            'intent': intent,
            'affiliate_matches': [
                {
                    'keyword': match['keyword'],
                    'program_name': match['program']['name'],
                    'program_id': match['program']['id'],
                    'match_strength': match['strength']
                }
                for match in affiliate_matches
            ],
            'opportunity_score': score,
            'action_type': action_type,
            'priority': 'high' if score >= 80 else 'medium' if score >= 60 else 'low',
            'status': 'new',
            'processed_at': datetime.now().isoformat()
        }
        
        opportunities.append(opportunity)
    
    # Sort by opportunity score (descending)
    opportunities.sort(key=lambda x: x['opportunity_score'], reverse=True)
    
    # Save opportunities
    save_opportunities(opportunities)
    
    return opportunities

def save_opportunities(opportunities: List[Dict[str, Any]]):
    """Save opportunities to JSON file."""
    existing_opportunities = []
    
    # Load existing data if file exists
    if os.path.exists(OPPORTUNITIES_PATH):
        try:
            with open(OPPORTUNITIES_PATH, 'r') as f:
                existing_opportunities = json.load(f)
        except json.JSONDecodeError:
            existing_opportunities = []
    
    # Get existing thread IDs
    existing_ids = set(opp.get('thread_id') for opp in existing_opportunities)
    
    # Add only new opportunities
    new_count = 0
    for opp in opportunities:
        if opp.get('thread_id') not in existing_ids:
            existing_opportunities.append(opp)
            existing_ids.add(opp.get('thread_id'))
            new_count += 1
    
    # Save merged data
    with open(OPPORTUNITIES_PATH, 'w') as f:
        json.dump(existing_opportunities, f, indent=2)
    
    print(f"Saved {new_count} new opportunities. Total: {len(existing_opportunities)} opportunities.")

def main():
    """Main entry point for the script."""
    print("Processing threads to find affiliate opportunities...")
    opportunities = process_threads_to_opportunities()
    print(f"Found {len(opportunities)} opportunities.")
    
    # Print top 5 opportunities for preview
    top_opps = opportunities[:5]
    for i, opp in enumerate(top_opps, 1):
        print(f"\nTop Opportunity #{i} (Score: {opp['opportunity_score']:.1f}):")
        print(f"  Title: {opp['title']}")
        print(f"  Subreddit: {opp['subreddit']}")
        print(f"  Intent: {opp['intent']}")
        print(f"  Action: {opp['action_type'].upper()}")
        print(f"  Matched: {', '.join(m['program_name'] for m in opp['affiliate_matches'])}")

if __name__ == "__main__":
    main()