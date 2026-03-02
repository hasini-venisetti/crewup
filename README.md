# 🎬 CREWUP — Creator Collaboration Platform

> **Project-based collaboration for filmmakers, editors, writers, musicians, actors, and every creative professional.**

CREWUP is a full-stack web application where creators post projects and build teams. Think of it as LinkedIn meets GitHub — but for creative work.

---

## 📁 Project Structure

```
CREWUP/
├── server/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/          # User, Profile, Project, Application, Task
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── client/                  # Next.js 14 App Router frontend
    ├── src/
    │   ├── app/
    │   │   ├── page.jsx              # Landing page
    │   │   ├── (auth)/               # Login + Signup
    │   │   └── (main)/               # Shared Navbar + Footer layout
    │   │       ├── dashboard/
    │   │       ├── explore/
    │   │       ├── map/
    │   │       ├── projects/[id]/
    │   │       │   ├── applications/
    │   │       │   └── team/         # Team Dashboard
    │   │       ├── create-project/
    │   │       ├── profile/[id]/
    │   │       ├── profile/edit/
    │   │       ├── search/
    │   │       ├── tags/[tag]/
    │   │       ├── notifications/
    │   │       ├── leaderboard/
    │   │       └── settings/
    │   ├── components/
    │   ├── hooks/
    │   └── lib/api.js
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com) — free tier)
- npm or yarn

### Step 1 — Clone & Open

```bash
git clone <your-repo-url> crewup
cd crewup
```

### Step 2 — Setup the Backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/crewup
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

```bash
npm run dev
# Server runs at http://localhost:5001
```

### Step 3 — Setup the Frontend

```bash
cd client
npm install
cp .env.local.example .env.local
```

Edit `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

```bash
npm run dev
# Frontend runs at http://localhost:3000
```

---

## ✨ Features

### 👤 Creator Profiles
Every creator has a rich public profile with their name, role, bio, experience level, skills, social links, and portfolio. Profiles are discoverable by everyone.

### 🟢 Availability Status
Creators can set their current status — **Available**, **Busy**, or **Open to Offers** — shown as a color-coded pulsing badge on their profile and on the Explore page so project owners can see at a glance who is ready to collaborate.

### 🖼️ Portfolio Builder
Creators can add portfolio items directly to their profile — videos, images, audio, links, or other work — with a title, description, tags, and a link. The portfolio grid is displayed prominently on the public profile page.

### 🔍 Explore Creators
Browse all creators with live availability badges. Filter by role, experience level, and availability. Great for project owners looking for the right collaborator quickly.

### 🗺️ Creator Map
An interactive map (powered by Leaflet.js + OpenStreetMap) shows creators pinned to their city. Pins are color-coded by availability. Click any pin to see the creator's name, role, and availability in a sidebar. Filter by role to narrow the map down.

### 📋 Project Board
Project owners can post projects with a title, description, required roles, location, budget, and deadline. Creators browse open projects and apply with a message. Owners can accept or reject applicants, and accepted applicants become team members.

### 🎓 Beginner-Friendly Projects
When creating a project, owners can set an **Experience Level** (Any, Beginner, Intermediate, or Advanced) and tag the project with labels like **Learning Project**, **Practice Collaboration**, **Portfolio Building**, **Mentorship Available**, or **Paid Opportunity**. These badges appear on every project card, making it easy for beginners to find safe, welcoming projects.

### 📅 Project Timeline Board
Each project has a 5-stage production timeline: **Planning → Pre-Production → Production → Post-Production → Released**. The project owner can update the current stage with one click. The active stage is highlighted and all previous stages are marked complete.

### 👥 Team Dashboard
Once a team is formed, members get access to a private Team Dashboard at `/projects/[id]/team` with four tabs:

- **💬 Chat** — Real-time team messaging powered by Socket.io. Messages are persisted and load on every visit.
- **📋 Tasks** — A Kanban board with three columns (To Do, In Progress, Done). Add tasks with a title, description, priority, assignee, and due date. Move tasks between columns or delete them. Only the project owner can delete tasks.
- **📂 Files** — Share links to Google Drive, Notion, Figma, Dropbox, images, videos, or any URL. Files are listed with a type icon, name, description, and the uploader's name.
- **🎬 Progress** — See the project's current timeline stage and the full team roster (all accepted members with their roles).

### 💬 Real-Time Messaging
Creators can message each other directly. Each project also has its own chat room. All messaging is powered by Socket.io with JWT-authenticated connections.

### 🔔 Notifications
Creators receive notifications when someone applies to their project, when their application is accepted or rejected, and for other platform activity.

### 🏆 Leaderboard
A ranked view of the most active creators on the platform based on projects created and collaborations completed.

### 🔎 Search & Tags
Full search across projects and creators. Projects can be browsed by tag (e.g., `/tags/film`, `/tags/music`) to find work in a specific creative field.

