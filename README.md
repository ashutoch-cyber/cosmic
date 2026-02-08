# 🌌 Cosmic Watch

Cosmic Watch is a **full-stack web application** that displays cosmic and astronomical data using a **static frontend** and a **Django backend API**.

The project is structured to allow independent deployment of the frontend and backend while communicating through API endpoints.

---

## 🚀 Tech Stack

### Frontend
- HTML
- CSS
- JavaScript
- Static assets (images, video)

### Backend
- Python
- Django
- SQLite (development)
- Django REST-style APIs

---

## 📁 Project Structure

cosmic/
├── app/ # Frontend app (Vite / tooling)
├── cosmic-watch/ # Static frontend files
│ ├── index.html
│ ├── script.js
│ ├── style.css
│ └── assets
├── cosmic-watch-backend/ # Django backend
│ ├── alerts/
│ ├── asteroids/
│ ├── users/
│ ├── cosmicwatch/
│ ├── manage.py
│ ├── requirements.txt
│ └── db.sqlite3
└── README.md


---

## ⚙️ Backend Setup (Django)

### 1️⃣ Navigate to backend directory
```bash
cd cosmic-watch-backend

### 2️⃣ Create virtual environment
python -m venv venv

3️⃣ Activate virtual environment

Windows

venv\Scripts\activate


Mac / Linux

source venv/bin/activate

4️⃣ Install dependencies
pip install -r requirements.txt

5️⃣ Apply migrations
python manage.py migrate

6️⃣ Run development server
python manage.py runserver


Backend runs at:

http://127.0.0.1:8000/

🌐 Frontend Usage

The frontend is a static website.

Option 1: Open directly

Open this file in a browser:

cosmic-watch/index.html

Option 2: Serve locally
cd cosmic-watch
python -m http.server 3000


Open in browser:

http://localhost:3000

🔗 Frontend ↔ Backend Connection

Set the backend API URL inside your frontend JavaScript:

const API_BASE_URL = "http://127.0.0.1:8000";


Replace this with your deployed backend URL in production.

☁️ Deployment
Backend Deployment Options

Render

Railway

Heroku

PythonAnywhere

Frontend Deployment Options

Netlify

Vercel

GitHub Pages

🛠️ Common Issues

Virtual environment errors → delete venv/ and recreate it

pip not working → use python -m pip

Backend URL not working → verify API base URL and CORS settings

Never commit the venv/ folder

📄 License

This project is open-source.
You may add an MIT or any other license if required.

👨‍💻 Author

Ashutosh
GitHub: https://github.com/ashutoch-cyber


--
 

