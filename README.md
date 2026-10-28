# Card Duel

A two-player card battle built with plain HTML, CSS, and browser JavaScript. No packages, build tools, or backend are required.

## Run locally

1. Open a terminal in this folder.
2. Start a simple static file server. For example, if Python is already installed:

   ```sh
   python -m http.server 8000
   ```

3. Open [http://localhost:8000](http://localhost:8000) in your browser.

You can also open `index.html` directly in a browser. A local static server is recommended because some browsers restrict API requests from `file://` pages.

## How to play

Choose **New game** to create and shuffle a deck. The game deals two cards right away, one for you and one for the computer. The higher card wins a point; aces are high, and suits break equal-rank ties in this order: spades, hearts, diamonds, clubs. The first player to five points wins. Choose **Deal next round** to continue, or **Play again** after the game ends.

## How the API is used

The browser uses `fetch()` to call the Deck of Cards API. It requests a newly shuffled single deck, then draws two cards from that deck for each round. The deck ID and all scores and round details stay in JavaScript memory in the page.

## Files

- `index.html` — semantic page structure
- `styles.css` — responsive layout and visual styling
- `script.js` — API requests, card comparisons, score keeping, and DOM updates

## Ideas for later

- Add a best-of-three match option.
- Animate card flips and score changes.
- Add sound effects or a choice of tie-break rules.
- Keep a local match history with `localStorage`.
