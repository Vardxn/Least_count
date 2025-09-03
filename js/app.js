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
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  if (isIOS) {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
    
    // Force keyboard to appear on input focus
    document.addEventListener('focusin', function(e) {
      if (e.target.matches('.score-input')) {
        // Scroll to input to ensure it's visible
        setTimeout(() => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    });
    
    // Ensure body doesn't scroll when keyboard appears
    document.addEventListener('focusout', function(e) {
      if (e.target.matches('.score-input')) {
        // Restore scroll position
        window.scrollTo(0, 0);
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', function () {
  gameLogic = new GameLogic();
  modalManager = new ModalManager();
  uiManager = new UIManager(gameLogic);

  uiManager.updateRoundCounter();
  uiManager.renderPlayers();
  loadSavedGame();
  
  // Setup iOS-specific fixes
  setupIOSKeyboardFixes();
});
