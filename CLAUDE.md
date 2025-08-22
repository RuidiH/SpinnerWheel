# CLAUD.md - Spinner Wheel Web Application Specification

## Project Overview
Build a web-based spinner wheel application with real-time updates, two game modes, and separate admin/user interfaces.

## Core Requirements

### System Architecture
- **Backend**: Golang with Gin framework
- **Frontend**: React.js with WebSocket support
- **Storage**: JSON files (config.json, history.json, state.json)
- **Deployment**: Docker containers, designed for single machine with future two-machine separation capability

### Two Web Interfaces

#### 1. User Interface (`/user`)
- Display spinner wheel with 12 segments
- Show current player number
- Show remaining spin count
- Display spin history (last 2 days only)
- Left-click to spin wheel
- Real-time updates via WebSocket
- Voice announcement: "Player X has won the prize Y" using Web Speech API

#### 2. Admin Interface (`/admin`)
- Configure game mode (Mode 1 or Mode 2)
- Set player number
- Set total spin count
- For Mode 1: Configure 12 option texts and probabilities
- For Mode 2: Display fixed options (11 "No Prize", 1 "Winner!")
- Save/Load configurations
- Reset game state
- All changes take effect immediately (or after current spin completes)

### Game Modes

#### Mode 1: Classic
- 12 custom options with custom text
- Each option has a fixed probability
- Probabilities must sum to 100%
- Configuration persists when switching modes

#### Mode 2: Simple Win Rate
- Fixed options: 11 "没中奖", 1 "中奖了!"
- Simple probability: Fixed 5% win rate (1 in 20 chance)
- No pity system or escalation

### State Management
- **Player Number**: Shared globally, persists across mode switches
- **Remaining Spins**: Shared globally, decrements immediately on spin, persists across mode switches
- **History**: Global, shows all players' results, kept for 2 days
- **Mode Configurations**: Mode 1 settings saved when switching to Mode 2 and restored when switching back

## Technical Specifications

### Backend API Endpoints

```
GET  /api/config          - Get current game configuration
POST /api/config          - Update game configuration
POST /api/spin            - Process a spin
GET  /api/history         - Get spin history (last 2 days)
GET  /api/state           - Get current game state
POST /api/reset           - Reset game state
WS   /ws                  - WebSocket for real-time updates
```

### WebSocket Events
- `config_updated`: Broadcast when admin changes settings
- `spin_started`: When a spin begins
- `spin_completed`: With result data
- `state_updated`: Player/spin count changes

### Data Models

```go
// GameConfig
{
  "mode": 1 or 2,
  "mode1_options": [
    {"text": "Prize 1", "probability": 8.33},
    // ... 12 total
  ],
  "current_player": 1,
  "remaining_spins": 100,
  "total_spins": 0
}

// SpinResult
{
  "player": 1,
  "prize": "Prize Name",
  "index": 0-11,
  "timestamp": "2024-01-01T12:00:00Z",
  "mode": 1 or 2
}
```

### File Storage Structure
```
data/
├── config.json         - Current game configuration
├── config.json         - Current game configuration with derived state
└── history.json        - Spin history with auto-cleanup (>2 days)
```

## Implementation Details

### Spinner Wheel Animation
- CSS transform rotation
- Duration: 3-4 seconds
- Easing: ease-in-out with slight bounce at end
- Calculate winning segment before animation starts
- Rotate to winning segment + random offset within segment

### Mode 2 Probability Calculation
```
probability = 0.05  // Fixed 5% win rate
```
- Simple 1 in 20 chance to win
- No tracking of previous spins

### Real-time Updates
- WebSocket connection established on page load
- Admin changes broadcast to all connected clients
- If spin in progress, queue update for after completion
- Immediate update if idle

### Validation Rules
- Mode 1: Probabilities must sum to 100% (±0.01 tolerance)
- Player number must be positive integer
- Spin count cannot be negative
- Option text cannot be empty in Mode 1

## Frontend Components Structure

```
src/
├── pages/
│   ├── User.jsx         - User interface with wheel
│   └── Admin.jsx        - Admin configuration interface
├── components/
│   ├── SpinnerWheel.jsx - Wheel component with animation
│   ├── History.jsx      - History display component
│   └── ConfigForm.jsx   - Mode configuration form
├── services/
│   ├── api.js          - HTTP API calls
│   └── websocket.js    - WebSocket connection management
└── App.jsx             - Router and global state
```

## Deployment Configuration

### Docker Setup
- Backend container (Golang)
- Frontend container (Node.js/nginx)
- Shared volume for data files
- Environment variables for API endpoints

### Future Two-Machine Separation
- Admin interface can be deployed separately
- Requires CORS configuration
- WebSocket proxy configuration for cross-machine communication
- Shared file storage (NFS or cloud storage)

## Error Handling
- Display user-friendly error messages
- Automatic reconnection for WebSocket
- Graceful degradation if WebSocket fails
- Validation on both frontend and backend
- Prevent double-spinning with request lock

## Browser Compatibility
- Chrome, Firefox, Safari, Edge (latest versions)
- Responsive design for tablet viewing
- Web Speech API fallback to console.log if not supported

## Development Setup Instructions
1. Backend: `go mod init spinner-wheel && go get dependencies`
2. Frontend: `npx create-react-app frontend && npm install dependencies`
3. Create data directory with proper permissions
4. Configure CORS for development
5. Set up hot-reload for both frontend and backend

## Testing Requirements
- Test Mode 2 probability convergence to 5%
- Test real-time updates with multiple connected clients
- Test mode switching with configuration persistence
- Test history cleanup after 2 days
- Test spin lock during animation

## Additional Notes
- Use Chinese fonts (Noto Sans CJK) for text display
- TTS should announce in Chinese: "玩家X中了奖品Y"
- Consider adding sound effects for spin start/end
- Log all spins for audit purposes
- No authentication required (internal use only)