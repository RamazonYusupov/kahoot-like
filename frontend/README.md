# Kahoot Clone - Frontend

A modern React-based frontend for the AI-powered Kahoot quiz game. Built with Vite, React Router, and Axios.

## Features

- 🎨 **Modern UI** - Clean, responsive design with smooth animations
- 🎮 **Host Dashboard** - Create rooms, manage AI-generated questions
- 🎯 **Question Management** - Add, edit, delete questions before game
- 🎪 **Real-time Gameplay** - Live question display and answer submission
- 📊 **Live Leaderboard** - Real-time score tracking
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Fast Load Times** - Built with Vite for optimal performance
- 🎨 **Beautiful Themes** - Gradient backgrounds and smooth transitions

## Tech Stack

- **React 18** - UI framework
- **Vite** - Fast build tool
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling with animations

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components (if needed)
│   ├── pages/               # Page components
│   │   ├── HomePage.jsx     # Home - Create/Join room
│   │   ├── HostPanel.jsx    # Host - Manage questions
│   │   ├── HostGamePage.jsx # Host - Control game flow
│   │   └── PlayerGamePage.jsx # Player - Answer questions
│   ├── services/
│   │   └── api.js           # API service wrapper
│   ├── styles/
│   │   └── global.css       # Global styles
│   ├── App.jsx              # Main app component
│   └── main.jsx             # React entry point
├── public/                  # Static files
├── index.html               # HTML entry point
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies
└── README.md               # This file
```

## Installation

### Prerequisites

- Node.js 16+ and npm/yarn

### Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## Development

### Run Development Server

```bash
npm run dev
```

Access the app at `http://localhost:3000`

The server will automatically proxy API calls to `http://localhost:8000` (the backend).

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Pages & Features

### 1. Home Page (`/`)
- **Host Mode**: Create a new quiz room
  - Enter Host ID (email/name)
  - Enter Topic (AI generates questions)
  - Room code is generated automatically
  
- **Player Mode**: Join existing room
  - Enter Room Code (6 uppercase letters)
  - Enter Player Name
  - Joins game and waits for host to start

### 2. Host Panel (`/host/:code`)
- **View Room Info**: Room code, player count, topic
- **Manage Questions**: 
  - Review AI-generated questions (10 by default)
  - Add manual questions
  - Edit existing questions
  - Delete questions
  - Support for all 3 question types
- **Controls**:
  - Start Game button (requires at least 1 question)
  - Question count display

### 3. Host Game Control (`/host/game/:code`)
- **Current Question Display**: 
  - Question text and type
  - Options (MCQ, T/F)
  - Progress bar
- **Leaderboard**: Real-time player scores
- **Controls**:
  - Next Question button (advances to next)
  - Game finished notification
- **Auto-refresh**: Updates every 2 seconds

### 4. Player Game Room (`/play/:code`)
- **Question Display**:
  - Question text and type
  - Progress bar
  - Timer (seconds elapsed)
- **Answer Options**:
  - MCQ: Radio buttons
  - True/False: Radio buttons
  - Open: Text input
- **Feedback**:
  - Correct/Incorrect notification
  - Points earned
  - Correct answer display
- **Auto-refresh**: Updates every 2 seconds

## API Integration

The frontend communicates with the backend API at `http://localhost:8000`.

All API calls are wrapped in `src/services/api.js`:

```javascript
// Examples
kahootAPI.createRoom(topic, hostId)
kahootAPI.getRoom(code)
kahootAPI.getQuestions(code)
kahootAPI.joinRoom(code, playerName)
kahootAPI.submitAnswer(code, playerId, answer, timeTaken)
kahootAPI.getLeaderboard(code)
```

See [API_REFERENCE.md](../API_REFERENCE.md) in the backend folder for complete API documentation.

## Styling

Global styles in `src/styles/global.css`:

- **Color Scheme**: 
  - Primary: `#667eea` (purple)
  - Secondary: `#764ba2` (dark purple)
  - Success: `#10b981` (green)
  - Danger: `#ef4444` (red)

- **Components**:
  - Cards, buttons, forms, tables
  - Question cards with type badges
  - Options with hover effects
  - Leaderboard ranking badges
  - Loading spinner
  - Alert boxes

- **Responsive**: Mobile-first design with media queries

## Local Storage

The frontend uses browser local storage to persist:

- **Host ID**: `host_{roomCode}`
- **Player ID**: `player_{roomCode}`
- **Player Name**: `playerName_{roomCode}`

This allows users to navigate away and return to their game.

## Error Handling

All API calls include error handling:

- Network errors
- API validation errors
- User-friendly error messages
- Alert boxes for failures

## Performance

- **Lazy Loading**: Pages load on demand
- **Auto-refresh**: Every 2 seconds for live updates
- **Optimized Build**: Vite provides optimized production bundle
- **Minimal Dependencies**: Only essential packages

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### API Connection Failed

**Problem**: Frontend can't reach backend

**Solution**:
1. Ensure backend is running: `python -m uvicorn app.main:app --reload`
2. Check backend is on `http://localhost:8000`
3. Verify CORS is enabled in backend

### Port Already in Use

**Problem**: `Error: EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Use different port
npm run dev -- --port 3001
```

### Styles Not Loading

**Problem**: Page looks unstyled

**Solution**:
1. Check `src/styles/global.css` is imported in `App.jsx`
2. Restart dev server: `npm run dev`
3. Clear browser cache

### State Not Updating

**Problem**: Leaderboard or questions not updating

**Solution**:
1. Check backend is returning data: http://localhost:8000/docs
2. Verify room code is correct
3. Restart frontend server

## Development Tips

### Debug API Calls

Open browser DevTools (F12) → Network tab to see all API requests

### Inspect Component State

Use React DevTools browser extension to inspect component state

### Test Locally

1. Start backend: `python -m uvicorn app.main:app --reload`
2. Start frontend: `npm run dev`
3. Visit: http://localhost:3000
4. Open multiple browser windows for multi-player testing

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Hosting

The `dist/` folder contains the production build. Deploy to:

- **Vercel** (recommended)
  ```bash
  npm i -g vercel
  vercel
  ```

- **Netlify**
  ```bash
  npm run build
  # Upload dist/ folder
  ```

- **GitHub Pages**
  ```bash
  npm run build
  # Push dist/ to gh-pages branch
  ```

### Environment Variables

For production, update API endpoint in `vite.config.js`:

```javascript
// Change from localhost:8000 to production API
proxy: {
  '/api': {
    target: 'https://your-api.com',
    // ...
  }
}
```

## Future Enhancements

- [ ] WebSocket for real-time updates
- [ ] User authentication
- [ ] Game history and statistics
- [ ] Custom themes
- [ ] Sound effects
- [ ] Question templates
- [ ] Admin dashboard
- [ ] Analytics

## License

MIT

## Support

For issues or questions:
1. Check this README
2. Review backend API docs
3. Check browser console for errors
4. Open an issue on GitHub

---

**Built with React + Vite + Axios**

For backend documentation, see [../README.md](../README.md)
