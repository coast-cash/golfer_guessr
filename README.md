# Major Mystery

Mobile-first (portrait) browser game inspired by Wordle.

## How it works

- You get **4 guesses**.
- Input uses **auto-suggest** and only accepts golfer names from the provided data.
- Hint 1: count of each major won by the mystery golfer.
- Hint 2 (after first wrong guess): courses of each win.
- Hint 3 (after second wrong guess): years of each win.
- Hint 4 (after third wrong guess): golfer country.
- Incorrect guesses remain visible in an on-screen list until the game ends.
- Final guess reveals answer.

## Run locally

Because the app fetches local JSON/TSV, run with a local server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173` on your phone.

## Data

- `data/major_championships_raw.tsv` is the tab-delimited source table.
- `data/golfers.json` provides richer profiles (photos + expanded wins) that are merged into gameplay.
