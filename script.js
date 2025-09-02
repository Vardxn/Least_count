const addPlayerForm = document.getElementById('addPlayerForm');
const playerNameInput = document.getElementById('playerName');
const playersList = document.getElementById('playersList');

const avatarImages = ['avatars/avatars.png', 'avatars/Background.jpg', 'avatars/boy.png', 'avatars/male-cartoon.png', 'avatars/male.png', 'avatars/man.png', 'avatars/people.png', 'avatars/user.png'];
let players = [
  { name: 'Player 1', picUrl: avatarImages[0], count: 0, totalScore: 0, roundHistory: [], out: false },
  { name: 'Player 2', picUrl: avatarImages[2], count: 0, totalScore: 0, roundHistory: [], out: false },
  { name: 'Player 3', picUrl: avatarImages[3], count: 0, totalScore: 0, roundHistory: [], out: false },
  { name: 'Player 4', picUrl: avatarImages[4], count: 0, totalScore: 0, roundHistory: [], out: false },
];
let lastRoundScores = [];
let currentRound = 1;
let gameHistory = []; // For undo functionality
let lastAction = null;
let editModeData = {}; // Store original data for cancel functionality

// Custom Modal Dialog System
function createModal(options = {}) {
  const {
    title = 'Notification',
    message = '',
    type = 'info', // info, success, warning, error, celebration
    primaryButton = 'OK',
    secondaryButton = null,
    onPrimary = null,
    onSecondary = null,
    autoClose = null,
  } = options;

  // Remove existing modal if any
  const existingModal = document.querySelector('.modal-overlay');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  // Create modal dialog
  const dialog = document.createElement('div');
  dialog.className = `modal-dialog modal-${type}`;

  // Get icon based on type
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'celebration':
        return '🎉';
      default:
        return 'ℹ';
    }
  };

  // Create modal content
  dialog.innerHTML = `
        <div class="modal-header">
            <div class="modal-icon">${getIcon(type)}</div>
            <h2 class="modal-title">${title}</h2>
        </div>
        <div class="modal-message">${message}</div>
        <div class="modal-actions">
            ${secondaryButton ? `<button class="modal-btn modal-btn-secondary" data-action="secondary">${secondaryButton}</button>` : ''}
            <button class="modal-btn modal-btn-primary" data-action="primary">${primaryButton}</button>
        </div>
    `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Add event listeners
  const primaryBtn = overlay.querySelector('[data-action="primary"]');
  const secondaryBtn = overlay.querySelector('[data-action="secondary"]');

  const closeModal = () => {
    overlay.classList.remove('show');
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 300);
  };

  primaryBtn.addEventListener('click', () => {
    if (onPrimary) onPrimary();
    closeModal();
  });

  if (secondaryBtn) {
    secondaryBtn.addEventListener('click', () => {
      if (onSecondary) onSecondary();
      closeModal();
    });
  }

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Show modal with animation
  setTimeout(() => {
    overlay.classList.add('show');
  }, 10);

  // Auto close if specified
  if (autoClose) {
    setTimeout(closeModal, autoClose);
  }

  return { close: closeModal };
}

// Convenience functions for different modal types
function showInfo(title, message, onOk = null) {
  return createModal({
    title,
    message,
    type: 'info',
    primaryButton: 'OK',
    onPrimary: onOk,
  });
}

function showSuccess(title, message, onOk = null) {
  return createModal({
    title,
    message,
    type: 'success',
    primaryButton: 'Continue',
    onPrimary: onOk,
  });
}

function showWarning(title, message, onOk = null) {
  return createModal({
    title,
    message,
    type: 'warning',
    primaryButton: 'OK',
    onPrimary: onOk,
  });
}

function showError(title, message, onOk = null) {
  return createModal({
    title,
    message,
    type: 'error',
    primaryButton: 'OK',
    onPrimary: onOk,
  });
}

