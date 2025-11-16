class UIManager {
  constructor(gameLogic) {
    this.gameLogic = gameLogic;
    this.editModeData = {};
    this.elements = {
      playersList: document.getElementById('playersList'),
      roundCounter: document.getElementById('roundCounter'),
      undoBtn: document.getElementById('undoBtn'),
      eliminationScore: document.getElementById('eliminationScore'),
    };
    this.setupEventListeners();
  }

  getProgressColor(percentage) {
    if (percentage <= 30) return '#10B981'; // Green
    if (percentage <= 60) return '#F59E0B'; // Yellow
    if (percentage <= 85) return '#F97316'; // Orange
    return '#EF4444'; // Red
  }

  setupEventListeners() {
    document.getElementById('newGameBtn').addEventListener('click', () => this.handleNewGame());
    document.getElementById('addRoundBtn').addEventListener('click', () => this.handleNextRound());
    document.getElementById('undoBtn').addEventListener('click', () => this.handleUndo());
    document.getElementById('resetBtn').addEventListener('click', () => this.handleReset());
    document.getElementById('leaderboardBtn').addEventListener('click', () => this.showLeaderboard());

    // Handle elimination score changes
    if (this.elements.eliminationScore) {
      this.elements.eliminationScore.addEventListener('input', (e) => {
        const newScore = parseInt(e.target.value, 10);
        if (!isNaN(newScore) && newScore >= 50 && newScore <= 500) {
          this.gameLogic.updateEliminationScore(newScore);
          this.renderPlayers(); // Re-render to update elimination status and displays
        }
      });
    }
  }

  showAddPlayerPrompt() {
    let promptDiv = document.getElementById('addPlayerPrompt');
    if (!promptDiv) {
      promptDiv = document.createElement('div');
      promptDiv.id = 'addPlayerPrompt';
      promptDiv.style.marginTop = '1em';
      promptDiv.style.textAlign = 'center';
      promptDiv.innerHTML = `
                <input type="text" id="playerName" placeholder="Player Name" style="padding: 10px; margin: 5px; border-radius: 6px; border: 1px solid #d1d5db;">
                <button id="confirmAddPlayer" style="padding: 10px 20px; margin: 5px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">Add</button>
                <button id="cancelAddPlayer" style="padding: 10px 20px; margin: 5px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
            `;
      document.querySelector('.landing-container').appendChild(promptDiv);

      document.getElementById('playerName').focus();

      document.getElementById('confirmAddPlayer').onclick = () => {
        const name = document.getElementById('playerName').value.trim();
        if (name) {
          const usedAvatars = this.gameLogic.players.map((p) => p.picUrl);
          let avatarIdx = this.gameLogic.avatarImages.findIndex((img) => !usedAvatars.includes(img));
          if (avatarIdx === -1) avatarIdx = this.gameLogic.players.length % this.gameLogic.avatarImages.length;

          this.gameLogic.addPlayer(name, this.gameLogic.avatarImages[avatarIdx]);
          this.renderPlayers();
          promptDiv.remove();
        }
      };

      document.getElementById('cancelAddPlayer').onclick = () => promptDiv.remove();
    }
  }

  renderPlayers() {
    this.elements.playersList.innerHTML = '';

    this.gameLogic.players.forEach((player, idx) => {
      const div = document.createElement('div');
      div.className = `player-card${player.out ? ' eliminated' : ''}`;

      const scoreInputHTML = `
        <input type="tel" class="score-input" data-idx="${idx}" placeholder="Enter score" value="${player.count > 0 ? player.count : ''}" ${player.out ? 'disabled' : ''} inputmode="numeric" pattern="[0-9]*" min="0" max="40">
        <button class="add-score-btn" data-idx="${idx}" ${player.out ? 'disabled' : ''}>Add</button>
      `;

      // Generate round history HTML
      const roundHistoryHTML =
        player.roundHistory.length > 0
          ? `
        <div class="round-history-container">
          <button class="toggle-history-btn" data-idx="${idx}">
            <span class="history-icon">📊</span> View Previous Rounds
          </button>
          <div class="round-history-content" id="history-${idx}" style="display: none;">
            <div class="round-history-header">
              <h4>Round History</h4>
              <button class="edit-history-btn" data-idx="${idx}">Edit Scores</button>
            </div>
            <div class="round-history-list">
              ${player.roundHistory
                .map(
                  (score, roundIdx) => `
                <div class="round-item" data-player="${idx}" data-round="${roundIdx}">
                  <span class="round-label">R${roundIdx + 1}:</span>
                  <span class="round-score" data-original="${score}">${score}</span>
                  <input type="number" class="round-edit-input" value="${score}" style="display: none;" min="0" max="200">
                </div>
              `
                )
                .join('')}
            </div>
            <div class="edit-controls" style="display: none;">
              <button class="save-history-btn" data-idx="${idx}">Save Changes</button>
              <button class="cancel-history-btn" data-idx="${idx}">Cancel</button>
            </div>
          </div>
        </div>
      `
          : '';

      const eliminatedLabel = player.out ? '<div class="eliminated-label">❌ Eliminated</div>' : '';

      // Create progress ring for avatar - Safari compatible
      const progressPercentage = Math.min((player.totalScore / this.gameLogic.eliminationScore) * 100, 100);
      const strokeColor = this.getProgressColor(progressPercentage);
      const circumference = 2 * Math.PI * 26;
      const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

      const progressRing = `
        <div class="avatar-container">
          <svg class="progress-ring" width="66" height="66" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
            <circle cx="33" cy="33" r="26" stroke="rgba(255,255,255,0.1)" stroke-width="3" fill="none"/>
            <circle cx="33" cy="33" r="26" stroke="${strokeColor}" stroke-width="3" fill="none" 
                    stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}"
                    stroke-linecap="round" transform="rotate(-90 33 33)"
                    style="transition: stroke-dashoffset 0.5s ease, stroke 0.5s ease; transform-origin: center;"/>
          </svg>
          <img src="${player.picUrl}" alt="${player.name}" class="player-avatar" loading="lazy" decoding="async">
        </div>
      `;

      div.innerHTML = `
        <div class="player-header">
          ${progressRing}
          <div class="player-info">
            <span class="player-name">${player.name}</span>
            ${eliminatedLabel}
          </div>
        </div>
        <div class="player-scoring">
          ${scoreInputHTML}
          <div class="total-score">Total: ${player.totalScore}/${this.gameLogic.eliminationScore}</div>
        </div>
        ${roundHistoryHTML}
      `;

      this.elements.playersList.appendChild(div);
    });

    this.setupPlayerEventListeners();
    this.setupHistoryEventListeners();
    this.updateRoundCounter();
  }

  setupPlayerEventListeners() {
    // Handle score input changes
    document.querySelectorAll('.score-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        let score = parseInt(e.target.value, 10) || 0;
        
        // Enforce max limit of 40
        if (score > 40) {
          score = 40;
          e.target.value = 40;
        }
        
        if (!isNaN(idx)) {
          this.gameLogic.updatePlayerScore(idx, score);
          // Update the total score display immediately
          const totalScoreEl = e.target.parentElement.querySelector('.total-score');
          if (totalScoreEl) {
            const player = this.gameLogic.players[idx];
            totalScoreEl.textContent = `Total: ${player.totalScore + score}/${this.gameLogic.eliminationScore}`;
          }
        }
      });
    });

    // Handle add score button clicks
    document.querySelectorAll('.add-score-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        const scoreInput = document.querySelector(`.score-input[data-idx="${idx}"]`);
        let score = parseInt(scoreInput.value, 10);

        if (!isNaN(score) && score >= 0) {
          // Enforce max limit of 40
          if (score > 40) {
            score = 40;
            modalManager.showWarning('Score Limit', 'Maximum score per round is 40 points.');
          }
          this.gameLogic.updatePlayerScore(idx, score);
          scoreInput.value = '';
          this.renderPlayers();
        }
      });
    });

    // Handle enter key in score inputs
    document.querySelectorAll('.score-input').forEach((input) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const idx = parseInt(input.getAttribute('data-idx'));
          const addBtn = document.querySelector(`.add-score-btn[data-idx="${idx}"]`);
          if (addBtn) addBtn.click();
        }
      });
    });
  }

  setupHistoryEventListeners() {
    // Toggle history visibility
    document.querySelectorAll('.toggle-history-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        const historyContent = document.getElementById(`history-${idx}`);
        const isVisible = historyContent.style.display !== 'none';

        historyContent.style.display = isVisible ? 'none' : 'block';
        btn.innerHTML = isVisible ? '<span class="history-icon">📊</span> View Previous Rounds' : '<span class="history-icon">📊</span> Hide Previous Rounds';
      });
    });

    // Edit history mode
    document.querySelectorAll('.edit-history-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.enterHistoryEditMode(idx);
      });
    });

    // Save history changes
    document.querySelectorAll('.save-history-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.saveHistoryChanges(idx);
      });
    });

    // Cancel history editing
    document.querySelectorAll('.cancel-history-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.cancelHistoryEdit(idx);
      });
    });
  }

  enterHistoryEditMode(playerIdx) {
    const historyContent = document.getElementById(`history-${playerIdx}`);
    const roundItems = historyContent.querySelectorAll('.round-item');
    const editControls = historyContent.querySelector('.edit-controls');
    const editBtn = historyContent.querySelector('.edit-history-btn');

    // Show edit controls and hide edit button
    editControls.style.display = 'flex';
    editBtn.style.display = 'none';

    // Show input fields and hide display values
    roundItems.forEach((item) => {
      const scoreSpan = item.querySelector('.round-score');
      const scoreInput = item.querySelector('.round-edit-input');
      scoreSpan.style.display = 'none';
      scoreInput.style.display = 'inline-block';
    });
  }

  saveHistoryChanges(playerIdx) {
    const historyContent = document.getElementById(`history-${playerIdx}`);
    const roundItems = historyContent.querySelectorAll('.round-item');
    const player = this.gameLogic.players[playerIdx];

    // Save the current state for undo functionality
    this.gameLogic.saveGameState();

    let hasChanges = false;
    roundItems.forEach((item, roundIdx) => {
      const scoreInput = item.querySelector('.round-edit-input');
      const newScore = parseInt(scoreInput.value, 10) || 0;
      const oldScore = player.roundHistory[roundIdx];

      if (newScore !== oldScore) {
        player.roundHistory[roundIdx] = newScore;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      // Use the new game logic method to recalculate and check elimination
      this.gameLogic.recalculatePlayerTotal(playerIdx);
    }

    this.exitHistoryEditMode(playerIdx);
    this.renderPlayers();
  }

  cancelHistoryEdit(playerIdx) {
    this.exitHistoryEditMode(playerIdx);
  }

  exitHistoryEditMode(playerIdx) {
    const historyContent = document.getElementById(`history-${playerIdx}`);
    const roundItems = historyContent.querySelectorAll('.round-item');
    const editControls = historyContent.querySelector('.edit-controls');
    const editBtn = historyContent.querySelector('.edit-history-btn');

    // Hide edit controls and show edit button
    editControls.style.display = 'none';
    editBtn.style.display = 'inline-block';

    // Hide input fields and show display values
    roundItems.forEach((item) => {
      const scoreSpan = item.querySelector('.round-score');
      const scoreInput = item.querySelector('.round-edit-input');
      const originalScore = scoreSpan.getAttribute('data-original');

      scoreSpan.style.display = 'inline';
      scoreInput.style.display = 'none';
      scoreInput.value = originalScore; // Reset to original value if cancelled
    });
  }

  // This function is no longer needed with persistent input fields
  // showScoreInput(playerIdx, container) { ... }

  enterEditMode(playerIdx) {
    this.editModeData[playerIdx] = {
      roundHistory: [...this.gameLogic.players[playerIdx].roundHistory],
      totalScore: this.gameLogic.players[playerIdx].totalScore,
    };

    const playerCard = document.querySelectorAll('.player')[playerIdx];
    playerCard.classList.add('edit-mode');

    const editBtn = playerCard.querySelector('.edit-player-btn');
    const editControls = playerCard.querySelector('.edit-controls');
    editBtn.style.display = 'none';
    editControls.style.display = 'flex';

    const roundHistoryItems = playerCard.querySelectorAll('.round-history-item');
    roundHistoryItems.forEach((item, roundNum) => {
      const currentScore = this.gameLogic.players[playerIdx].roundHistory[roundNum];

      // Use InputHandler to create optimized input
      const input = window.inputHandler ? window.inputHandler.createOptimizedInput('tel', '') : document.createElement('input');

      if (!window.inputHandler) {
        // Fallback if InputHandler not available
        input.type = 'tel';
      }

      input.value = currentScore;
      input.className = 'round-edit-input';
      input.setAttribute('data-round', roundNum);
      input.setAttribute('min', '0');
      input.setAttribute('inputmode', 'numeric');
      input.setAttribute('pattern', '[0-9]*');
      input.setAttribute('minlength', '1');
      input.setAttribute('maxlength', '3');
      input.style.fontSize = '16px'; // Force 16px to allow zoom on focus

      input.addEventListener('input', () => this.updateLiveTotalScore(playerIdx));

      const roundLabel = roundNum === 0 ? 'Round 1' : `R${roundNum + 1}`;
      item.innerHTML = `${roundLabel}: `;
      item.appendChild(input);
    });
  }

  updateLiveTotalScore(playerIdx) {
    const playerCard = document.querySelectorAll('.player')[playerIdx];
    const roundInputs = playerCard.querySelectorAll('.round-edit-input');
    let newTotal = 0;

    roundInputs.forEach((input) => {
      newTotal += parseInt(input.value) || 0;
    });

    const totalScoreElement = playerCard.querySelector('.total-score-value');
    totalScoreElement.textContent = newTotal;

    const progressColor = this.gameLogic.getProgressColor(newTotal);
    const progressCircle = playerCard.querySelector('.avatar-progress circle:last-child');
    progressCircle.setAttribute('stroke', progressColor);

    const circumference = 2 * Math.PI * 26;
    const progress = Math.min(newTotal, this.gameLogic.eliminationScore);
    const offset = circumference * (1 - progress / this.gameLogic.eliminationScore);
    progressCircle.style.strokeDashoffset = offset;
  }

  saveEditMode(playerIdx) {
    this.gameLogic.saveGameState();

    const playerCard = document.querySelectorAll('.player')[playerIdx];
    const roundInputs = playerCard.querySelectorAll('.round-edit-input');

    let newTotal = 0;
    roundInputs.forEach((input, roundNum) => {
      const newValue = parseInt(input.value) || 0;
      this.gameLogic.players[playerIdx].roundHistory[roundNum] = newValue;
      newTotal += newValue;
    });

    this.gameLogic.players[playerIdx].totalScore = newTotal;

    if (newTotal >= this.gameLogic.eliminationScore && !this.gameLogic.players[playerIdx].out) {
      this.gameLogic.players[playerIdx].out = true;
      this.showConfetti();
      setTimeout(() => {
        modalManager.showError('Player Eliminated!', `${this.gameLogic.players[playerIdx].name} has been eliminated! 💥`);
      }, 500);
    } else if (newTotal < this.gameLogic.eliminationScore && this.gameLogic.players[playerIdx].out) {
      this.gameLogic.players[playerIdx].out = false;
    }

    delete this.editModeData[playerIdx];
    this.renderPlayers();
  }

  cancelEditMode(playerIdx) {
    if (this.editModeData[playerIdx]) {
      this.gameLogic.players[playerIdx].roundHistory = this.editModeData[playerIdx].roundHistory;
      this.gameLogic.players[playerIdx].totalScore = this.editModeData[playerIdx].totalScore;
      delete this.editModeData[playerIdx];
    }
    this.renderPlayers();
  }

  updateRoundCounter() {
    this.elements.roundCounter.textContent = `Round ${this.gameLogic.currentRound}`;
    this.elements.undoBtn.disabled = this.gameLogic.gameHistory.length === 0;
    
    // Hide quick tips card after round 1
    const quickTipsCard = document.getElementById('quickTipsCard');
    if (quickTipsCard && this.gameLogic.currentRound > 1) {
      quickTipsCard.style.display = 'none';
    }
  }

  handleNextRound() {
    const eliminatedPlayers = this.gameLogic.completeRound();

    if (eliminatedPlayers === false) {
      modalManager.showWarning('No Scores Added', 'Please add scores for players before completing the round.');
      return;
    }

    if (eliminatedPlayers.length > 0) {
      this.showConfetti();
      setTimeout(() => {
        const playerText = eliminatedPlayers.length === 1 ? 'Player' : 'Players';
        modalManager.showError(`${playerText} Eliminated!`, `${eliminatedPlayers.join(', ')} eliminated! 💥`);
      }, 500);
    }

    this.updateRoundCounter();
    this.renderPlayers();

    const winner = this.gameLogic.getWinner();
    if (winner) {
      setTimeout(async () => {
        await gameDB.saveToLeaderboard({
          players: this.gameLogic.players,
          currentRound: this.gameLogic.currentRound,
          gameStatus: 'completed',
        });

        this.showConfetti();
        modalManager.showCelebration('🎉 Game Complete! 🎉', `${winner.name} wins the game!`);
      }, 1000);
    } else {
      const completedRoundLabel = this.gameLogic.currentRound - 1 === 1 ? 'Round 1' : `Round ${this.gameLogic.currentRound - 1}`;
      const nextRoundLabel = `Round ${this.gameLogic.currentRound}`;
      modalManager.showSuccess('Round Complete!', `${completedRoundLabel} completed! Starting ${nextRoundLabel}`);
      
      // Show bottom action bar on mobile after round completion
      setTimeout(() => {
        if (typeof showBottomActionBar === 'function') {
          showBottomActionBar();
        }
      }, 100);
    }
  }

  handleUndo() {
    if (this.gameLogic.undoLastAction()) {
      this.updateRoundCounter();
      this.renderPlayers();
    }
  }

  handleReset() {
    const resetOptions = `
      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
        <button id="resetScores" style="padding: 14px 20px; background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer;">
          Reset Scores Only
        </button>
        <button id="resetNames" style="padding: 14px 20px; background: linear-gradient(135deg, #F59E0B, #D97706); color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer;">
          Change Player Names
        </button>
        <button id="resetAll" style="padding: 14px 20px; background: linear-gradient(135deg, #EF4444, #DC2626); color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer;">
          Reset Everything
        </button>
      </div>
    `;
    
    modalManager.showCustom('Reset Options', resetOptions);
    
    // Add event listeners after modal is shown
    setTimeout(() => {
      document.getElementById('resetScores')?.addEventListener('click', () => {
        this.gameLogic.resetGame();
        this.updateRoundCounter();
        this.renderPlayers();
        modalManager.closeModal();
        modalManager.showSuccess('Scores Reset!', 'Starting fresh with Round 1.');
      });
      
      document.getElementById('resetNames')?.addEventListener('click', () => {
        localStorage.removeItem('hasCompletedSetup');
        localStorage.removeItem('playerCount');
        modalManager.closeModal();
        location.reload();
      });
      
      document.getElementById('resetAll')?.addEventListener('click', () => {
        this.gameLogic.resetGame();
        localStorage.removeItem('hasCompletedSetup');
        localStorage.removeItem('playerCount');
        localStorage.removeItem('currentGame');
        modalManager.closeModal();
        location.reload();
      });
    }, 100);
  }

  handleNewGame() {
    modalManager.showConfirm(
      'Start New Game?',
      'This will clear all current progress and let you choose players again.',
      () => {
        // Clear all game data
        this.gameLogic.resetGame();
        localStorage.removeItem('hasCompletedSetup');
        localStorage.removeItem('playerCount');
        localStorage.removeItem('currentGame');
        localStorage.removeItem('offlineScores');
        
        // Reload to show setup screen
        location.reload();
      }
    );
  }

  async showLeaderboard() {
    // Build scoreboard table showing all players and their round scores
    const players = this.gameLogic.players;
    const maxRounds = Math.max(...players.map(p => p.roundHistory.length), 0);
    
    if (maxRounds === 0) {
      modalManager.createModal({
        title: '📊 Scoreboard',
        message: '<div class="leaderboard-empty">No rounds played yet.<br>Start playing to see scores!</div>',
        type: 'info',
        primaryButton: 'Close',
      });
      return;
    }

    // Build table header
    let tableHtml = `
      <div class="scoreboard-container">
        <table class="scoreboard-table">
          <thead>
            <tr>
              <th class="player-col">Player</th>`;
    
    // Add round columns
    for (let i = 0; i < maxRounds; i++) {
      tableHtml += `<th class="round-col">R${i + 1}</th>`;
    }
    
    tableHtml += `<th class="total-col">Total</th>
            </tr>
          </thead>
          <tbody>`;
    
    // Add player rows
    players.forEach((player, idx) => {
      const isEliminated = player.out;
      const rowClass = isEliminated ? 'eliminated-row' : '';
      
      tableHtml += `<tr class="${rowClass}">
        <td class="player-name-cell">
          <img src="${player.picUrl}" class="scoreboard-avatar" alt="${player.name}">
          <span>${player.name}</span>
          ${isEliminated ? '<span class="eliminated-badge">OUT</span>' : ''}
        </td>`;
      
      // Add scores for each round
      for (let i = 0; i < maxRounds; i++) {
        const score = player.roundHistory[i] !== undefined ? player.roundHistory[i] : '-';
        const scoreClass = score !== '-' && score > 0 ? 'score-cell' : 'empty-cell';
        tableHtml += `<td class="${scoreClass}">${score}</td>`;
      }
      
      // Add total score
      const totalClass = player.totalScore >= this.gameLogic.eliminationScore ? 'total-eliminated' : 'total-safe';
      tableHtml += `<td class="total-score-cell ${totalClass}">${player.totalScore}</td>
      </tr>`;
    });
    
    tableHtml += `
          </tbody>
        </table>
      </div>`;

    modalManager.createModal({
      title: '📊 Game Scoreboard',
      message: tableHtml,
      type: 'info',
      primaryButton: 'Close',
      customClass: 'scoreboard-modal',
    });
  }

  async handleSave() {
    if (!this.gameLogic.currentGameId) {
      this.gameLogic.currentGameId = gameDB.generateGameId();
    }

    await gameDB.saveGameState({
      gameId: this.gameLogic.currentGameId,
      players: this.gameLogic.players,
      currentRound: this.gameLogic.currentRound,
      gameStatus: 'active',
    });

    const shareUrl = gameDB.generateShareableUrl(this.gameLogic.currentGameId);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Least Count Game',
          text: 'Join my Least Count game!',
          url: shareUrl,
        });
        modalManager.showSuccess('Game Shared!', 'Invite sent successfully.');
      } catch (error) {
        this.copyToClipboard(shareUrl);
      }
    } else {
      this.copyToClipboard(shareUrl);
    }
  }

  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => modalManager.showSuccess('Game Saved!', 'Share link copied to clipboard.'))
        .catch(() => this.showManualCopy(text));
    } else {
      this.showManualCopy(text);
    }
  }

  showManualCopy(text) {
    modalManager.createModal({
      title: 'Share Game',
      message: `Copy this link to share your game:<br><br><input type="text" value="${text}" readonly style="width: 100%; padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: white;" onclick="this.select()">`,
      type: 'info',
      primaryButton: 'Close',
    });
  }

  showConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-burst';
    document.body.appendChild(confetti);

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.left = Math.random() * 100 + 'vw';
      particle.style.animationDelay = Math.random() * 2 + 's';
      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 3000);
    }

    setTimeout(() => confetti.remove(), 1500);
  }
}
