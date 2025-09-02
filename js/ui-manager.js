class UIManager {
  constructor(gameLogic) {
    this.gameLogic = gameLogic;
    this.editModeData = {};
    this.elements = {
      playersList: document.getElementById('playersList'),
      roundCounter: document.getElementById('roundCounter'),
      undoBtn: document.getElementById('undoBtn'),
      addPlayerForm: document.getElementById('addPlayerForm'),
    };
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('showAddPlayerInput').addEventListener('click', () => this.showAddPlayerPrompt());
    document.getElementById('addRoundBtn').addEventListener('click', () => this.handleNextRound());
    document.getElementById('undoBtn').addEventListener('click', () => this.handleUndo());
    document.getElementById('resetBtn').addEventListener('click', () => this.handleReset());
    document.getElementById('leaderboardBtn').addEventListener('click', () => this.showLeaderboard());
    document.getElementById('saveBtn').addEventListener('click', () => this.handleSave());
  }

  showAddPlayerPrompt() {
    let promptDiv = document.getElementById('addPlayerPrompt');
    if (!promptDiv) {
      promptDiv = document.createElement('div');
      promptDiv.id = 'addPlayerPrompt';
      promptDiv.style.marginTop = '1em';
      promptDiv.innerHTML = `
                <input type="text" id="playerName" placeholder="Player Name">
                <button id="confirmAddPlayer">Add</button>
                <button id="cancelAddPlayer">Cancel</button>
            `;
      this.elements.addPlayerForm.appendChild(promptDiv);

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
      div.className = 'player' + (player.out ? ' out' : ' highlight');

      const circumference = 2 * Math.PI * 26;
      const progress = Math.min(player.totalScore, this.gameLogic.eliminationScore);
      const offset = circumference * (1 - progress / this.gameLogic.eliminationScore);

      const progressRing = `
                <svg class="avatar-progress" width="56" height="56">
                    <circle cx="28" cy="28" r="26" stroke="#e0eafc" stroke-width="4" fill="none"/>
                    <circle cx="28" cy="28" r="26" stroke="${this.gameLogic.getProgressColor(player.totalScore)}" 
                            stroke-width="4" fill="none" stroke-dasharray="${circumference}" 
                            stroke-dashoffset="${offset}"/>
                </svg>
            `;

      const countClass = this.gameLogic.getCountClass(player.totalScore);
      const lastScore = this.gameLogic.lastRoundScores[idx] || 0;
      const lastRoundLabel = this.gameLogic.currentRound - 1 === 1 ? 'Round 1' : `R${this.gameLogic.currentRound - 1}`;
      const lastRoundBadge = lastScore !== 0 ? `<span class="last-round-badge">${lastRoundLabel}: +${lastScore}</span>` : '';

      const roundHistoryHtml =
        player.roundHistory.length > 0
          ? `<div class="round-history-label">Previous Rounds:</div>` +
            player.roundHistory
              .map((score, roundNum) => {
                const roundLabel = roundNum === 0 ? 'Round 1' : `R${roundNum + 1}`;
                return `<div class="round-history-item" data-round="${roundNum}">${roundLabel}: ${score}</div>`;
              })
              .join('')
          : '';

      div.innerHTML = `
                <button class="remove-player-btn" data-idx="${idx}">×</button>
                <button class="edit-player-btn" data-idx="${idx}" title="Edit Scores">Edit</button>
                <div class="avatar-ring">
                    <img src="${player.picUrl}" alt="Profile">
                    ${progressRing}
                </div>
                <div class="player-info">
                    <div class="player-name" data-idx="${idx}">${player.name}</div>
                    ${lastRoundBadge}
                    <div class="round-history">${roundHistoryHtml}</div>
                    <div class="click-to-add-container" data-idx="${idx}" ${player.out ? 'style="pointer-events: none; opacity: 0.5;"' : ''}>
                        <div class="click-to-add-text">Click to add score</div>
                        <div class="current-score-display">
                            <span class="score-value" id="score_${idx}">${player.count}</span>
                        </div>
                    </div>
                    <div class="player-count ${countClass}">
                        ${this.gameLogic.currentRound === 1 ? 'Round 1' : `R${this.gameLogic.currentRound}`}: 
                        <span class="score-value">${player.count}</span>
                    </div>
                    <div class="player-total-display">
                        Total Score: <span class="total-score-value" data-idx="${idx}">${player.totalScore}</span>
                    </div>
                </div>
                <div class="edit-controls">
                    <button class="save-edit-btn" data-idx="${idx}">Save</button>
                    <button class="cancel-edit-btn" data-idx="${idx}">Cancel</button>
                </div>
            `;

      this.elements.playersList.appendChild(div);
    });

    this.setupPlayerEventListeners();
    this.updateRoundCounter();
  }

  setupPlayerEventListeners() {
    document.querySelectorAll('.remove-player-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (this.gameLogic.removePlayer(idx)) {
          this.renderPlayers();
        } else {
          modalManager.showWarning('Minimum Players Required', 'You need at least 2 players to play!');
        }
      });
    });

    document.querySelectorAll('.edit-player-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.enterEditMode(idx);
      });
    });

    document.querySelectorAll('.save-edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.saveEditMode(idx);
      });
    });

    document.querySelectorAll('.cancel-edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.cancelEditMode(idx);
      });
    });

    document.querySelectorAll('.click-to-add-container').forEach((container) => {
      container.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(container.getAttribute('data-idx'));
        if (!this.gameLogic.players[idx].out) {
          this.showScoreInput(idx, container);
        }
      });
    });

    document.querySelectorAll('.player-name').forEach((nameDiv) => {
      nameDiv.addEventListener('click', () => {
        const idx = parseInt(nameDiv.getAttribute('data-idx'));
        const input = document.createElement('input');
        input.type = 'text';
        input.value = this.gameLogic.players[idx].name;
        input.className = 'player-name-input';
        nameDiv.replaceWith(input);
        input.focus();

        input.addEventListener('blur', () => {
          const newName = input.value.trim() || this.gameLogic.players[idx].name;
          this.gameLogic.players[idx].name = newName;
          this.renderPlayers();
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') input.blur();
        });
      });
    });
  }

  showScoreInput(playerIdx, container) {
    // Create input overlay
    const inputOverlay = document.createElement('div');
    inputOverlay.className = 'score-input-overlay';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'score-input';
    input.placeholder = 'Enter score';
    input.min = '0';
    input.max = '50';
    input.autocomplete = 'off';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'score-confirm-btn';
    confirmBtn.textContent = 'Add';
    confirmBtn.type = 'button';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'score-cancel-btn';
    cancelBtn.textContent = '×';
    cancelBtn.type = 'button';
    
    inputOverlay.appendChild(input);
    inputOverlay.appendChild(confirmBtn);
    inputOverlay.appendChild(cancelBtn);
    
    // Replace container content temporarily
    const originalContent = container.innerHTML;
    container.innerHTML = '';
    container.appendChild(inputOverlay);
    container.classList.add('input-active');
    
    // Focus input and select all
    setTimeout(() => {
      input.focus();
      input.select();
    }, 50);
    
    const handleConfirm = () => {
      const scoreToAdd = parseInt(input.value) || 0;
      if (scoreToAdd > 0) {
        // Add the score multiple times based on input
        for (let i = 0; i < scoreToAdd; i++) {
          this.gameLogic.updatePlayerScore(playerIdx, 'plus');
        }
        
        // Show score change animation
        setTimeout(() => {
          const scoreElement = document.getElementById(`score_${playerIdx}`);
          if (scoreElement) {
            scoreElement.classList.add('score-change');
            setTimeout(() => scoreElement.classList.remove('score-change'), 400);
          }
        }, 100);
      }
      
      container.classList.remove('input-active');
      this.renderPlayers();
    };
    
    const handleCancel = () => {
      container.innerHTML = originalContent;
      container.classList.remove('input-active');
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    });
    
    // Auto-cancel on blur after a delay
    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.activeElement !== confirmBtn && document.activeElement !== cancelBtn) {
          handleCancel();
        }
      }, 100);
    });
  }

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
      const input = document.createElement('input');
      input.type = 'number';
      input.value = currentScore;
      input.className = 'round-edit-input';
      input.setAttribute('data-round', roundNum);
      input.setAttribute('min', '0');

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
    }
  }

  handleUndo() {
    if (this.gameLogic.undoLastAction()) {
      this.updateRoundCounter();
      this.renderPlayers();
    }
  }

  handleReset() {
    modalManager.showConfirm('Reset Game?', 'Are you sure you want to reset all scores and start over?', () => {
      this.gameLogic.resetGame();
      this.updateRoundCounter();
      this.renderPlayers();
      modalManager.showSuccess('Game Reset!', 'Starting fresh with Round 1.');
    });
  }

  async showLeaderboard() {
    const leaderboard = await gameDB.getLeaderboard(10);

    let leaderboardHtml = '';
    if (leaderboard.length === 0) {
      leaderboardHtml = '<div class="leaderboard-empty">No games completed yet.<br>Finish a game to see scores here!</div>';
    } else {
      leaderboard.forEach((entry, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;

        leaderboardHtml += `
                    <div class="leaderboard-item">
                        <div class="leaderboard-rank">${medal}</div>
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">${entry.winner_name || 'Unknown Player'}</div>
                            <div class="leaderboard-stats">
                                ${entry.total_rounds || 0} rounds • ${entry.players_count || 0} players
                            </div>
                        </div>
                        <div class="leaderboard-score">${entry.final_score || 0}</div>
                    </div>
                `;
      });
    }

    modalManager.createModal({
      title: '🏆 Leaderboard',
      message: `<div class="leaderboard-list">${leaderboardHtml}</div>`,
      type: 'success',
      primaryButton: 'Close',
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
