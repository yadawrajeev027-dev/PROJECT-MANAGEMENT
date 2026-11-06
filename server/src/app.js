import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import apiRoutes from './routes/index.js';
import notFoundHandler from './middleware/notFoundMiddleware.js';
import errorHandler from './middleware/errorMiddleware.js';

const app = express();

/* ---------------- Security & Parsing Middlewares ---------------- */

// Set security HTTP response headers with cross-origin resource policy enabled for Vercel/Render separation
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Normalize configured client origins from CLIENT_URL, FRONTEND_URL, or localhost default
const rawClientUrls = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = rawClientUrls
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// Dynamic origin validator supporting production Vercel domains, preview deployments, and local dev
const isOriginAllowed = (origin) => {
  // Allow non-browser requests (e.g. mobile apps, curl, uptime/health check monitors)
  if (!origin) return true;

  const normalized = origin.trim().replace(/\/+$/, '');

  // Exact match against configured origin(s)
  if (allowedOrigins.includes(normalized)) {
    return true;
  }

  // Always allow localhost on any port for local development
  if (/^http:\/\/localhost(:\d+)?$/.test(normalized) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(normalized)) {
    return true;
  }

  // Allow all Vercel deployment and preview URLs (*.vercel.app)
  if (/^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(normalized)) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: Origin "${origin}" is not permitted.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
  maxAge: 86400, // 24 hours preflight cache
};

// Enable CORS for all incoming requests
app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight across all routes
app.options('*', cors(corsOptions));

// Built-in body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- Root Health Probes (for Render / Uptime Monitors) ---------------- */
app.get(['/', '/health'], (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ProjectPulse AI Backend API is online',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

/* ---------------- Application API Routes ---------------- */

// Mount all API routes under the /api namespace
app.use('/api', apiRoutes);

/* ---------------- Error & 404 Handling Middlewares ---------------- */

// Catch-all handler for requests to undefined routes (404)
app.use(notFoundHandler);

// Centralized error-handling middleware for caught and uncaught errors
app.use(errorHandler);

export default app;
