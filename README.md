<p align="center">
  <img src="frontend/public/logo.png" alt=".ROOT Logo" width="340" />
</p>

<p align="center">
  <b>A modern, minimalist, dark-themed social platform built for speed and simplicity.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-3.1-000000?style=flat-square&logo=flask" alt="Flask" />
  <img src="https://img.shields.io/badge/Auth-Native_JWT-E16B55?style=flat-square" alt="JWT Auth" />
</p>

---

## ✨ Features

- **📸 Feed & Media Sharing**: Infinite feed pagination, high-resolution post creation with media uploads, post management, likes, and comment threads.
- **🔍 Explore & Live Discovery**: Instant, debounced user search and global post discovery.
- **💬 Direct Messaging**: Private conversations with real-time active thread views and message status tracking.
- **🔔 Activity Stream**: Notifications for social interactions including likes, comments, and new followers.
- **👤 Profile Management & Social Graph**: Follow/unfollow mechanics, customizable avatars, bios, display names, and follower/following metrics.
- **🔐 Native JWT Authentication**: Fast, stateless token-based authentication using PyJWT and salted password hashing with zero third-party auth lock-in.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Authentication**: Native JWT with client-side session management
- **State Management**: React Context (`AuthContext`, `FeedContext`)

### Backend
- **Framework**: [Flask 3.1](https://flask.palletsprojects.com/) REST API
- **Authentication**: Native JWT with `PyJWT` & salted password hashing via `werkzeug.security`
- **Database Engine**: Lightweight atomic document store (`database.json`)
- **Asset Storage**: Disk-backed media storage (`/static/posts/`)
- **Testing**: Automated end-to-end API test suite (`backend/api_validation.py`)

---

## 📁 Project Structure

```text
dotRoot/
├── backend/
│   ├── routes/
│   │   ├── auth.py            # User registration, login, profile (/api/auth)
│   │   ├── posts.py           # Feed, pagination, post creation, likes, comments
│   │   ├── users.py           # User profiles and user search
│   │   ├── social.py          # Follow / Unfollow social graph
│   │   ├── chat.py            # Ephemeral messaging and conversations
│   │   └── notifications.py   # Activity notification stream
│   ├── services/              # Modular business logic services
│   ├── static/posts/          # Uploaded media storage
│   ├── app.py                 # Flask app entrypoint & blueprint registrations
│   ├── auth_utils.py          # JWT issuance, verification, and password hashing
│   ├── config.py              # Environment configuration & constants
│   ├── db.py                  # Atomic document store read/write engine
│   ├── middleware.py          # Bearer token verification decorator
│   ├── api_validation.py      # Automated 19-point API test suite
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Backend environment configuration
│
├── frontend/
│   ├── public/
│   │   └── logo.png           # .ROOT branding asset
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/        # Auth routes (login, signup)
│   │   │   ├── (main)/        # App routes (home feed, explore, create, messages, notifications, profile)
│   │   │   ├── globals.css    # Global stylesheet & Tailwind CSS v4 setup
│   │   │   └── layout.tsx     # Root application layout with context providers
│   │   ├── components/        # Reusable UI (Sidebar, BottomNav, Feed, PostCard, PostModal, EditProfileModal)
│   │   ├── context/           # AuthContext & FeedContext
│   │   └── lib/               # api.ts (fetch client) & auth.ts (token storage)
│   ├── tests/                 # End-to-end integration tests
│   ├── package.json           # Frontend dependencies & build scripts
│   └── next.config.ts         # Next.js configuration & API proxy rewrites
│
└── README.md                  # Project documentation
```

---

## 🔐 Authentication Architecture

The application uses **stateless native JWT authentication** eliminating external dependencies:

```
[User Signup / Login] ──> POST /api/auth/login ──> Werkzeug check_password_hash()
                                  │
                                  ▼
[Store JWT in Session] <── Issue HS256 Token {uid, email, exp: 7 days}
         │
         ▼
[Authenticated Requests] ──> Header: "Authorization: Bearer <token>"
                                  │
                                  ▼
                        middleware.token_required()
                                  │
                        Valid? ──Yes──> Execute Route Handler
                               ──No───> Return HTTP 401 Unauthorized
```

---

## 📡 API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | No | Register new user (`displayName`, `email`, `password`) |
| `POST` | `/api/auth/login` | No | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Yes | Get authenticated user's profile |

### Posts & Social (`/api/posts`, `/api/social`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/posts/` | Opt | Feed with pagination (`limit`, `lastDocId`) |
| `POST` | `/api/posts/` | Yes | Create post with image upload & caption |
| `DELETE` | `/api/posts/<id>/` | Yes | Delete own post |
| `POST` | `/api/posts/<id>/like/` | Yes | Like / unlike post |
| `POST` | `/api/posts/<id>/comment/` | Yes | Add comment to post |
| `POST` | `/api/social/follow/` | Yes | Follow a user |
| `POST` | `/api/social/unfollow/` | Yes | Unfollow a user |

### Users, Chat & Notifications (`/api/users`, `/api/chat`, `/api/notifications`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/users/<uid>/` | Opt | Fetch public user profile |
| `GET` | `/api/users/search/?q=` | No | Debounced search across user accounts |
| `POST` | `/api/users/me/` | Yes | Update profile display name, bio, and photo |
| `GET` | `/api/chat/` | Yes | List active conversation threads |
| `POST` | `/api/chat/<id>/messages/` | Yes | Send direct message |
| `POST` | `/api/chat/<id>/read/` | Yes | Mark read and trigger message cleanup |
| `GET` | `/api/notifications/` | Yes | Fetch user notifications (likes, comments, follows) |

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
# Windows PowerShell:
python -m venv env
.\env\Scripts\Activate.ps1

# macOS / Linux:
python3 -m venv env
source env/bin/activate

# Install requirements
pip install -r requirements.txt

# Start backend server (runs on port 8000)
python app.py
```

#### Run Automated Backend Tests
```bash
python api_validation.py
```
*(Runs the 19-point test suite validating auth, security, feed pagination, social interactions, and error handling).*

---

### 2. Frontend Setup

Open a separate terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server (runs on port 3000)
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🧪 Build & Verification

```bash
# Test production build
npm --prefix frontend run build
```

---

## 📄 License
This project is open-source under the MIT License.
