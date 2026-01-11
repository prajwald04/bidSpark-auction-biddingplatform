# Database Connection Setup Guide

## Overview
Your backend is now configured to use environment variables for database connection, making it ready for deployment to Railway, Render, or Heroku.

## Environment Variables

The application uses these environment variables (with fallbacks to local defaults):

| Variable | Default (Local) | Description |
|----------|----------------|-------------|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3306/eauction?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true` | MySQL connection URL |
| `SPRING_DATASOURCE_USERNAME` | `root` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | `1234` | Database password |
| `DATABASE_URL` | (none) | Full database URL in format: `mysql://user:password@host:port/database` |
| `JWT_SECRET` | `local-dev-secret-please-change-32-bytes-minimum-123456` | JWT signing secret (use a secure random string in production) |
| `PORT` | `8080` | Server port (auto-set by hosting platform) |

## Deployment Options

### Option 1: Railway (Recommended - Easiest)

#### Step 1: Sign up
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"

#### Step 2: Add MySQL Database
1. Click "New" → "Database" → "Add MySQL"
2. Railway will create a MySQL database automatically
3. Click on the database service to see connection details

#### Step 3: Deploy Backend
1. Click "New" → "GitHub Repo"
2. Select: `bidSpark-auction-biddingplatform`
3. Railway will detect it's a Java project
4. Click on the service to configure it

#### Step 4: Configure Environment Variables
In the backend service, go to "Variables" tab and add:

**Method 1: Use Railway's MySQL (Recommended)**
- Railway automatically provides a `MYSQL_URL` environment variable
- Add this variable:
  - `DATABASE_URL` = `${{MySQL.MYSQL_URL}}` (Railway template variable)
  - OR manually set:
    - `SPRING_DATASOURCE_URL` = (from Railway MySQL service - Connection tab)
    - `SPRING_DATASOURCE_USERNAME` = (from Railway MySQL)
    - `SPRING_DATASOURCE_PASSWORD` = (from Railway MySQL)

**Method 2: Manual Setup**
1. From Railway MySQL service → Variables tab, copy:
   - `MYSQLHOST` (hostname)
   - `MYSQLPORT` (port, usually 3306)
   - `MYSQLDATABASE` (database name)
   - `MYSQLUSER` (username)
   - `MYSQLPASSWORD` (password)
2. In your backend service → Variables, set:
   ```
   SPRING_DATASOURCE_URL=jdbc:mysql://[MYSQLHOST]:[MYSQLPORT]/[MYSQLDATABASE]?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true
   SPRING_DATASOURCE_USERNAME=[MYSQLUSER]
   SPRING_DATASOURCE_PASSWORD=[MYSQLPASSWORD]
   ```

#### Step 5: Set Other Variables
Add to backend service variables:
- `JWT_SECRET` = (generate a secure random string, minimum 32 characters)

#### Step 6: Configure Root Directory
In backend service → Settings:
- **Root Directory**: `e-auction-platform/backend-eauction`

#### Step 7: Deploy
1. Railway will automatically deploy
2. Click on the service to see the public URL (e.g., `https://bidspark-backend.up.railway.app`)
3. Copy this URL for Netlify environment variable

---

### Option 2: Render

#### Step 1: Create Web Service
1. Go to https://render.com
2. New → "Web Service"
3. Connect your GitHub repo: `bidSpark-auction-biddingplatform`

#### Step 2: Configure Build
- **Root Directory**: `e-auction-platform/backend-eauction`
- **Build Command**: `mvn clean package -DskipTests`
- **Start Command**: `java -jar target/backend-eauction-0.0.1-SNAPSHOT.jar`

#### Step 3: Add PostgreSQL Database (Render prefers PostgreSQL)
1. New → "PostgreSQL"
2. Create database
3. Render will provide connection details

#### Step 4: Add MySQL Database (If you want MySQL)
You may need to use an external MySQL provider like:
- PlanetScale (free tier)
- Aiven (free tier)
- Or use PostgreSQL instead

#### Step 5: Set Environment Variables
In your Web Service → Environment:
- `SPRING_DATASOURCE_URL` = `jdbc:mysql://[host]:[port]/[database]?useSSL=true&serverTimezone=UTC`
- `SPRING_DATASOURCE_USERNAME` = [username]
- `SPRING_DATASOURCE_PASSWORD` = [password]
- `JWT_SECRET` = [secure random string]

---

### Option 3: Heroku

#### Step 1: Install Heroku CLI
Download from: https://devcenter.heroku.com/articles/heroku-cli

#### Step 2: Login and Create App
```bash
heroku login
cd e-auction-platform/backend-eauction
heroku create bidspark-backend
```

#### Step 3: Add MySQL Database
```bash
heroku addons:create cleardb:ignite
```
Or use PostgreSQL:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

#### Step 4: Get Database URL
```bash
heroku config:get DATABASE_URL
```

#### Step 5: Set Environment Variables
```bash
heroku config:set JWT_SECRET="your-secure-random-secret-minimum-32-chars"
```

#### Step 6: Deploy
```bash
git push heroku master
```

---

## After Deployment

Once your backend is deployed:

1. **Test the backend**:
   - Visit: `https://your-backend-url.railway.app/api/auth/login`
   - Should return an error (401) which means it's working!

2. **Set Frontend Environment Variable in Netlify**:
   - Go to Netlify → Site Settings → Environment Variables
   - Add: `REACT_APP_API_URL` = `https://your-backend-url.railway.app`
   - Redeploy your Netlify site

3. **Verify CORS**:
   - Your backend already allows `https://bidspark.netlify.app`
   - Check if it works by testing login/signup

## Troubleshooting

### Database Connection Issues

**Error: "Cannot connect to database"**
- Check if database is running (Railway/Render dashboard)
- Verify environment variables are set correctly
- Check database credentials match

**Error: "Access denied"**
- Verify username and password are correct
- Check if database allows connections from your IP (hosting platforms usually handle this)

**Error: "Unknown database 'eauction'"**
- The database will be auto-created by Hibernate (ddl-auto=update)
- Or create it manually in your database service

### Port Issues

**Error: "Port already in use"**
- Railway/Render/Heroku automatically set the PORT environment variable
- Your application.properties uses `${PORT:8080}` which will use the provided PORT

## Quick Test Commands

```bash
# Test if backend is running
curl https://your-backend-url.railway.app/api/auth/login

# Should return 401 or 400 (not 404 or connection error)
```

## Security Notes

- **Never commit** `.env` files with real credentials
- Use strong JWT_SECRET in production (minimum 32 characters, random)
- Enable SSL for database connections in production (`useSSL=true`)
- Database credentials are automatically encrypted by hosting platforms
