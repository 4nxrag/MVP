import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import User from './models/User';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';




// Allow your frontend URL to access the backend
const corsOptions = {
  origin: 'https://shadowspace-seven.vercel.app', // Your frontend URL
  optionsSuccessStatus: 200
};



// Your other middlewares and routes...


dotenv.config();

const app = express();
const server = createServer(app);
app.use(cors(corsOptions));


// Initialize Socket.IO with CORS
// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000', 
      'http://127.0.0.1:3000',
      'https://shadowspace-seven.vercel.app'  // Add your deployed frontend URL
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});


// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://shadowspace-seven.vercel.app'], // Add your deployed frontend URL
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);
  
  // User joins the main feed room
  socket.join('main-feed');
  
  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shadowspace');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    connectedUsers: io.engine.clientsCount
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 ShadowSpace backend running on port ${PORT}`);
  });
};

startServer();

export { io };
