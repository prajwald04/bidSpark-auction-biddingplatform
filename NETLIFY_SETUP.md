# Netlify Environment Variable Setup Guide

## Issue
Your frontend is showing: "Backend server URL is not configured. Please contact the administrator."

This happens because the `REACT_APP_API_URL` environment variable is not set in Netlify.

## Solution: Set Environment Variable in Netlify

### Step 1: Go to Netlify Dashboard
1. Visit: https://app.netlify.com
2. Sign in to your account
3. Click on your site: **BidSpark** (or https://bidspark.netlify.app)

### Step 2: Navigate to Environment Variables
1. Click on **Site settings** (top menu)
2. In the left sidebar, click **Environment variables** (under "Build & deploy")

### Step 3: Add the Environment Variable
1. Click **Add variable** button
2. Fill in:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend-url.here` (Replace with your actual backend URL)
   - **Scopes**: Select **All scopes** (or just **Production**)
3. Click **Save**

### Step 4: Redeploy Your Site
1. Go to the **Deploys** tab (top menu)
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for the deployment to complete

## Important Notes

### You Need a Deployed Backend First!

Before setting the environment variable, you need to deploy your Spring Boot backend to a hosting service. Options:

#### Option A: Railway (Recommended - Free Tier)
- Visit: https://railway.app
- Sign up with GitHub
- Create new project → Deploy from GitHub repo
- Select: `bidSpark-auction-biddingplatform`
- Root directory: `e-auction-platform/backend-eauction`
- Add MySQL database addon
- Railway will give you a URL like: `https://your-app.up.railway.app`
- Use this URL as your `REACT_APP_API_URL`

#### Option B: Render (Free Tier)
- Visit: https://render.com
- Create new Web Service
- Connect your GitHub repo
- Build command: `cd e-auction-platform/backend-eauction && mvn clean package -DskipTests`
- Start command: `cd e-auction-platform/backend-eauction && java -jar target/backend-eauction-0.0.1-SNAPSHOT.jar`
- Render will give you a URL like: `https://your-app.onrender.com`

#### Option C: Heroku
- Visit: https://heroku.com
- Create new app
- Connect GitHub repo
- Add PostgreSQL or MySQL addon
- Deploy

## Example Environment Variable Values

Once your backend is deployed, set `REACT_APP_API_URL` to:

- Railway: `https://your-app.up.railway.app`
- Render: `https://your-app.onrender.com`
- Heroku: `https://your-app.herokuapp.com`
- Custom domain: `https://api.yourdomain.com`

**DO NOT use `http://localhost:8080` - that only works on your local machine!**

## Verification

After setting the environment variable and redeploying:
1. Visit: https://bidspark.netlify.app
2. Open browser console (F12)
3. You should see the API URL logged (if not `localhost`)
4. Try to login/signup - the error should be gone

## Troubleshooting

- **Still seeing the error?** Make sure you:
  1. Set the variable correctly (check for typos)
  2. Redeployed after setting the variable
  3. Cleared browser cache
  4. Backend is actually deployed and running

- **Backend not responding?** 
  1. Test backend URL directly in browser: `https://your-backend-url/api/auth/login`
  2. Check backend logs for errors
  3. Verify CORS allows `https://bidspark.netlify.app`
