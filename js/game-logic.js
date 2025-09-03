class GameLogic {
  constructor() {
    this.players = [
      { name: 'Player 1', picUrl: 'avatars/avatars.png', count: 0, totalScore: 0, roundHistory: [], out: false, hasScoredThisRound: false },
      { name: 'Player 2', picUrl: 'avatars/boy.png', count: 0, totalScore: 0, roundHistory: [], out: false, hasScoredThisRound: false },
      { name: 'Player 3', picUrl: 'avatars/male-cartoon.png', count: 0, totalScore: 0, roundHistory: [], out: false, hasScoredThisRound: false },
      { name: 'Player 4', picUrl: 'avatars/male.png', count: 0, totalScore: 0, roundHistory: [], out: false, hasScoredThisRound: false },
    ];
    this.currentRound = 1;
    this.gameHistory = [];
    this.lastRoundScores = [];
    this.currentGameId = null;
    this.eliminationScore = 100;
    this.avatarImages = ['avatars/avatars.png', 'avatars/boy.png', 'avatars/male-cartoon.png', 'avatars/male.png', 'avatars/man.png', 'avatars/people.png', 'avatars/user.png', 'avatars/avatar.png'];
  }

  addPlayer(name, picUrl) {
    this.saveGameState();
    this.players.push({
      name,
      picUrl,
      count: 0,
      totalScore: 0,
      roundHistory: [],
      out: false,
      hasScoredThisRound: false,
    });
  }

  removePlayer(index) {
    if (this.players.length > 2) {
      this.saveGameState();
      this.players.splice(index, 1);
      return true;
    }
    return false;
  }

  updatePlayerScore(playerIndex, score) {
    if (this.players[playerIndex].out) return;
    // This function now SETS the score for the round, not adds to it.
    this.players[playerIndex].count = score;
    this.players[playerIndex].hasScoredThisRound = score > 0;
  }

  updateEliminationScore(newScore) {
    this.eliminationScore = newScore;
    // Re-check elimination status for all players
    this.players.forEach((player) => {
      if (player.totalScore >= this.eliminationScore && !player.out) {
        player.out = true;
      } else if (player.totalScore < this.eliminationScore && player.out) {
        player.out = false;
      }
    });
  }

  recalculatePlayerTotal(playerIndex) {
    const player = this.players[playerIndex];
    player.totalScore = player.roundHistory.reduce((sum, score) => sum + score, 0);

    // Check elimination status
    if (player.totalScore >= this.eliminationScore && !player.out) {
      player.out = true;
    } else if (player.totalScore < this.eliminationScore && player.out) {
      player.out = false;
    }
  }

  completeRound() {
    const hasScores = this.players.some((player) => player.count > 0);
    if (!hasScores) return false;

    this.saveGameState();
    const eliminatedPlayers = [];

    this.players.forEach((player) => {
      player.roundHistory.push(player.count);
      player.totalScore += player.count;

      if (player.totalScore >= this.eliminationScore && !player.out) {
        player.out = true;
        eliminatedPlayers.push(player.name);
      }

      player.count = 0;
      player.hasScoredThisRound = false;
    });

    this.currentRound++;
    return eliminatedPlayers;
  }

  resetGame() {
    this.players.forEach((player) => {
      player.count = 0;
      player.totalScore = 0;
      player.roundHistory = [];
      player.out = false;
      player.hasScoredThisRound = false;
    });
    this.currentRound = 1;
    this.gameHistory = [];
    this.lastRoundScores = [];
  }

  getActivePlayers() {
    return this.players.filter((p) => !p.out);
  }

  getWinner() {
    const activePlayers = this.getActivePlayers();
    return activePlayers.length === 1 ? activePlayers[0] : null;
  }

  saveGameState() {
    this.gameHistory.push({
      players: JSON.parse(JSON.stringify(this.players)),
      currentRound: this.currentRound,
      lastRoundScores: [...this.lastRoundScores],
    });

    if (this.gameHistory.length > 10) {
      this.gameHistory.shift();
    }
  }

  undoLastAction() {
    if (this.gameHistory.length > 0) {
      const previousState = this.gameHistory.pop();
      this.players = previousState.players;
      this.currentRound = previousState.currentRound;
      this.lastRoundScores = previousState.lastRoundScores;
      return true;
    }
    return false;
  }

  getProgressColor(score) {
    if (score >= this.eliminationScore) return '#e74c3c';
    if (score < this.eliminationScore * 0.5) return '#2ecc40';
    if (score < this.eliminationScore * 0.8) return '#f1c40f';
    return '#e74c3c';
  }

  getCountClass(count) {
    if (count >= this.eliminationScore) return 'count-max';
    if (count < this.eliminationScore * 0.5) return 'count-green';
    if (count < this.eliminationScore * 0.8) return 'count-yellow';
    return 'count-red';
  }
}