function showCelebration(title, message, onOk = null) {
  return createModal({
    title,
    message,
    type: 'celebration',
    primaryButton: 'Awesome!',
    onPrimary: onOk,
  });
}

function showConfirm(title, message, onConfirm = null, onCancel = null) {
  return createModal({
    title,
    message,
    type: 'warning',
    primaryButton: 'Confirm',
    secondaryButton: 'Cancel',
    onPrimary: onConfirm,
    onSecondary: onCancel,
  });
}

function enterEditMode(playerIdx) {
  // Store original data for potential cancel
  editModeData[playerIdx] = {
    roundHistory: [...players[playerIdx].roundHistory],
    totalScore: players[playerIdx].totalScore,
  };

  const playerCard = document.querySelectorAll('.player')[playerIdx];
  playerCard.classList.add('edit-mode');

  // Hide edit button and show save/cancel buttons
  const editBtn = playerCard.querySelector('.edit-player-btn');
  const editControls = playerCard.querySelector('.edit-controls');
  editBtn.style.display = 'none';
  editControls.style.display = 'flex';

  // Convert round history items to editable inputs
  const roundHistoryItems = playerCard.querySelectorAll('.round-history-item');
  roundHistoryItems.forEach((item, roundNum) => {
    const currentScore = players[playerIdx].roundHistory[roundNum];
    const input = document.createElement('input');
    input.type = 'number';
    input.value = currentScore;
    input.className = 'round-edit-input';
    input.setAttribute('data-round', roundNum);
    input.setAttribute('data-player', playerIdx);
    input.setAttribute('min', '0');

    // Add live update functionality
    input.addEventListener('input', function () {
      updateLiveTotalScore(playerIdx);
    });

    const roundLabel = roundNum === 0 ? 'Round 1' : `R${roundNum + 1}`;
    item.innerHTML = `${roundLabel}: `;
    item.appendChild(input);
  });
}

function updateLiveTotalScore(playerIdx) {
  const playerCard = document.querySelectorAll('.player')[playerIdx];
  const roundInputs = playerCard.querySelectorAll('.round-edit-input');
  let newTotal = 0;

  roundInputs.forEach((input) => {
    const value = parseInt(input.value) || 0;
    newTotal += value;
  });

  // Update the displayed total score
  const totalScoreElement = playerCard.querySelector('.total-score-value');
  totalScoreElement.textContent = newTotal;

  // Update progress ring color based on new total
  const progressColor = getProgressColor(newTotal);
  const progressCircle = playerCard.querySelector('.avatar-progress circle:last-child');
  progressCircle.setAttribute('stroke', progressColor);

  // Update the circumference based on new total
  const circumference = 2 * Math.PI * 26;
  const progress = Math.min(newTotal, 100);
  const offset = circumference * (1 - progress / 100);
  progressCircle.style.strokeDashoffset = offset;
}

function saveEditMode(playerIdx) {
  saveGameState(); // Save state for undo functionality

  const playerCard = document.querySelectorAll('.player')[playerIdx];
  const roundInputs = playerCard.querySelectorAll('.round-edit-input');

  // Update player data with new values
  let newTotal = 0;
  roundInputs.forEach((input, roundNum) => {
    const newValue = parseInt(input.value) || 0;
    players[playerIdx].roundHistory[roundNum] = newValue;
    newTotal += newValue;
  });

  players[playerIdx].totalScore = newTotal;

  // Check if player should be eliminated
  if (newTotal >= 100 && !players[playerIdx].out) {
    players[playerIdx].out = true;
    showConfetti();
    setTimeout(() => {
      showError('Player Eliminated!', `${players[playerIdx].name} has been eliminated! 💥`);
    }, 500);
  } else if (newTotal < 100 && players[playerIdx].out) {
    // Re-enable player if they're back under 100
    players[playerIdx].out = false;
  }

  // Clear edit mode data
  delete editModeData[playerIdx];

  // Show undo toast
  showUndoToast(playerIdx);

  // Re-render to show updated data
  renderPlayers();
}

