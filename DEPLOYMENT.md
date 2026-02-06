# Remax Sky HR Deployment Guide

## 🔐 Security Fixes Applied

| Fix | Description |
|-----|-------------|
| ✅ JWT Authentication | Secure token-based auth with 7-day expiration |
| ✅ Password Hashing | bcrypt support (backward compatible) |
| ✅ Rate Limiting | 100 requests per 15 minutes per IP |
| ✅ Security Headers | Helmet.js protection |
| ✅ CORS Restriction | Production origin whitelist |
| ✅ Environment Variables | Secrets moved to .env |

---

## 📋 Prerequisites (What You Need)

| Tool | Purpose | Free? |
|------|---------|-------|
| Git | Version control | ✅ Yes |
| GitHub Account | Store your code | ✅ Yes |
| Vercel Account | Host frontend | ✅ Yes |
| Render Account | Host backend | ✅ Yes |
| Supabase Account | Database | ✅ Yes (500MB free) |

---

## 🔧 Step 0: Install Git (Windows)

### 0.1 Download Git

1. Open browser, go to: https://git-scm.com/download/win
2. The download should start automatically (64-bit version)
3. If not, click "64-bit Git for Windows Setup"

### 0.2 Install Git

1. Run the downloaded file (e.g., `Git-2.43.0-64-bit.exe`)
2. Click **Next** on all screens (default options are fine)
3. Important screens:
   - "Adjusting your PATH" → Select **"Git from the command line and also from 3rd-party software"** (default)
   - "Choosing the default editor" → Select **"Use Visual Studio Code as Git's default editor"**
   - "Adjusting the name of the initial branch" → Select **"Override the default branch name: main"**
4. Click **Install**
5. Click **Finish**

### 0.3 Verify Git Installation

