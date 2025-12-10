# How to Run the Baby Data Tracking App

This guide will walk you through starting your baby tracking application from scratch. You need to start three separate services in order: database, backend, and frontend.

## Prerequisites

Before you start, make sure you have these installed:

- ✅ **PostgreSQL** (database) - Installed and running
- ✅ **Python 3.11+** with `uv` package manager
- ✅ **Node.js 18+** with `npm`

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Database

**Windows:**

1. Open **Windows Search** (Windows key)
2. Type `services.msc` and press Enter
3. Find **"postgresql-x64-16"** (or similar name with PostgreSQL)
4. Right-click and select **"Start"**
5. Verify it says **"Running"**

**Alternative Method (Command Line):**

```powershell
# Check if PostgreSQL service is running
Get-Service postgresql*

# If it's stopped, start it (run as Administrator)
Start-Service postgresql-x64-16
```

**✅ Verification:** Your database is now running in the background. You can verify by opening a terminal and typing:

```bash
psql -U postgres -d baby_data
```

If you see a `baby_data=#` prompt, your database is working! Type `\q` to exit.

---

### Step 2: Start the Backend Server

The backend is a Python FastAPI application that connects to your database and provides APIs.

**Open Terminal/PowerShell #1:**

```bash
# 1. Navigate to the backend directory
cd c:\Users\nikil\baby-data-app-2025\backend

# 2. Activate the Python virtual environment
.venv\Scripts\activate

# 3. Start the backend server
py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**What each command does:**

- `cd backend` - Changes to the backend folder
- `.venv\Scripts\activate` - Activates the Python virtual environment (you'll see `(.venv)` in your prompt)
- `py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` - Starts the FastAPI server
  - `--reload` means the server auto-restarts when you edit code
  - `--host 0.0.0.0` makes it accessible from your network
  - `--port 8000` runs it on port 8000

**✅ Success looks like this:**

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test it:** Open your browser to http://localhost:8000/docs - You should see the FastAPI interactive documentation!

**⚠️ IMPORTANT:** Keep this terminal window open! If you close it, the backend stops.

---

### Step 3: Start the Frontend

The frontend is a React application that displays the user interface.

**Open Terminal/PowerShell #2 (NEW WINDOW):**

```bash
# 1. Navigate to the frontend directory
cd c:\Users\nikil\baby-data-app-2025\frontend

# 2. Start the development server
npm run dev
```

**What each command does:**

- `cd frontend` - Changes to the frontend folder
- `npm run dev` - Starts the Vite development server that serves your React app

**✅ Success looks like this:**

```
  VITE v6.3.5  ready in 523 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Your app is now running!** Open your browser to: **http://localhost:3000**

**⚠️ IMPORTANT:** Keep this terminal window open too! If you close it, the frontend stops.

---

## 📊 Summary: What's Running

You should now have **3 things running**:

1. **PostgreSQL Database** (background service)
   - Stores all your baby data
   - Running on port 5432 (default)

2. **Backend Server** (Terminal #1)
   - FastAPI Python application
   - Running on http://localhost:8000
   - Provides REST APIs for data

3. **Frontend Server** (Terminal #2)
   - React application with Vite
   - Running on http://localhost:3000
   - The UI you interact with

**Data Flow:**
```
Browser (localhost:3000)
    ↓
Frontend React App
    ↓ (API calls)
Backend FastAPI (localhost:8000)
    ↓ (database queries)
PostgreSQL Database (localhost:5432)
```

---

## 🛑 How to Stop Everything

### Stop Frontend:
- Go to Terminal #2 (frontend)
- Press `Ctrl+C`

### Stop Backend:
- Go to Terminal #1 (backend)
- Press `Ctrl+C`

### Stop Database:
You don't usually need to stop PostgreSQL (it can run in background), but if you want to:

**Windows Services Method:**
1. Open `services.msc`
2. Find **postgresql-x64-16**
3. Right-click → **Stop**

**Command Line Method:**
```powershell
# Run as Administrator
Stop-Service postgresql-x64-16
```

---

## 🔄 Restarting the App

**Next time you want to use the app:**

1. ✅ Check PostgreSQL is running (usually it auto-starts)
2. 🔴 Open Terminal #1 → Start backend (steps from Step 2)
3. 🔵 Open Terminal #2 → Start frontend (steps from Step 3)
4. 🌐 Open browser to http://localhost:3000

---

## 🐛 Troubleshooting

### Problem: "Port 8000 is already in use"

**Solution:** Another process is using port 8000. Kill it or change the port:

```bash
# Use a different port (e.g., 8001)
py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

If you change the port, you'll also need to update the frontend's API URL in `frontend/src/services/api.ts` line 20.

---

### Problem: "Port 3000 is already in use"

**Solution:** Vite will automatically try port 3001, 3002, etc. Just use whatever port it suggests.

---

### Problem: Backend shows "password authentication failed"

**Solution:** Check your database credentials in `backend/.env`:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Ember1808
POSTGRES_DB=baby_data
```

Make sure these match your PostgreSQL installation.

---

### Problem: Frontend shows CORS errors

**Solution:** Make sure the backend is running first. CORS errors happen when the frontend can't reach the backend.

Also verify your backend is accessible at http://localhost:8000 by visiting http://localhost:8000/docs

---

### Problem: "Cannot connect to database"

**Solutions:**

1. **Verify PostgreSQL is running:**
   ```bash
   psql -U postgres -d baby_data
   ```

2. **Check if the database exists:**
   ```sql
   -- Inside psql
   \l
   -- You should see 'baby_data' in the list
   ```

3. **Recreate the database if needed:**
   ```bash
   # From backend directory with activated .venv
   cd backend
   .venv\Scripts\activate
   alembic upgrade head
   ```

---

### Problem: "Module not found" errors in frontend

**Solution:** Install dependencies:

```bash
cd frontend
npm install
```

---

### Problem: Backend shows Python import errors

**Solution:** Reinstall backend dependencies:

```bash
cd backend
.venv\Scripts\activate
py -m uv pip install -e .
```

---

## 📁 Quick Reference: File Locations

- **Backend code:** `c:\Users\nikil\baby-data-app-2025\backend\app\`
- **Frontend code:** `c:\Users\nikil\baby-data-app-2025\frontend\src\`
- **Database config:** `c:\Users\nikil\baby-data-app-2025\backend\.env`
- **API documentation:** http://localhost:8000/docs (when backend is running)

---

## 🎯 What You Can Do Now

1. **Log Activities:**
   - Click the "Feed", "Nappy", "Sleep", or "Growth" tabs
   - Fill in the form and click "Log [Activity]"

2. **View Timeline:**
   - All logged activities appear in the "Feed" tab
   - Today's summary shows counts and stats

3. **Analyze Data:**
   - Click "Insights" tab to see charts and trends
   - View weekly patterns and growth charts

---

## 💡 Tips for Development

- **Auto-reload:** Both backend and frontend automatically reload when you save code changes
- **View Logs:** Check the terminal windows for error messages
- **Test APIs:** Use http://localhost:8000/docs to test backend APIs directly
- **Database Admin:** Use `psql` or pgAdmin to view/edit database directly

---

## 📞 Need Help?

If you get stuck:

1. Check both terminal windows for error messages
2. Verify all 3 services are running (database, backend, frontend)
3. Try stopping everything and restarting in order
4. Check this troubleshooting section

**Common Issue:** If the app doesn't work, 99% of the time it's because the backend or database isn't running!

---

**Happy tracking! 👶📊**