function cancelEditMode(playerIdx) {
  // Restore original data
  if (editModeData[playerIdx]) {
    players[playerIdx].roundHistory = editModeData[playerIdx].roundHistory;
    players[playerIdx].totalScore = editModeData[playerIdx].totalScore;
    delete editModeData[playerIdx];
  }

  // Re-render to restore original state
  renderPlayers();
}

function showUndoToast(playerIdx) {
  // Remove existing toast if any
  const existingToast = document.querySelector('.undo-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'undo-toast';
  toast.innerHTML = `
        <span>Changes saved for ${players[playerIdx].name}</span>
        <button class="undo-toast-btn" data-player="${playerIdx}">Undo</button>
    `;
  document.body.appendChild(toast);

  // Show toast with animation
  setTimeout(() => toast.classList.add('show'), 100);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);

  // Add undo functionality
  toast.querySelector('.undo-toast-btn').addEventListener('click', function () {
    undoPlayerEdit(playerIdx);
    toast.remove();
  });
}

function undoPlayerEdit(playerIdx) {
  if (gameHistory.length > 0) {
    const previousState = gameHistory[gameHistory.length - 1];
    const previousPlayerData = previousState.players[playerIdx];

    players[playerIdx].roundHistory = [...previousPlayerData.roundHistory];
    players[playerIdx].totalScore = previousPlayerData.totalScore;
    players[playerIdx].out = previousPlayerData.out;

    renderPlayers();
    enterEditMode(playerIdx); // Re-enter edit mode with previous values
  }
}

document.getElementById('showAddPlayerInput').addEventListener('click', function () {
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
    addPlayerForm.appendChild(promptDiv);
    document.getElementById('playerName').focus();
    document.getElementById('confirmAddPlayer').onclick = function () {
      const name = document.getElementById('playerName').value.trim();
      if (!name) return;
      let usedAvatars = players.map((p) => p.picUrl);
      let avatarIdx = avatarImages.findIndex((img) => !usedAvatars.includes(img));
      if (avatarIdx === -1) avatarIdx = players.length % avatarImages.length;
      addPlayer(name, avatarImages[avatarIdx]);
      promptDiv.remove();
    };
    document.getElementById('cancelAddPlayer').onclick = function () {
      promptDiv.remove();
    };
  }
});

function updateRoundCounter() {
  document.getElementById('roundCounter').textContent = `Round ${currentRound}`;
}

function saveGameState() {
  gameHistory.push({
    players: JSON.parse(JSON.stringify(players)),
    currentRound: currentRound,
    lastRoundScores: [...lastRoundScores],
  });
  if (gameHistory.length > 10) gameHistory.shift(); // Keep only last 10 states
  document.getElementById('undoBtn').disabled = false;
}

function undoLastAction() {
  if (gameHistory.length > 0) {
    const previousState = gameHistory.pop();
    players = previousState.players;
    currentRound = previousState.currentRound;
    lastRoundScores = previousState.lastRoundScores;
    updateRoundCounter();
    renderPlayers();
    if (gameHistory.length === 0) {
      document.getElementById('undoBtn').disabled = true;
    }
  }
}

function addPlayer(name, picUrl) {
  saveGameState();
  players.push({ name, picUrl, count: 0, totalScore: 0, roundHistory: [], out: false });
  renderPlayers();
}

function getCountClass(count) {
  if (count >= 100) return 'count-max';
  if (count < 50) return 'count-green';
  if (count < 80) return 'count-yellow';
  return 'count-red';
}

function getProgressColor(count) {
  if (count >= 100) return '#e74c3c';
  if (count < 50) return '#2ecc40';
  if (count < 80) return '#f1c40f';
  return '#e74c3c';
}

