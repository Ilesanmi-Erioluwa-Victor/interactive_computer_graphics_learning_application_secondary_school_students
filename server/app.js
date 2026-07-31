import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';

import './config/cloudinary.js';

import authRoutes from './routes/authRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import classRoutes from './routes/classRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

app.use(
  '/uploads',
  express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads'))
);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ICGLA API is healthy', timestamp: new Date().toISOString() });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api', lessonRoutes);
app.use('/api', quizRoutes);
app.use('/api', progressRoutes);
app.use('/api', classRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', feedbackRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
