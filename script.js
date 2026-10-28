"use strict";

const API_BASE = "https://deckofcardsapi.com/api/deck";
const WINNING_SCORE = 5;

const elements = {
  landing: document.querySelector("#landing"),
  game: document.querySelector("#game"),
  newGameButton: document.querySelector("#new-game-button"),
  landingError: document.querySelector("#landing-error"),
  gameError: document.querySelector("#game-error"),
  dealButton: document.querySelector("#deal-button"),
  playAgainButton: document.querySelector("#play-again-button"),
  playerScore: document.querySelector("#player-score"),
  computerScore: document.querySelector("#computer-score"),
  roundNumber: document.querySelector("#round-number"),
  playerCard: document.querySelector("#player-card"),
  computerCard: document.querySelector("#computer-card"),
  playerCardLabel: document.querySelector("#player-card-label"),
  computerCardLabel: document.querySelector("#computer-card-label"),
  playerSide: document.querySelector("#player-side"),
  computerSide: document.querySelector("#computer-side"),
  roundResult: document.querySelector("#round-result"),
  cardsRemaining: document.querySelector("#cards-remaining"),
};

const rankValues = {
  ACE: 14,
  KING: 13,
  QUEEN: 12,
  JACK: 11,
};

const suitValues = {
  CLUBS: 1,
  DIAMONDS: 2,
  HEARTS: 3,
  SPADES: 4,
};

let gameState = null;
let loading = false;

async function requestApi(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`The card service returned an error (${response.status}).`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "The card service could not complete your request.");
  }

  return data;
}

async function createShuffledDeck() {
  return requestApi(`${API_BASE}/new/shuffle/?deck_count=1`);
}

async function drawCards(deckId) {
  const draw = await requestApi(`${API_BASE}/${deckId}/draw/?count=2`);
  if (!Array.isArray(draw.cards) || draw.cards.length !== 2) {
    throw new Error("The deck did not return enough cards for this round.");
  }
  return draw;
}

function cardRank(card) {
  return rankValues[card.value] || Number(card.value);
}

function compareCards(playerCard, computerCard) {
  const rankDifference = cardRank(playerCard) - cardRank(computerCard);
  if (rankDifference !== 0) {
    return rankDifference > 0 ? "player" : "computer";
  }

  return suitValues[playerCard.suit] > suitValues[computerCard.suit]
    ? "player"
    : "computer";
}

function cardLabel(card) {
  return `${card.value.toLowerCase()} of ${card.suit.toLowerCase()}`;
}

function setLoading(isLoading, message) {
  loading = isLoading;
  elements.newGameButton.disabled = isLoading;
  elements.dealButton.disabled = isLoading || !gameState || Boolean(gameState.winner);
  elements.playAgainButton.disabled = isLoading;

  if (message) {
    elements.roundResult.textContent = message;
  }
}

function showError(container, message) {
  container.querySelector(".error-text").textContent = message;
  container.hidden = false;
}

function hideErrors() {
  elements.landingError.hidden = true;
  elements.gameError.hidden = true;
}

function renderCard(container, labelContainer, card, ownerLabel) {
  const image = document.createElement("img");
  image.src = card.image;
  image.alt = `${ownerLabel}: ${cardLabel(card)}`;
  image.loading = "eager";

  container.replaceChildren(image);
  container.setAttribute("aria-label", `${ownerLabel}: ${cardLabel(card)}`);
  labelContainer.textContent = cardLabel(card);
}

function renderGame() {
  if (!gameState) {
    return;
  }

  elements.playerScore.textContent = String(gameState.playerScore);
  elements.computerScore.textContent = String(gameState.computerScore);
  elements.roundNumber.textContent = String(gameState.round);
  elements.cardsRemaining.textContent = String(gameState.remaining);
  renderCard(elements.playerCard, elements.playerCardLabel, gameState.playerCard, "Your card");
  renderCard(elements.computerCard, elements.computerCardLabel, gameState.computerCard, "Computer card");

  elements.playerSide.classList.toggle("is-winner", gameState.roundWinner === "player");
  elements.computerSide.classList.toggle("is-winner", gameState.roundWinner === "computer");

  if (gameState.winner === "player") {
    elements.roundResult.textContent = "You won the duel! First to five.";
    elements.playAgainButton.hidden = false;
  } else if (gameState.winner === "computer") {
    elements.roundResult.textContent = "The computer takes the duel.";
    elements.playAgainButton.hidden = false;
  } else if (gameState.roundWinner === "player") {
    elements.roundResult.textContent = "You take the round!";
    elements.playAgainButton.hidden = true;
  } else {
    elements.roundResult.textContent = "Computer takes the round.";
    elements.playAgainButton.hidden = true;
  }

  elements.dealButton.hidden = Boolean(gameState.winner);
  elements.dealButton.disabled = loading || Boolean(gameState.winner);
}

async function startGame() {
  if (loading) {
    return;
  }

  gameState = null;
  hideErrors();
  elements.landing.hidden = true;
  elements.game.hidden = false;
  elements.playAgainButton.hidden = true;
  elements.dealButton.hidden = false;
  elements.dealButton.textContent = "Dealing…";
  setLoading(true, "Shuffling and dealing your cards…");

  try {
    const deck = await createShuffledDeck();
    const draw = await drawCards(deck.deck_id);
    gameState = {
      deckId: deck.deck_id,
      remaining: draw.remaining,
      round: 1,
      playerScore: 0,
      computerScore: 0,
      playerCard: draw.cards[0],
      computerCard: draw.cards[1],
      roundWinner: null,
      winner: null,
    };
    awardRoundPoint();
    renderGame();
  } catch (error) {
    elements.game.hidden = true;
    elements.landing.hidden = false;
    showError(elements.landingError, error.message || "Unable to start a new game.");
  } finally {
    setLoading(false);
    elements.dealButton.innerHTML = '<span>Deal next round</span><span class="button-arrow" aria-hidden="true">→</span>';
    if (gameState) {
      renderGame();
    }
  }
}

function awardRoundPoint() {
  gameState.roundWinner = compareCards(gameState.playerCard, gameState.computerCard);
  if (gameState.roundWinner === "player") {
    gameState.playerScore += 1;
  } else {
    gameState.computerScore += 1;
  }

  if (gameState.playerScore === WINNING_SCORE) {
    gameState.winner = "player";
  } else if (gameState.computerScore === WINNING_SCORE) {
    gameState.winner = "computer";
  }
}

async function playRound() {
  if (!gameState || gameState.winner || loading) {
    return;
  }

  hideErrors();
  setLoading(true, "Dealing the next round…");

  try {
    const draw = await drawCards(gameState.deckId);
    gameState.remaining = draw.remaining;
    gameState.round += 1;
    gameState.playerCard = draw.cards[0];
    gameState.computerCard = draw.cards[1];
    awardRoundPoint();
    renderGame();
  } catch (error) {
    showError(elements.gameError, error.message || "Unable to deal the next round.");
  } finally {
    setLoading(false);
    renderGame();
  }
}

elements.newGameButton.addEventListener("click", startGame);
elements.dealButton.addEventListener("click", playRound);
elements.playAgainButton.addEventListener("click", startGame);

document.querySelectorAll(".button--retry").forEach((button) => {
  button.addEventListener("click", () => {
    if (gameState) {
      playRound();
    } else {
      startGame();
    }
  });
});
