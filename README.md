# MINDY - Learn Crypto & Finance

> The "Duolingo for modern skills" - A mobile-first educational app teaching Crypto and Personal Finance through micro-lessons.

## 🎨 Design System

**Aesthetic:** "Coder Vibe" / Cyber-minimalist  
**Theme:** Dark Mode with Neon accents

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0D1117` | GitHub Dark |
| Surface | `#161B22` | Cards, containers |
| Primary | `#39FF14` | Neon Green - CTAs, Mindy |
| Secondary | `#58A6FF` | Electric Blue - Links |
| Text | `#E6EDF3` | Primary text |

## 📁 Project Structure

```
mindy_final/
├── server/          # NestJS REST API
│   ├── prisma/      # Database schema & migrations
│   └── src/
│       ├── users/       # User module
│       ├── lessons/     # Lessons module (with Zod validation)
│       └── progress/    # Progress tracking module
│
├── mobile/          # Expo React Native App
│   ├── app/         # Expo Router screens
│   └── src/
│       ├── components/  # UI components
│       ├── theme/       # Design tokens
│       └── api/         # API client
│
└── shared/          # Shared TypeScript types
    └── types/       # Lesson, User, API types
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Expo CLI (`npm install -g expo-cli`)

### Server Setup

```bash
cd server

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Start development server
npm run start:dev
```

### Mobile Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Or run on specific platform
npm run ios
npm run android
```

## 🧩 Tech Stack

### Backend
- **NestJS** - Node.js framework
- **Prisma** - ORM with PostgreSQL
- **Zod** - Runtime validation

### Mobile
- **Expo** - React Native (Managed)
- **NativeWind** - Tailwind CSS for RN
- **React Native Reanimated** - Animations

### Shared
- **TypeScript** - Strict mode everywhere

## 📚 API Endpoints

### Users
```
GET    /api/users/:id          # Get user
GET    /api/users/:id/stats    # Get user stats
POST   /api/users/:id/xp       # Add XP
POST   /api/users/:id/streak   # Update streak
```

### Lessons
```
GET    /api/lessons            # Get all lessons
GET    /api/lessons/:id        # Get lesson by ID
GET    /api/lessons/domain/:d  # Get by domain
POST   /api/lessons            # Create lesson
```

### Progress
```
GET    /api/progress/user/:id           # Get user progress
GET    /api/progress/user/:id/current   # Get current lesson
POST   /api/progress                    # Start progress
POST   /api/progress/:id/complete-step  # Complete step
POST   /api/progress/:id/reset          # Reset progress
```

## 🤖 Mindy - The Mascot

Mindy is a terminal-based entity that guides users through lessons with a mix of encouragement and "roasting".

**Moods:**
- `neutral` - Default state
- `hype` - Excited, celebratory 🚀
- `roast` - Playfully critical 🔥
- `thinking` - Pondering 🤔

```tsx
<MindyMessage 
  message="Ready to level up today?"
  mood="hype"
  typingSpeed={30}
/>
```

## 📝 Lesson Structure

Lessons are JSON documents validated by Zod:

```typescript
{
  steps: [
    { type: 'info', title: '...', content: '...', mindyMessage?: '...' },
    { type: 'quiz', question: '...', options: [...], correctIndex: 0 },
    { type: 'swipe', statement: '...', isCorrect: true, explanation: '...' }
  ]
}
```

## 🛠 Development

### Generate Prisma Client
```bash
cd server && npm run prisma:generate
```

### Run Migrations
```bash
cd server && npm run prisma:migrate
```

### Open Prisma Studio
```bash
cd server && npm run prisma:studio
```

## 📄 License

MIT License - School Project 2025-2026

