# API Documentation

This document outlines the API endpoints available in the Reddit Affiliate Marketing Automation platform.

## Base URL

All endpoints are relative to the base URL: `/api`

## Authentication

Currently, the API does not require authentication as it is designed for a single user. Multi-user authentication will be implemented in a future release.

## Endpoints

### Dashboard Statistics

#### Get Performance Summary

```
GET /api/stats
```

Returns overall performance metrics including active campaigns, clicks, conversions, and revenue.

**Response:**
```json
{
  "activeCampaigns": 2,
  "monthlyClicks": 825,
  "conversions": 42,
  "conversionRate": 5.09,
  "revenue": 2104.5
}
```

#### Get Performance Metrics

```
GET /api/performance
```

Returns detailed performance metrics over time.

**Response:**
```json
[
  {
    "campaignId": 1,
    "date": "2025-03-21T19:47:00.000Z",
    "clicks": 75,
    "impressions": 1245,
    "conversions": 4,
    "revenue": 210.5
  },
  ...
]
```

#### Get Top Subreddits

```
GET /api/top-subreddits
```

Returns the top performing subreddits by clicks.

**Response:**
```json
[
  {
    "subreddit": "r/SaaS",
    "clicks": 1245
  },
  ...
]
```

### Compliance

#### Get Compliance Status

```
GET /api/compliance-status
```

Returns the current compliance status of the platform.

**Response:**
```json
{
  "status": "compliant",
  "apiRateLimit": {
    "remaining": 85,
    "resetAt": "2025-03-21T20:47:00.000Z"
  },
  "issuesFound": 0
}
```

### Campaign Management

#### Get All Campaigns

```
GET /api/campaigns
```

Returns a list of all campaigns.

**Response:**
```json
[
  {
    "name": "AI Writing Assistant Pro",
    "affiliateProgramId": 1,
    "status": "active",
    "id": 1,
    "targetSubreddits": [
      "writing",
      "blogging",
      "freelanceWriters"
    ],
    "schedule": {
      "frequency": "weekly",
      "daysOfWeek": [1, 3, 5],
      "timeOfDay": "18:00"
    }
  },
  ...
]
```

#### Create Campaign

```
POST /api/campaigns
```

Creates a new campaign.

**Request Body:**
```json
{
  "name": "New Campaign",
  "affiliateProgramId": 1,
  "status": "active",
  "targetSubreddits": ["subreddit1", "subreddit2"],
  "schedule": {
    "frequency": "weekly",
    "daysOfWeek": [1, 3, 5],
    "timeOfDay": "18:00"
  }
}
```

**Response:**
```json
{
  "id": 3,
  "name": "New Campaign",
  "affiliateProgramId": 1,
  "status": "active",
  "targetSubreddits": ["subreddit1", "subreddit2"],
  "schedule": {
    "frequency": "weekly",
    "daysOfWeek": [1, 3, 5],
    "timeOfDay": "18:00"
  },
  "createdAt": "2025-03-21T20:00:00.000Z"
}
```

#### Update Campaign

```
PATCH /api/campaigns/:id
```

Updates an existing campaign.

**Request Body:**
```json
{
  "status": "paused"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "AI Writing Assistant Pro",
  "affiliateProgramId": 1,
  "status": "paused",
  "targetSubreddits": ["writing", "blogging", "freelanceWriters"],
  "schedule": {
    "frequency": "weekly",
    "daysOfWeek": [1, 3, 5],
    "timeOfDay": "18:00"
  },
  "createdAt": "2025-03-21T19:47:00.000Z"
}
```

#### Delete Campaign

```
DELETE /api/campaigns/:id
```

Deletes a campaign.

**Response:**
```json
{
  "success": true
}
```

### Affiliate Programs

#### Get All Affiliate Programs

```
GET /api/affiliate-programs
```

Returns a list of all affiliate programs.

**Response:**
```json
[
  {
    "name": "WriterAI",
    "description": "AI-powered writing assistant platform",
    "website": "https://writerai.com",
    "commissionRate": 30,
    "commissionType": "percentage",
    "payoutThreshold": 50,
    "payoutFrequency": "monthly",
    "category": "SaaS",
    "active": true,
    "id": 1,
    "createdAt": "2025-03-21T19:47:00.000Z"
  },
  ...
]
```

Additional endpoints follow similar patterns for creating, updating, and deleting affiliate programs.

### Scheduling

#### Get Scheduled Posts

```
GET /api/scheduled-posts
```

Returns a list of all scheduled posts.

**Response:**
```json
[
  {
    "id": 1,
    "title": "How I overcame writer's block with AI assistance",
    "subreddit": "writing",
    "scheduledTime": "2025-03-21T20:00:00.000Z",
    "status": "scheduled",
    "campaignId": 1
  },
  ...
]
```

#### Schedule a Post

```
POST /api/schedule-post/:id
```

Schedules a post for publication.

**Request Body:**
```json
{
  "scheduledTime": "2025-03-22T15:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true
}
```

#### Cancel Scheduled Post

```
POST /api/cancel-scheduled-post/:id
```

Cancels a scheduled post.

**Response:**
```json
{
  "success": true
}
```

### Content Generation

#### Generate Content

```
POST /api/generate-content
```

Generates content for a Reddit post.

**Request Body:**
```json
{
  "campaignId": 1,
  "subreddit": "writing",
  "contentType": "post"
}
```

**Response:**
```json
{
  "title": "Generated Title",
  "content": "Generated content for the post...",
  "affiliateLink": "https://writerai.com/?ref=123",
  "targetKeywords": ["writing", "AI", "productivity"]
}
```

#### Check Content Compliance

```
POST /api/check-compliance
```

Checks content for compliance with Reddit and affiliate program rules.

**Request Body:**
```json
{
  "content": "Content to check...",
  "subreddit": "writing"
}
```

**Response:**
```json
{
  "compliant": true,
  "issues": [],
  "score": 95,
  "recommendations": []
}
```

### Activities

#### Get Activities

```
GET /api/activities
```

Returns a list of recent activities.

**Response:**
```json
[
  {
    "campaignId": 1,
    "type": "post_published",
    "message": "Successfully published post to r/writing",
    "details": {
      "postId": "abc123",
      "title": "How I overcame writer's block with AI assistance"
    },
    "id": 1,
    "timestamp": "2025-03-21T19:47:00.000Z"
  },
  ...
]
```

## Error Handling

The API returns standard HTTP status codes:

- 200: Success
- 400: Bad Request
- 404: Not Found
- 500: Server Error

Error responses include a message field explaining the error:

```json
{
  "error": "Campaign not found",
  "status": 404
}
```