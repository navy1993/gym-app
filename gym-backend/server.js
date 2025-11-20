const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_gym_secret_change_me';

// Very simple in-memory auth users for now (admin + trainer)
const AUTH_USERS = [
  {
    id: 'admin-1',
    email: 'owner@example.com',
    name: 'Gym Owner',
    role: 'admin',
    password: 'password123', // change in real deployment
  },
  {
    id: 'trainer-1',
    email: 'trainer@example.com',
    name: 'Lead Trainer',
    role: 'trainer',
    password: 'trainer123',
  },
];

app.use(cors());
app.use(express.json());

// Simple request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// --- Auth helpers ---
function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authRequired(req, res, next) {
  // Allow auth endpoints through without token
  if (req.path.startsWith('/auth/')) {
    return next();
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.toString().startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }
  const token = authHeader.toString().slice('Bearer '.length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// File-based persistence
const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          subscriptions: parsed.subscriptions || [],
          workouts: parsed.workouts || [],
          nextUserId: parsed.nextUserId || 1,
          nextSubscriptionId: parsed.nextSubscriptionId || 1,
          nextWorkoutId: parsed.nextWorkoutId || 1,
        };
      }
    }
  } catch (e) {
    console.error('Failed to load data file, starting fresh:', e.message);
  }
  return {
    users: [],
    subscriptions: [],
    workouts: [],
    nextUserId: 1,
    nextSubscriptionId: 1,
    nextWorkoutId: 1,
  };
}

function saveData() {
  const payload = {
    users,
    subscriptions,
    workouts,
    nextUserId,
    nextSubscriptionId,
    nextWorkoutId,
  };
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save data file:', e.message);
  }
}

// Initialize from disk
const initial = loadData();
let users = initial.users;
let subscriptions = initial.subscriptions;
let workouts = initial.workouts;
let nextUserId = initial.nextUserId;
let nextSubscriptionId = initial.nextSubscriptionId;
let nextWorkoutId = initial.nextWorkoutId;

// --- Auth routes ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = AUTH_USERS.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const u = req.user;
  res.json({ id: u.sub, email: u.email, name: u.name, role: u.role });
});

// Protect all other /api routes
app.use('/api', authRequired);

// Users
app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { name, phone, email, whatsappOptIn } = req.body || {};
  if (!name || !phone) {
    return res.status(400).json({ message: 'name and phone are required' });
  }
  const user = {
    id: String(nextUserId++),
    name,
    phone,
    email: email || null,
    whatsappOptIn: !!whatsappOptIn,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveData();
  res.status(201).json(user);
});

app.put('/api/users/:id', (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });
  const existing = users[idx];
  const { name, phone, email, whatsappOptIn } = req.body || {};
  users[idx] = {
    ...existing,
    ...(name !== undefined ? { name } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(whatsappOptIn !== undefined ? { whatsappOptIn: !!whatsappOptIn } : {}),
  };
  saveData();
  res.json(users[idx]);
});

app.delete('/api/users/:id', (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });
  users.splice(idx, 1);
  saveData();
  res.status(204).send();
});

// Subscriptions
app.post('/api/subscriptions', (req, res) => {
  const { userId, planName, startDate, endDate, autoRenew } = req.body || {};
  if (!userId || !planName || !startDate || !endDate) {
    return res.status(400).json({ message: 'userId, planName, startDate, endDate are required' });
  }
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(400).json({ message: 'Invalid userId' });

  const subscription = {
    id: String(nextSubscriptionId++),
    userId,
    planName,
    startDate,
    endDate,
    autoRenew: !!autoRenew,
    createdAt: new Date().toISOString(),
  };
  subscriptions.push(subscription);
  saveData();
  res.status(201).json(subscription);
});

app.get('/api/subscriptions', (req, res) => {
  res.json(subscriptions);
});

// Workouts
app.get('/api/workouts', (req, res) => {
  res.json(workouts);
});

app.get('/api/users/:userId/workouts', (req, res) => {
  const { userId } = req.params;
  const userWorkouts = workouts.filter((w) => w.userId === userId);
  res.json(userWorkouts);
});

app.post('/api/users/:userId/workouts', (req, res) => {
  const { userId } = req.params;
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(400).json({ message: 'Invalid userId' });

  const { month, content, pdfUrl } = req.body || {};
  if (!month || !content) {
    return res.status(400).json({ message: 'month and content are required' });
  }

  const workout = {
    id: String(nextWorkoutId++),
    userId,
    month,
    content,
    pdfUrl: pdfUrl || null,
    sentAt: new Date().toISOString(),
  };
  workouts.push(workout);
  saveData();
  res.status(201).json(workout);
});

app.listen(PORT, () => {
  console.log(`Gym backend API listening on port ${PORT}`);
});
