# Reddit Affiliate Marketing Automation Platform

An AI-powered affiliate marketing platform specializing in Reddit content generation and campaign optimization.

## Features

- 📊 **Dashboard Analytics**: Track campaign performance, clicks, conversions, and revenue
- 🤖 **AI Content Generation**: Create engaging Reddit posts and comments optimized for conversion
- 📅 **Automated Scheduling**: Plan and schedule posts for maximum engagement
- 🔍 **Compliance Monitoring**: Ensure content follows Reddit guidelines and affiliate program rules
- 📈 **Performance Tracking**: Monitor campaign metrics and optimize for better results
- 🔄 **Multiple Campaign Management**: Handle multiple affiliate programs simultaneously

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, shadcn UI components
- **Backend**: Node.js, Express
- **AI Integration**: OpenAI API for content generation
- **State Management**: React Query
- **Testing**: Vitest, React Testing Library
- **Design**: Responsive design with light/dark theme support

## Getting Started

### Prerequisites

- Node.js 20.x or later
- OpenAI API key
- GitHub token (for CI/CD)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AndersBD/Reddit-Affiliate.git
   cd Reddit-Affiliate
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   GITHUB_TOKEN=your_github_token
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5000`

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Frontend utilities
│   │   ├── pages/        # Application pages
│   │   └── App.tsx       # Main application component
├── server/               # Backend Express application
│   ├── services/         # Backend services
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage interfaces
│   └── vite.ts           # Vite server integration
├── shared/               # Shared code between frontend and backend
│   └── schema.ts         # Database schema and types
└── tests/                # Test files
```

## Development Workflow

- **Development**: `npm run dev` - Starts both frontend and backend
- **Build**: `npm run build` - Builds production-ready application
- **Testing**: `npm test` - Runs test suite
- **Linting**: `npm run lint` - Checks code quality

## CI/CD

This project uses GitHub Actions for continuous integration and deployment. The workflow runs daily and on pushes to the main branch, performing the following steps:

1. Code linting
2. Running tests
3. Building the application

## License

This project is licensed under the MIT License - see the LICENSE file for details.