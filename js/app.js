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

window.addEventListener('DOMContentLoaded', function () {
  gameLogic = new GameLogic();
  modalManager = new ModalManager();
  uiManager = new UIManager(gameLogic);

  uiManager.updateRoundCounter();
  uiManager.renderPlayers();
  loadSavedGame();
});
