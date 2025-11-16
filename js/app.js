let gameLogic;
let uiManager;
let modalManager;

async function loadSavedGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedGameId = urlParams.get('game');

  if (sharedGameId) {
    const gameData = await gameDB.loadGameState(sharedGameId);
    if (gameData) {
      loadGameFromData(gameData);
      modalManager.showSuccess('Game Loaded!', 'Shared game loaded successfully.');
      return;
    }
  }

  const gameData = await gameDB.loadGameState();
  if (gameData) {
    loadGameFromData(gameData);
  }
}

function loadGameFromData(gameData) {
  gameLogic.currentGameId = gameData.id;
  gameLogic.players = gameData.players;
  gameLogic.currentRound = gameData.current_round || 1;
  uiManager.updateRoundCounter();
  uiManager.renderPlayers();
}

// iOS keyboard handling fixes
function setupIOSKeyboardFixes() {
  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener(
      'touchend',
      function (event) {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      },
      false
    );

    // Force keyboard to appear on input focus
    document.addEventListener('focusin', function (e) {
      if (e.target.matches('.score-input')) {
        // Scroll to input to ensure it's visible
        setTimeout(() => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    });

    // Ensure body doesn't scroll when keyboard appears
    document.addEventListener('focusout', function (e) {
      if (e.target.matches('.score-input')) {
        // Restore scroll position
        window.scrollTo(0, 0);
      }
    });
  }
}

// Player Setup Modal Handler
function setupPlayerNamingModal() {
  const setupModal = document.getElementById('setupModal');
  const appContainer = document.getElementById('appContainer');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const playerSetupGrid = document.getElementById('playerSetupGrid');
  const playerCountText = document.getElementById('playerCountText');
  const skipAllBtn = document.getElementById('skipAll');
  const backBtn = document.getElementById('backToStep1');
  const startBtn = document.getElementById('startGame');

  let selectedPlayerCount = 0;

  // Check if user has already set up names (localStorage)
  const hasSetupBefore = localStorage.getItem('hasCompletedSetup');
  const savedPlayerCount = localStorage.getItem('playerCount');
  
  if (hasSetupBefore && savedPlayerCount) {
    // Skip setup and show app directly with saved player count
    const count = parseInt(savedPlayerCount);
    gameLogic.players = gameLogic.players.slice(0, count);
    
    // Update game info text
    const gameInfoText = document.getElementById('gameInfoText');
    if (gameInfoText) {
      gameInfoText.textContent = `Playing with ${count} player${count > 1 ? 's' : ''}`;
    }
    
    setupModal.style.display = 'none';
    appContainer.style.display = 'block';
    return;
  }

  // Step 1: Player count selection
  const playerCountButtons = document.querySelectorAll('.player-count-btn');
  
  playerCountButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedPlayerCount = parseInt(btn.dataset.count);
      
      // Update UI
      playerCountButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      
      // Animate to step 2
      setTimeout(() => {
        step1.style.display = 'none';
        step2.style.display = 'block';
        generatePlayerInputs(selectedPlayerCount);
      }, 200);
    });
  });

  // Skip all setup - use 4 default players
  skipAllBtn.addEventListener('click', () => {
    gameLogic.players = gameLogic.players.slice(0, 4);
    localStorage.setItem('playerCount', '4');
    closeSetupAndStartGame(false);
  });

  // Back button
  backBtn.addEventListener('click', () => {
    step2.style.display = 'none';
    step1.style.display = 'block';
    playerSetupGrid.innerHTML = '';
  });

  // Start game button
  startBtn.addEventListener('click', () => {
    closeSetupAndStartGame(true);
  });

  function generatePlayerInputs(count) {
    playerSetupGrid.innerHTML = '';
    playerCountText.textContent = `Enter names for your ${count} players`;
    
    for (let i = 0; i < count; i++) {
      const playerItem = document.createElement('div');
      playerItem.className = 'player-setup-item';
      
      playerItem.innerHTML = `
        <label class="player-setup-label">
          <div class="player-setup-icon">${i + 1}</div>
          Player ${i + 1}
        </label>
        <input 
          type="text" 
          class="player-setup-input" 
          id="playerName${i}" 
          placeholder="Player ${i + 1}"
          maxlength="15"
          autocomplete="off"
        />
      `;
      
      playerSetupGrid.appendChild(playerItem);
    }

    // Auto-focus first input
    setTimeout(() => {
      document.getElementById('playerName0')?.focus();
    }, 300);

    // Handle Enter key to move to next input
    playerSetupGrid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const inputs = Array.from(playerSetupGrid.querySelectorAll('.player-setup-input'));
        const currentIndex = inputs.indexOf(document.activeElement);
        
        if (currentIndex < inputs.length - 1) {
          inputs[currentIndex + 1].focus();
        } else {
          // Last input, trigger start game
          closeSetupAndStartGame(true);
        }
      }
    });
  }

  function closeSetupAndStartGame(applyNames) {
    // Remove extra players based on selected count
    gameLogic.players = gameLogic.players.slice(0, selectedPlayerCount || 4);
    
    if (applyNames && selectedPlayerCount > 0) {
      // Apply custom names to players
      for (let i = 0; i < selectedPlayerCount; i++) {
        const input = document.getElementById(`playerName${i}`);
        const customName = input?.value.trim();
        
        if (customName) {
          gameLogic.players[i].name = customName;
        }
      }
      
      // Re-render to show updated names
      uiManager.renderPlayers();
    }
    
    // Save player count to localStorage
    const finalPlayerCount = selectedPlayerCount || 4;
    localStorage.setItem('playerCount', finalPlayerCount.toString());
    localStorage.setItem('hasCompletedSetup', 'true');
    
    // Update game info text
    const gameInfoText = document.getElementById('gameInfoText');
    if (gameInfoText) {
      gameInfoText.textContent = `Playing with ${finalPlayerCount} player${finalPlayerCount > 1 ? 's' : ''}`;
    }
    
    // Animate modal out
    setupModal.style.animation = 'modalSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      setupModal.style.display = 'none';
      appContainer.style.display = 'block';
    }, 300);
  }
}

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
  @keyframes modalSlideOut {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(-30px) scale(0.95);
    }
  }
`;
document.head.appendChild(style);

window.addEventListener('DOMContentLoaded', function () {
  gameLogic = new GameLogic();
  modalManager = new ModalManager();
  uiManager = new UIManager(gameLogic);

  // Initialize setup modal FIRST
  setupPlayerNamingModal();

  uiManager.updateRoundCounter();
  uiManager.renderPlayers();
  loadSavedGame();

  // Setup iOS-specific fixes
  setupIOSKeyboardFixes();
  
  // Ensure bottom action bar is visible on mobile after initialization
  setTimeout(() => {
    if (typeof showBottomActionBar === 'function') {
      showBottomActionBar();
    }
  }, 500);
});
