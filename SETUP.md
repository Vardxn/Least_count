# 🚀 Hosting Setup Guide - Least Count Game

## Free Hosting with Database (Recommended)

### Step 1: Set up Supabase (Free Database)

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign up with GitHub**
3. **Create New Project**

   - Project name: `least-count-game`
   - Database password: (create a strong password)
   - Region: Choose closest to your users

4. **Create Database Tables**
   Go to SQL Editor and run this script:

```sql
-- Games table
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  players JSONB NOT NULL,
  current_round INTEGER DEFAULT 1,
  game_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard table
CREATE TABLE leaderboard (
  id TEXT PRIMARY KEY,
  winner_name TEXT NOT NULL,
  total_rounds INTEGER NOT NULL,
  final_score INTEGER NOT NULL,
  players_count INTEGER NOT NULL,
  game_duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Public access policies (for this game)
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations on leaderboard" ON leaderboard FOR ALL USING (true);
```

5. **Get your credentials**
   - Go to Settings → API
   - Copy your `Project URL`
   - Copy your `anon public` key

### Step 2: Configure Your Game

1. **Open `database.js`**
2. **Replace the placeholders:**

```javascript
this.supabaseUrl = 'YOUR_ACTUAL_SUPABASE_URL';
this.supabaseKey = 'YOUR_ACTUAL_ANON_KEY';
```

### Step 3: Deploy to Vercel (Free Hosting)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up with GitHub**
3. **Import Repository**
   - Click "New Project"
   - Import your `Least_count` repository
4. **Deploy**
   - Leave all settings as default
   - Click "Deploy"
5. **Your game is live!**
   - Vercel will give you a URL like: `https://least-count-xxx.vercel.app`

### Alternative: Deploy to Netlify

1. **Go to [netlify.com](https://netlify.com)**
2. **Sign up with GitHub**
3. **New site from Git**
   - Choose your repository
   - Build command: (leave empty)
   - Publish directory: (leave empty)
4. **Deploy**

## 📱 Mobile App Features

Your hosted game will have:

✅ **Offline Support** - Works without internet
✅ **Database Sync** - Saves scores online when connected  
✅ **Shareable Games** - Send links to friends
✅ **Leaderboard** - See top scores from all players
✅ **Auto-Save** - Never lose your progress
✅ **Mobile-First Design** - Perfect for phones and tablets

## 🔧 Advanced Features

### Add to Home Screen (PWA)

Create a `manifest.json` file to make it installable:

```json
{
  "name": "Least Count",
  "short_name": "LeastCount",
  "description": "Premium card game scoring app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1C1C1E",
  "theme_color": "#64D2FF",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Custom Domain

Both Vercel and Netlify allow custom domains for free:

- `yourgame.com` instead of `least-count-xxx.vercel.app`

### Analytics

Add Google Analytics or Plausible to track usage.

## 🎯 Using Your Hosted Game

### For Players:

1. **Open the URL** on any device
2. **Add to Home Screen** (looks like a native app)
3. **Play offline** - works without internet
4. **Share games** - invite friends with a link
5. **View leaderboard** - compete with others

### For You:

1. **Real-time sync** - all devices stay updated
2. **Usage analytics** - see how many people play
3. **Data backup** - scores saved in the cloud
4. **Easy updates** - push changes via GitHub

## 🚨 Troubleshooting

**Database not working?**

- Check your Supabase credentials in `database.js`
- Verify the SQL tables were created correctly
- Game still works offline if database fails

**Game not loading?**

- Check browser console for errors
- Ensure all files are uploaded to hosting
- Try incognito mode to bypass cache

**Mobile issues?**

- Add viewport meta tag (already included)
- Test on actual device, not just browser mobile mode
- Check that buttons are touch-friendly (they are!)

## 💡 Next Steps

1. **Test locally** first with Live Server
2. **Set up Supabase** database
3. **Deploy to Vercel/Netlify**
4. **Share with friends**
5. **Monitor usage** and improve

Your game will be accessible worldwide and work perfectly on mobile phones! 🎮📱