function renderPlayers() {
  playersList.innerHTML = '';
  players.forEach((player, idx) => {
    const div = document.createElement('div');
    div.className = 'player' + (player.out ? ' out' : ' highlight');
    const circumference = 2 * Math.PI * 26;
    const progress = Math.min(player.totalScore, 100);
    const offset = circumference * (1 - progress / 100);
    const progressRing = `
          <svg class="avatar-progress" width="56" height="56">
            <circle cx="28" cy="28" r="26" stroke="#e0eafc" stroke-width="4" fill="none"/>
            <circle cx="28" cy="28" r="26" stroke="${getProgressColor(player.totalScore)}" stroke-width="4" fill="none" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
          </svg>
        `;
    const countClass = getCountClass(player.totalScore);
    const totalClass = player.totalScore >= 1000 ? 'player-total-light' : 'player-total';
    const lastScore = lastRoundScores[idx] || 0;
    const lastRoundLabel = currentRound - 1 === 1 ? 'Round 1' : `R${currentRound - 1}`;
    const lastRoundBadge = lastScore !== 0 ? `<span class="last-round-badge">${lastRoundLabel}: +${lastScore}</span>` : '';
    const avatarSrc = player.picUrl || avatarImages[idx % avatarImages.length];

    // Display round history
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
                <img src="${avatarSrc}" alt="Profile">
                ${progressRing}
            </div>
            <div class="player-info">
                <div class="player-name" data-idx="${idx}">${player.name}</div>
                ${lastRoundBadge}
                <div class="round-history">${roundHistoryHtml}</div>
                <div class="player-counter-tab">
                    <button class="counter-btn" data-idx="${idx}" data-action="minus" ${player.out ? 'disabled' : ''}>−</button>
                    <span class="score-value" id="score_${idx}">${player.count}</span>
                    <button class="counter-btn" data-idx="${idx}" data-action="plus" ${player.out ? 'disabled' : ''}>+</button>
                </div>
                <div class="player-count ${countClass}">
                    ${currentRound === 1 ? 'Round 1' : `R${currentRound}`}: <span class="score-value">${player.count}</span>
                </div>
                <div class="player-total-display ${totalClass}">Total Score: <span class="total-score-value" data-idx="${idx}">${player.totalScore}</span></div>
            </div>
            <div class="edit-controls">
                <button class="save-edit-btn" data-idx="${idx}">Save</button>
                <button class="cancel-edit-btn" data-idx="${idx}">Cancel</button>
            </div>
        `;
    if (player._animate) {
      div.querySelector('.avatar-ring img').classList.add('bounce');
      setTimeout(() => {
        div.querySelector('.avatar-ring img').classList.remove('bounce');
      }, 600);
      player._animate = false;
    }
    if (player._confetti) {
      showConfetti();
      player._confetti = false;
    }
    playersList.appendChild(div);

    const playerNameDiv = div.querySelector('.player-name');
    playerNameDiv.addEventListener('click', function () {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = player.name;
      input.className = 'player-name-input';
      playerNameDiv.replaceWith(input);
      input.focus();

      input.addEventListener('blur', function () {
        const newName = input.value.trim() || player.name;
        player.name = newName;
        renderPlayers();
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          input.blur();
        }
      });
    });
  });

  // Remove player buttons
  document.querySelectorAll('.remove-player-btn').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const idx = parseInt(this.getAttribute('data-idx'));
      if (players.length > 2) {
        // Keep at least 2 players
        saveGameState();
        players.splice(idx, 1);
        renderPlayers();
      } else {
        showWarning('Minimum Players Required', 'You need at least 2 players to play!');
      }
    });
  });

  // Edit player buttons
  document.querySelectorAll('.edit-player-btn').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const idx = parseInt(this.getAttribute('data-idx'));
      enterEditMode(idx);
    });
  });

  // Save edit buttons
  document.querySelectorAll('.save-edit-btn').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const idx = parseInt(this.getAttribute('data-idx'));
      saveEditMode(idx);
    });
  });

  // Cancel edit buttons
  document.querySelectorAll('.cancel-edit-btn').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const idx = parseInt(this.getAttribute('data-idx'));
      cancelEditMode(idx);
    });
  });

  document.querySelectorAll('.counter-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      saveGameState();
      const idx = parseInt(this.getAttribute('data-idx'));
      const action = this.getAttribute('data-action');
      if (players[idx].out) return;

      const scoreElement = document.getElementById(`score_${idx}`);

      if (action === 'plus') {
        players[idx].count++;
        players[idx].lastRound = 1;
      } else if (action === 'minus' && players[idx].count > 0) {
        players[idx].count--;
        players[idx].lastRound = -1;
      }

      // Add animation class
      scoreElement.classList.add('score-change');
      setTimeout(() => scoreElement.classList.remove('score-change'), 400);

      renderPlayers();
    });
  });
}

function updateTotalScore() {
  // This function is now handled within the player rendering
  // Total scores are maintained per player
}

function showConfetti() {
  // Create confetti burst
  const confetti = document.createElement('div');
  confetti.className = 'confetti-burst';
  document.body.appendChild(confetti);

  // Create particles
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

window.addEventListener('DOMContentLoaded', function () {
  updateRoundCounter();
  renderPlayers();
});

// Add Round button functionality
document.getElementById('addRoundBtn').addEventListener('click', function () {
  // Only proceed if at least one player has a score
  let hasScores = players.some((player) => player.count > 0);
  if (!hasScores) {
    showWarning('No Scores Added', 'Please add scores for players before completing the round.');
    return;
  }

  saveGameState();
  let eliminatedPlayers = [];

  // Process each player's round
  players.forEach((player, idx) => {
    // Add current count to round history
    player.roundHistory.push(player.count);

    // Add current count to total score
    player.totalScore += player.count;

    // Check if player is out (total >= 100)
    if (player.totalScore >= 100 && !player.out) {
      player.out = true;
      eliminatedPlayers.push(player.name);
    }

    // Reset current count to 0 for next round
    player.count = 0;
  });

  // Increment round counter
  currentRound++;
  updateRoundCounter();

  // Show confetti for eliminations
  if (eliminatedPlayers.length > 0) {
    showConfetti();
    setTimeout(() => {
      const playerText = eliminatedPlayers.length === 1 ? 'Player' : 'Players';
      showError(`${playerText} Eliminated!`, `${eliminatedPlayers.join(', ')} eliminated! 💥`);
    }, 500);
  }

  // Re-render players to show updated scores
  renderPlayers();

  // Check for winner
  const activePlayers = players.filter((p) => !p.out);
  if (activePlayers.length <= 1) {
    setTimeout(() => {
      if (activePlayers.length === 1) {
        showConfetti();
        showCelebration('🎉 Game Complete! 🎉', `${activePlayers[0].name} wins the game!`);
      } else {
        showInfo('Game Over', 'All players eliminated! 😅');
      }
    }, 1000);
  } else {
    // Show completion message
    const completedRoundLabel = currentRound - 1 === 1 ? 'Round 1' : `Round ${currentRound - 1}`;
    const nextRoundLabel = currentRound === 1 ? 'Round 1' : `Round ${currentRound}`;
    showSuccess('Round Complete!', `${completedRoundLabel} completed! Starting ${nextRoundLabel}`);
  }
});

// Undo button functionality
document.getElementById('undoBtn').addEventListener('click', undoLastAction);

// Reset button functionality
document.getElementById('resetBtn').addEventListener('click', function () {
  showConfirm('Reset Game?', 'Are you sure you want to reset all scores and start over?', () => {
    // Confirmed - reset the game
    players.forEach((player) => {
      player.count = 0;
      player.totalScore = 0;
      player.roundHistory = [];
      player.out = false;
    });
    lastRoundScores = [];
    currentRound = 1;
    gameHistory = [];
    document.getElementById('undoBtn').disabled = true;
    updateRoundCounter();
    renderPlayers();
    showSuccess('Game Reset!', 'Starting fresh with Round 1.');
  });
});
