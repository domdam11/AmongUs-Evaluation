# Among Us Semantic Strategy Dashboard

This project provides a React-based dashboard designed to analyze and rate strategies suggested by a semantic reasoning plugin for the game *Among Us*. It supports visual exploration of strategic graphs, real-time annotations, and user feedback collection, with a mock backend powered by `json-server`.

## 📦 Project Structure

```
├── public/
├── src/
│ ├── App.js # App root with routing
│ ├── index.js # Entry point with ReactDOM
│ ├── Home.js # Home page with summary widgets
│ ├── About.js # Project description
│ ├── Dashboard.js # Graph visualizer for strategies
│ └── Session.js # Session selector and event table
├── db.json # Mock database (json-server)
├── routes.json # Custom API routes for mock server
├── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
git clone https://your.repo.url/among-us-dashboard.git
cd among-us-dashboard
npm install
```

## Start the Development Server
To start both frontend and mock backend:

### Start React app
```bash
npm start
```
### In a second terminal: start mock API server
```bash
npm run mock-api
```
The React app will be available at http://localhost:3000, and the mock API server at http://localhost:3001.

## 🧠 Purpose
This dashboard has been developed to:

- 📊 Visualize strategies inferred from semantic reasoning in Among Us testbed sessions.
- 🧩 Inspect argumentation graphs showing positive and negative paths toward a strategy.
- 🧪 Collect user feedback on suggested strategies (via rating or correction).
- 📁 Export results for offline analysis.

## 🔧 Mock API Structure
### Sessions API  (served via **json-server** and **routes.json**)

**GET /api/strategic/session**
List available game sessions.

**GET /api/strategic/session/:sessionId/eventlist**
List of annotated events for a session.

**GET /api/strategic/session/:sessionId/eventdetails/:eventId**
Graph and strategy info for one event.

These are handled through json-server with custom routes in routes.json.

## 🖥️ Key UI Features
- Session Selector: Pick a session and browse events.

- Event Table: Shows each suggested strategy with score and explanation.

- Graph Viewer: Cytoscape-based visualizer of the reasoning graph.

  - ✅ Positive paths (green)

  - ❌ Negative paths (red, dashed)

  - 🎯 Target nodes (orange fill)

- Feedback Collector: Accept the suggested strategy or submit a correction with reason.

## 📚 About
This project is part of a research testbed integrating semantic technologies, player behavior tracking, and explainable AI in gaming environments.

## 📄 License
This project is licensed under ...
