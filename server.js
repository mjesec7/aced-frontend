const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// In-memory storage for development
const userProgress = new Map();
const lessons = new Map();
const users = new Map();

// Mock data for lessons
const mockLessons = {
  '687c97c4fdbf61e51edb3f99': {
    _id: '687c97c4fdbf61e51edb3f99',
    lessonName: 'Basic JavaScript',
    topicId: 'js-basics',
    steps: [
      {
        type: 'explanation',
        data: {
          content: 'JavaScript is a programming language that runs in web browsers.',
          title: 'Introduction to JavaScript'
        }
      },
      {
        type: 'exercise',
        data: {
          question: 'What is JavaScript?',
          options: ['A programming language', 'A markup language', 'A styling language'],
          correctAnswer: 0
        }
      }
    ],
    metadata: {
      estimatedDuration: 10
    }
  }
};

// Initialize mock data
mockLessons['687c97c4fdbf61e51edb3f99'].steps.forEach((step, index) => {
  step._id = `step_${index}`;
});

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get lesson by ID
app.get('/lessons/:lessonId', (req, res) => {
  const { lessonId } = req.params;
  const lesson = mockLessons[lessonId];
  
  if (!lesson) {
    return res.status(404).json({ 
      success: false, 
      error: 'Lesson not found' 
    });
  }
  
  res.json({
    success: true,
    data: lesson
  });
});

// Get user progress for a lesson
app.get('/users/:userId/progress/lesson/:lessonId', (req, res) => {
  const { userId, lessonId } = req.params;
  const key = `${userId}_${lessonId}`;
  const progress = userProgress.get(key);
  
  if (!progress) {
    return res.json({
      success: true,
      data: null
    });
  }
  
  res.json({
    success: true,
    data: progress
  });
});

// Alternative progress endpoint
app.get('/user-progress/user/:userId/lesson/:lessonId', (req, res) => {
  const { userId, lessonId } = req.params;
  const key = `${userId}_${lessonId}`;
  const progress = userProgress.get(key);
  
  if (!progress) {
    return res.json({
      success: true,
      data: null
    });
  }
  
  res.json({
    success: true,
    data: progress
  });
});

// Save user progress
app.post('/users/:userId/progress/save', (req, res) => {
  const { userId } = req.params;
  const progressData = req.body;
  
  const key = `${userId}_${progressData.lessonId}`;
  const progress = {
    _id: key,
    userId,
    lessonId: progressData.lessonId,
    topicId: progressData.topicId,
    completedSteps: progressData.completedSteps || [],
    progressPercent: progressData.progressPercent || 0,
    completed: progressData.completed || false,
    mistakes: progressData.mistakes || 0,
    stars: progressData.stars || 0,
    points: progressData.points || 0,
    duration: progressData.duration || 0,
    hintsUsed: progressData.hintsUsed || 0,
    submittedHomework: progressData.submittedHomework || false,
    medal: progressData.medal || 'none',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  userProgress.set(key, progress);
  
  res.json({
    success: true,
    data: progress
  });
});

// Alternative progress save endpoint
app.post('/progress', (req, res) => {
  const progressData = req.body;
  const { userId, lessonId } = progressData;
  
  if (!userId || !lessonId) {
    return res.status(400).json({
      success: false,
      error: 'Missing userId or lessonId'
    });
  }
  
  const key = `${userId}_${lessonId}`;
  const progress = {
    _id: key,
    userId,
    lessonId,
    topicId: progressData.topicId,
    completedSteps: progressData.completedSteps || [],
    progressPercent: progressData.progressPercent || 0,
    completed: progressData.completed || false,
    mistakes: progressData.mistakes || 0,
    stars: progressData.stars || 0,
    points: progressData.points || 0,
    duration: progressData.duration || 0,
    hintsUsed: progressData.hintsUsed || 0,
    submittedHomework: progressData.submittedHomework || false,
    medal: progressData.medal || 'none',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  userProgress.set(key, progress);
  
  res.json({
    success: true,
    data: progress
  });
});

// Get user info
app.get('/users/:userId', (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId) || {
    _id: userId,
    email: 'user@example.com',
    displayName: 'Test User',
    subscriptionPlan: 'free',
    userStatus: 'active'
  };
  
  res.json({
    success: true,
    data: user
  });
});

// Save user
app.post('/users', (req, res) => {
  const userData = req.body;
  const userId = userData.uid || userData._id;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'Missing user ID'
    });
  }
  
  const user = {
    _id: userId,
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  users.set(userId, user);
  
  res.json({
    success: true,
    data: user
  });
});

// Get user status
app.get('/users/:userId/status', (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);
  
  const status = {
    userId,
    subscriptionPlan: user?.subscriptionPlan || 'free',
    userStatus: user?.userStatus || 'active',
    isPremium: user?.subscriptionPlan === 'premium'
  };
  
  res.json({
    success: true,
    data: status
  });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API base: http://localhost:${PORT}`);
});