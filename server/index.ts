import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db";
import session from "express-session";
import { randomBytes } from "crypto";
import { PORT, SESSION_CONFIG } from "./config";
import { initializeCrawlerIntegration } from "./services/crawler-integration";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up session middleware with secure cookie
app.use(session({
  ...SESSION_CONFIG,
  name: 'reddit_auth_session',
  cookie: {
    ...SESSION_CONFIG.cookie,
    httpOnly: true
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize the database
  try {
    await initializeDatabase();
    log('Database initialized successfully');
  } catch (error) {
    log(`Error initializing database: ${error}`, 'error');
  }
  
  // Initialize the Reddit crawler integration
  try {
    await initializeCrawlerIntegration();
    log('Reddit crawler integration initialized successfully');
  } catch (error) {
    log(`Error initializing Reddit crawler integration: ${error}`, 'error');
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use centralized port configuration from config.ts (5000)
  // This serves both the API and the client
  server.listen({
    port: PORT,
    host: "0.0.0.0",
  }).on('error', (err: any) => {
    // Some error occurred
    log(`Server failed to start: ${err.message}`);
    throw err;
  }).on('listening', () => {
    log(`serving on port ${PORT}`);
  });
})();