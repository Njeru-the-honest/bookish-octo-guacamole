# 📚 P2P Tutoring Management System

A full-stack **Peer-to-Peer Tutoring Management System** designed to connect students and tutors within an academic institution (e.g., USIU-Africa). The platform enables seamless tutor discovery, session management, and academic collaboration through a structured, role-based system.

---

## 🚀 Project Overview

This system allows:

- Students to discover tutors, request sessions, and provide feedback  
- Tutors to apply, manage sessions, and track attendance  
- Admins to manage users, approve tutor applications, and monitor system activity  

---

## 🧱 System Architecture

Frontend (React + Vite)  
↓  
API Layer (Axios)  
↓  
Backend (FastAPI)  
↓  
Database (MongoDB)  

---

## 🧩 Core Modules

1. Authentication (JWT-based login, role-based access)
2. User Management (admin controls, activation/deactivation)
3. Tutor Applications (apply, review, approve/reject)
4. Tutor Discovery (search, filter, profiles)
5. Tutoring Requests (create, accept/reject)
6. Session Scheduling (date/time, lifecycle)
7. Attendance Tracking (session validation)
8. Feedback & Ratings (reviews, aggregation)
9. Admin Dashboard (monitoring & reporting)

---

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Axios
- React Router

### Backend
- FastAPI (Python)
- Uvicorn
- JWT Authentication
- Pydantic

### Database
- MongoDB (Atlas recommended)

---

## 📁 Project Structure

p2p-tutoring-management-system/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── context/
│   │   └── utils/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── core/
│   ├── main.py
│   └── requirements.txt
│
└── README.md

---

## ⚙️ Installation & Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env`:

```
MONGO_URI=your_mongodb_uri
DATABASE_NAME=p2p_tutoring
JWT_SECRET=your_secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
```

Run:

```
uvicorn main:app --reload
```

---

### Frontend

```bash
cd frontend
npm install
```

Create `.env`:

```
VITE_API_URL=http://localhost:8000/api/v1
```

Run:

```
npm run dev
```

---

## 🌐 Deployment

### Frontend (Vercel)
- Root: frontend
- Env: VITE_API_URL=https://your-backend.onrender.com/api/v1

### Backend (Render)
- Root: backend
- Build: pip install -r requirements.txt
- Start: uvicorn main:app --host 0.0.0.0 --port $PORT

---

## 🔐 Security

- JWT authentication
- Password hashing (bcrypt)
- Role-based access control
- Input validation

---

## 🔮 Future Improvements

- Real-time chat
- Notifications
- AI tutor recommendations
- Payment integration (M-Pesa)

---

## 👨‍💻 Author

Ted Njeru