1. **Close and reopen VS Code** (important!)
2. Open a new terminal in VS Code (Ctrl+`)
3. Type: `git --version`
4. Should show something like: `git version 2.43.0.windows.1`

### 0.4 Configure Git (First Time Only)

Run these commands in VS Code terminal (replace with your info):

```powershell
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

---

## 🌐 Step 1: Create GitHub Account & Repository

### 1.1 Create GitHub Account (if you don't have one)

1. Go to https://github.com
2. Click **Sign up**
3. Enter email, create password, choose username
4. Verify your email

### 1.2 Create New Repository

1. Log in to GitHub
2. Click the **+** button (top right) → **New repository**
3. Fill in:
   - **Repository name**: `remaxskymn`
   - **Description**: `HR Recruiting Application` (optional)
   - **Visibility**: 
     - ✅ **Private** (Recommended - only you can see it)
     - Public = anyone can see your code
   - **Initialize this repository with**:
     - ❌ Do NOT check "Add a README file"
     - ❌ Do NOT check "Add .gitignore" (we already have one)
     - ❌ Do NOT check "Choose a license"
4. Click **Create repository**
5. You'll see a page with instructions - keep this open!

### 1.3 Push Your Code to GitHub

Open VS Code terminal and run these commands ONE BY ONE:

```powershell
# Navigate to your project
cd c:\remaxskymn

# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit with security fixes"

# Connect to GitHub (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/remaxskymn.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 1.4 GitHub Login Popup

When you run `git push`, a popup will appear:
1. Click **"Sign in with your browser"**
2. Log in to GitHub in the browser
3. Click **"Authorize Git Credential Manager"**
4. Return to VS Code - the push should complete

### 1.5 Verify Upload

1. Refresh your GitHub repository page
2. You should see all your project files

---

## ☁️ Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. Go to https://render.com
2. Click **Get Started for Free**
3. Click **GitHub** to sign up with your GitHub account
4. Authorize Render to access your GitHub

### 2.2 Create Web Service

1. Click **New +** → **Web Service**
2. Select **"Build and deploy from a Git repository"** → **Next**
3. Find and click **Connect** next to your `remaxskymn` repository
   - If you don't see it, click "Configure account" and grant access
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `remaxskymn-api` |
| **Region** | Singapore (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Scroll down to **Environment Variables** and click **Add Environment Variable**

Add these one by one:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | (Generate: see below) |
| `CORS_ORIGIN` | `https://remaxskymn.vercel.app` (change later) |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `YourSecurePassword123!` |
| `DATABASE_MODE` | `json` (change to `supabase` later) |

### 2.3 Generate JWT Secret

In VS Code terminal, run:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```
Copy the output and paste as `JWT_SECRET` value.

### 2.4 Create Service

1. Click **Create Web Service**
2. Wait 3-5 minutes for deployment
3. When status shows **"Live"**, copy your URL:
   - Example: `https://remaxskymn-api.onrender.com`
   - Save this URL!

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Update vercel.json with Render URL

Before deploying, update the file `client/vercel.json`:

1. Open `c:\remaxskymn\client\vercel.json`
2. Replace `YOUR-RENDER-APP.onrender.com` with your actual Render URL
3. Example: `https://remaxskymn-api.onrender.com`
4. Save the file
5. Push to GitHub:

```powershell
cd c:\remaxskymn
git add .
git commit -m "Update Render URL in vercel.json"
git push
```

### 3.2 Create Vercel Account

1. Go to https://vercel.com
2. Click **Start Deploying**
3. Click **Continue with GitHub**
4. Authorize Vercel

### 3.3 Import Project

1. Click **Add New...** → **Project**
2. Find your `remaxskymn` repository and click **Import**
3. Configure:

| Setting | Value |
|---------|-------|
| **Project Name** | `remaxskymn` |
| **Framework Preset** | `Vite` |
| **Root Directory** | Click **Edit** → type `client` → click **Continue** |

4. Expand **Build and Output Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. Click **Deploy**
6. Wait 1-2 minutes
7. Click **Visit** to see your live site!
8. Copy your URL (e.g., `https://remaxskymn.vercel.app`)

### 3.4 Update Render CORS

1. Go back to Render Dashboard
2. Click on your `remaxskymn-api` service
3. Click **Environment** (left sidebar)
4. Find `CORS_ORIGIN` and update it with your Vercel URL
5. Click **Save Changes**
6. Render will automatically redeploy

---

## 🗄️ Step 4: Setup Supabase Database

**Important:** The free Render instance loses JSON data on restart. Set up Supabase for permanent storage.

### 4.1 Create Supabase Account

1. Go to https://supabase.com
2. Click **Start your project**
3. Click **Continue with GitHub**
4. Authorize Supabase

### 4.2 Create Project

1. Click **New Project**
2. Select your organization (or create one - it's free)
3. Fill in:
   - **Name**: `remaxskymn`
   - **Database Password**: Click **Generate a password** and SAVE IT!
   - **Region**: Choose closest to you
4. Click **Create new project**
5. Wait 2 minutes for setup

### 4.3 Create Tables

1. In left sidebar, click **SQL Editor**
2. Click **New query**
3. Open `c:\remaxskymn\server\supabase-schema.sql` in VS Code
4. Copy ALL contents (Ctrl+A, Ctrl+C)
5. Paste into Supabase SQL Editor
6. Click **Run** (or Ctrl+Enter)
7. Should see "Success. No rows returned"

### 4.4 Verify Tables

1. Click **Table Editor** in left sidebar
2. You should see 8 tables:
   - users, candidates, jobs, interviews
   - applications, employees, resigned_agents, agent_ranks

### 4.5 Get API Keys

1. Click **Settings** (gear icon, bottom left)
2. Click **API**
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGci...` (the long one)

### 4.6 Update Render Environment

1. Go to Render Dashboard → your `remaxskymn-api` service
2. Click **Environment**
3. Add/Update these variables:

| Key | Value |
|-----|-------|
| `DATABASE_MODE` | `supabase` |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGci...` (your key) |

4. Click **Save Changes**
5. Wait for redeploy

---

## ✅ Step 5: Test Your Deployment

1. Open your Vercel URL (e.g., `https://remaxskymn.vercel.app`)
2. Login with:
   - Username: `admin`
   - Password: The password you set in `ADMIN_PASSWORD`
3. Test creating an application, employee, etc.

---

## 🔄 Making Changes (Future Updates)

After deployment, updating is easy:

1. Make changes in VS Code
2. Save files
3. Run in terminal:

```powershell
cd c:\remaxskymn
git add .
git commit -m "Describe your changes"
git push
```

4. Both Vercel and Render automatically redeploy in ~2 minutes

---

## 💻 Edit from Another Device (VS Code Remote)

### Option 1: GitHub.dev (Easiest - No Setup!)

This is the FASTEST way to edit from any device:

1. Open browser on any device (phone, tablet, another computer)
2. Go to your GitHub repository: `https://github.com/YOUR-USERNAME/remaxskymn`
3. Press the `.` key (period) on your keyboard
4. Full VS Code editor opens in browser!
5. Make your changes
6. Click the Source Control icon (left sidebar, branch icon)
7. Enter a commit message and click ✓ to commit
8. Changes are automatically pushed to GitHub → auto-deploy!

**No installation needed. Works on any device with a browser.**

### Option 2: GitHub Codespaces (Full Development Environment)

Free: 60 hours/month (plenty for occasional use)

1. Go to your GitHub repository
2. Click green **Code** button
3. Click **Codespaces** tab
4. Click **Create codespace on main**
5. Wait 1-2 minutes for setup
6. Full VS Code with terminal opens in browser!
7. You can run `npm run dev` and test changes
8. All changes auto-save to GitHub

### Option 3: VS Code Desktop with GitHub

If you have VS Code installed on another computer:

1. Install VS Code: https://code.visualstudio.com
2. Install Git (see Step 0)
3. Clone your repository:
   ```powershell
   git clone https://github.com/YOUR-USERNAME/remaxskymn.git
   cd remaxskymn
   npm run install:all
   npm run dev
   ```
4. Make changes, commit, push - same workflow as your main PC

---

## 🔒 About SSL Certificates (HTTPS)

**Good news: You don't need to do anything!**

| Service | SSL/HTTPS | Certificate |
|---------|-----------|-------------|
| Vercel | ✅ Automatic | Free, auto-renewed |
| Render | ✅ Automatic | Free, auto-renewed |
| Supabase | ✅ Automatic | Free, auto-renewed |

Your deployed app will automatically have:
- `https://remaxskymn.vercel.app` (frontend)
- `https://remaxskymn-api.onrender.com` (backend)

Both are secure HTTPS connections with valid SSL certificates. **No action required.**

---

## ❓ Common Questions

### Q: Is my repository safe as Private?
**Yes.** Private means:
- Only you can see the code
- Only you can deploy from it
- Render/Vercel can only access it because you authorized them

### Q: Do I need a credit card?
**No.** All services have free tiers that don't require payment info:
- GitHub: Free private repos
- Vercel: Free hobby tier
- Render: Free tier (750 hrs/month)
- Supabase: Free tier (500MB)

### Q: What happens if I exceed free limits?
- **Render**: Service stops, resumes next month
- **Vercel**: May slow down, upgrade prompt
- **Supabase**: Database becomes read-only

For 10k records and normal usage, you'll stay within free limits.

### Q: How do I check my usage?
- Render: Dashboard → Settings → Billing
- Vercel: Dashboard → Usage
- Supabase: Dashboard → Settings → Usage

---

## ⚠️ Important Notes

### Free Tier Limitations

| Service | Limit | What Happens |
|---------|-------|--------------|
| Render | Sleeps after 15min inactivity | First request takes ~30 seconds to wake up |
| Render | 750 hours/month | Enough for one always-on app |
| Vercel | 100GB bandwidth/month | Plenty for 10k users |
| Supabase | 500MB database | Enough for ~100k records |

### Render Sleep Mode

The free Render instance "sleeps" after 15 minutes of no requests. When someone visits your app:
1. First request: ~30 second delay (waking up)
2. Subsequent requests: Fast (normal speed)
3. After 15 min idle: Goes back to sleep

**Tip:** This is fine for development. For production, consider Render's $7/month "Starter" plan.

---

## 📞 Support & Dashboard Links

| Service | Dashboard URL |
|---------|---------------|
| GitHub | https://github.com/YOUR-USERNAME/remaxskymn |
| Vercel | https://vercel.com/dashboard |
| Render | https://dashboard.render.com |
| Supabase | https://supabase.com/dashboard |

---

## 🎉 Congratulations!

You now have a fully deployed HR application with:
- ✅ Secure authentication (JWT)
- ✅ HTTPS encryption (automatic)
- ✅ PostgreSQL database (Supabase)
- ✅ Auto-deployment from GitHub
- ✅ Editable from any device
