// Database configuration and functions
class GameDatabase {
  constructor() {
    // Supabase configuration - you'll replace these with your actual values
    this.supabaseUrl = 'YOUR_SUPABASE_URL';
    this.supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
    this.supabase = null;
    this.isOnline = navigator.onLine;
    this.offlineScores = JSON.parse(localStorage.getItem('offlineScores') || '[]');

    this.initSupabase();
    this.setupOfflineHandling();
  }

  async initSupabase() {
    try {
      // Only initialize if Supabase credentials are provided
      if (this.supabaseUrl !== 'YOUR_SUPABASE_URL' && this.supabaseKey !== 'YOUR_SUPABASE_ANON_KEY') {
        // Import Supabase client (will be loaded from CDN)
        const { createClient } = supabase;
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
        console.log('✅ Database connected');
      } else {
        console.log('📱 Running in offline mode');
      }
    } catch (error) {
      console.log('📱 Database unavailable, using offline mode');
    }
  }

  setupOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Save game state to database or localStorage
  async saveGameState(gameData) {
    const gameState = {
      id: gameData.gameId || this.generateGameId(),
      players: gameData.players,
      current_round: gameData.currentRound,
      game_status: gameData.gameStatus || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.supabase && this.isOnline) {
      try {
        const { data, error } = await this.supabase.from('games').upsert(gameState).select();

        if (error) throw error;

        console.log('✅ Game saved to database');
        return data[0];
      } catch (error) {
        console.error('❌ Failed to save to database:', error);
        this.saveToLocalStorage(gameState);
      }
    } else {
      this.saveToLocalStorage(gameState);
    }
  }

  saveToLocalStorage(gameState) {
    localStorage.setItem('currentGame', JSON.stringify(gameState));

    // Add to offline queue for later sync
    this.offlineScores.push(gameState);
    localStorage.setItem('offlineScores', JSON.stringify(this.offlineScores));
    console.log('💾 Game saved offline');
  }

  // Load game state from database or localStorage
  async loadGameState(gameId = null) {
    if (this.supabase && this.isOnline && gameId) {
      try {
        const { data, error } = await this.supabase.from('games').select('*').eq('id', gameId).single();

        if (error) throw error;

        console.log('✅ Game loaded from database');
        return data;
      } catch (error) {
        console.error('❌ Failed to load from database:', error);
      }
    }

    // Fallback to localStorage
    const savedGame = localStorage.getItem('currentGame');
    if (savedGame) {
      console.log('💾 Game loaded from offline storage');
      return JSON.parse(savedGame);
    }

    return null;
  }

  // Get leaderboard/high scores
  async getLeaderboard(limit = 10) {
    if (this.supabase && this.isOnline) {
      try {
        const { data, error } = await this.supabase.from('games').select('*').eq('game_status', 'completed').order('created_at', { ascending: false }).limit(limit);

        if (error) throw error;

        return data;
      } catch (error) {
        console.error('❌ Failed to load leaderboard:', error);
      }
    }

    // Fallback to localStorage leaderboard
    const localLeaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    return localLeaderboard.slice(0, limit);
  }

  // Save completed game to leaderboard
  async saveToLeaderboard(gameData) {
    const winner = gameData.players.find((p) => !p.out) || gameData.players[0];
    const leaderboardEntry = {
      id: this.generateGameId(),
      winner_name: winner.name,
      total_rounds: gameData.currentRound - 1,
      final_score: winner.totalScore,
      players_count: gameData.players.length,
      game_duration: Date.now(), // You can calculate actual duration
      created_at: new Date().toISOString(),
    };

    if (this.supabase && this.isOnline) {
      try {
        await this.supabase.from('leaderboard').insert(leaderboardEntry);

        console.log('✅ Score saved to leaderboard');
      } catch (error) {
        console.error('❌ Failed to save to leaderboard:', error);
        this.saveLeaderboardOffline(leaderboardEntry);
      }
    } else {
      this.saveLeaderboardOffline(leaderboardEntry);
    }
  }

  saveLeaderboardOffline(entry) {
    const localLeaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    localLeaderboard.unshift(entry);

    // Keep only top 50 offline entries
    if (localLeaderboard.length > 50) {
      localLeaderboard.splice(50);
    }

    localStorage.setItem('leaderboard', JSON.stringify(localLeaderboard));
    console.log('💾 Score saved to offline leaderboard');
  }

  // Sync offline data when back online
  async syncOfflineData() {
    if (!this.supabase || this.offlineScores.length === 0) return;

    console.log('🔄 Syncing offline data...');

    for (const gameState of this.offlineScores) {
      try {
        await this.supabase.from('games').upsert(gameState);
      } catch (error) {
        console.error('❌ Failed to sync game:', error);
      }
    }

    // Clear offline queue after successful sync
    this.offlineScores = [];
    localStorage.setItem('offlineScores', JSON.stringify([]));
    console.log('✅ Offline data synced');
  }

  generateGameId() {
    return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Share game URL
  generateShareableUrl(gameId) {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?game=${gameId}`;
  }
}

// Initialize database
const gameDB = new GameDatabase();
