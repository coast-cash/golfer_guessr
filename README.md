# Major Mystery

Mobile-first (portrait) browser game inspired by Wordle.

## How it works

- You get **4 guesses**.
- Hint 1: count of each major won by the mystery golfer.
- Hint 2 (after first wrong guess): courses of each win.
- Hint 3 (after second wrong guess): years of each win.
- Hint 4 (after third wrong guess): golfer country.
- Final guess reveals answer.

## Run locally

Because the app fetches local JSON, run with a local server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173` on your phone.

## Data

The game data currently lives in `data/golfers.json` and is ready to expand with your full major winners dataset.