### ⚙️ Settings
Users can update their account details, change their password, and manage notification preferences from the Settings page.

---

## 🗄️ Database Models

### User
- `name`, `username`, `email`, `password` (bcrypt hashed)
- `role` — filmmaker | actor | editor | writer | musician | designer | photographer | content-creator
- `profileImage`, `isActive`

### Profile
- `bio`, `skills[]`, `location`, `experienceLevel`
- `availability` — available | busy | open-to-offers
- `socialLinks` — instagram, youtube, vimeo, linkedin, website
- `portfolioLinks[]`, `portfolio[]` — embedded portfolio items (title, type, link, tags)

### Project
- `title`, `description`, `projectType`, `requiredRoles[]`
- `isPaid`, `budget`, `location`, `deadline`, `status`
- `experienceLevel` — any | beginner | intermediate | advanced
- `projectTags[]` — learning-project | practice-collaboration | portfolio-building | mentorship-available | paid-opportunity
- `timelineStage` — planning | pre-production | production | post-production | released
- `teamMembers[]`, `teamFiles[]` — embedded shared links

### Application
- `project`, `applicant`, `roleApplyingFor`, `message`
- `status` — pending | accepted | rejected

### Task
- `project`, `title`, `description`, `assignee`
- `status` — todo | in-progress | done
- `priority` — low | medium | high
- `dueDate`, `createdBy`

---

## 🔌 API Reference

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

### Profiles
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/profile/me` | ✅ | Own profile |
| GET | `/api/profile/:id` | ❌ | Any user's profile |
| PUT | `/api/profile/update` | ✅ | Update own profile |
| POST | `/api/profile/portfolio` | ✅ | Add portfolio item |
| DELETE | `/api/profile/portfolio/:itemId` | ✅ | Delete portfolio item |

### Projects
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/projects` | ❌ | List all projects |
| GET | `/api/projects/my` | ✅ | Own projects |
| GET | `/api/projects/:id` | ❌ | Single project |
| POST | `/api/projects` | ✅ | Create project |
| PUT | `/api/projects/:id` | ✅ | Update (owner only) |
| DELETE | `/api/projects/:id` | ✅ | Delete (owner only) |
| PATCH | `/api/projects/:id/timeline` | ✅ | Update timeline stage |

### Applications
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/apply` | ✅ | Apply to project |
| GET | `/api/applications/my` | ✅ | My applications |
| GET | `/api/applications/:projectId` | ✅ | Incoming (owner only) |
| PUT | `/api/application/status` | ✅ | Accept / Reject |

### Tasks (Team Dashboard)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/projects/:id/tasks` | ✅ | Get all tasks |
| POST | `/api/projects/:id/tasks` | ✅ | Create task |
| PATCH | `/api/projects/:id/tasks/:tid` | ✅ | Update task |
| DELETE | `/api/projects/:id/tasks/:tid` | ✅ | Delete task (owner only) |

### Team Files
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/projects/:id/files` | ✅ | Get shared files |
| POST | `/api/projects/:id/files` | ✅ | Add shared file |
| DELETE | `/api/projects/:id/files/:fid` | ✅ | Remove file |

### Map
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/map` | ❌ | Get all creators with location |

---

## 🎨 Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, features, project previews |
| `/login` | Login form |
| `/signup` | Registration with role selection |
| `/dashboard` | User hub — my projects, applications, team |
| `/explore` | Browse creators with availability badges |
| `/map` | Interactive map of creators by city |
| `/projects` | Browse all open projects with filters |
| `/projects/[id]` | Project detail, apply, timeline board |
| `/projects/[id]/applications` | Manage incoming applications (owner) |
| `/projects/[id]/team` | Team Dashboard — chat, tasks, files, progress |
| `/create-project` | Create a new project |
| `/profile/[id]` | Public creator profile with portfolio |
| `/profile/edit` | Edit profile, skills, portfolio, links |
| `/search` | Search creators and projects |
| `/tags/[tag]` | Browse projects by tag |
| `/notifications` | Activity notifications |
| `/leaderboard` | Top creators on the platform |
| `/settings` | Account and notification settings |

---

## 🛡️ Security

- **Passwords:** bcrypt with salt rounds = 12
- **JWT:** Signed with `JWT_SECRET`, expires in 7 days
- **Auth middleware:** Verifies token on all protected routes
- **Helmet.js:** Secure HTTP headers
- **CORS:** Restricted to `CLIENT_URL`
- **Input validation:** `express-validator` on all auth routes
- **Ownership checks:** Users can only edit/delete their own resources

---

## 🧑‍💻 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Real-time | Socket.io |
| Map | Leaflet.js + OpenStreetMap |
| API Client | Axios |
| Security | Helmet, CORS, express-validator |
| Dev Tools | Nodemon, ESLint |

---

Built with 🎬 for creators, by creators.
