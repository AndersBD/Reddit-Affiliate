# Architecture Overview

This document provides an overview of the architecture of the Reddit Affiliate Marketing Automation platform.

## System Architecture

The application follows a client-server architecture:

```
                 ┌─────────────────┐
                 │                 │
                 │   React Client  │
                 │                 │
                 └────────┬────────┘
                          │
                          │ HTTP/JSON
                          │
                 ┌────────▼────────┐
                 │                 │
                 │  Express Server │
                 │                 │
                 └──┬─────────┬────┘
                    │         │
          ┌─────────▼─┐    ┌──▼───────────┐
          │           │    │              │
          │  Storage  │    │ External APIs│
          │           │    │              │
          └───────────┘    └──────────────┘
```

### Frontend Architecture

The frontend is built with React and uses the following key technologies:

- **React**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn UI**: Component library
- **React Query**: State management and API interactions
- **Wouter**: Routing

The frontend is organized into the following main directories:

- **components**: Reusable UI components
- **hooks**: Custom React hooks
- **lib**: Utility functions and API client
- **pages**: Page components for each route

### Backend Architecture

The backend is built with Node.js and Express and uses the following key technologies:

- **Node.js**: Runtime environment
- **Express**: Web framework
- **TypeScript**: Type safety
- **OpenAI API**: AI content generation
- **node-schedule**: Task scheduling

The backend is organized into the following main directories:

- **server**: Main server code
  - **services**: Business logic organized by domain
  - **routes.ts**: API endpoint definitions
  - **storage.ts**: Data storage interface
  - **index.ts**: Server entry point

### Data Flow

1. The React frontend sends requests to the backend API
2. The Express server processes these requests
3. The server uses the storage interface to interact with the database
4. For content generation, the server communicates with the OpenAI API
5. For Reddit interactions, the server will communicate with the Reddit API (future implementation)
6. The server responds to the frontend with the requested data
7. React Query caches the response and updates the UI

## Core Components

### Storage Interface

The storage interface (`IStorage`) provides a consistent API for data access regardless of the underlying storage mechanism. The current implementation uses in-memory storage (`MemStorage`), but this can be replaced with a database implementation without changing the rest of the application.

### Services

The application uses service modules to encapsulate business logic:

- **OpenAI Service**: Handles AI content generation
- **Reddit Service**: Manages interactions with Reddit (posting, commenting, etc.)
- **Scheduler Service**: Manages scheduling of posts

### State Management

The frontend uses React Query for state management, with the following benefits:

- Automatic caching
- Optimistic updates
- Background refetching
- Request deduplication
- Prefetching

## Authentication and Authorization

Currently, the application is designed for a single user and does not implement authentication. Future versions will add multi-user support with proper authentication and authorization.

## Scalability Considerations

The current architecture can scale to handle increased load through:

- Horizontal scaling of the Express server
- Replacing in-memory storage with a distributed database
- Implementing caching for frequently accessed data
- Using a message queue for asynchronous processing of tasks

## Future Enhancements

Planned architectural improvements include:

- Converting to a microservices architecture
- Implementing a database for persistent storage
- Adding authentication and multi-user support
- Implementing a proper job queue for scheduled tasks