# Prove It

A 30-minute Slidev presentation by Zayd Krunz about mathematical proof: 26 content slides, a reference appendix, a verbatim presenter script, and two live classroom activities.

## Presenting

- Local preview: `http://localhost:3030`. Public URL: `https://proofs.zaydkrunz.com`. See [deployment-status.md](deployment-status.md) for verified hosting status.
- Open `/#/presenter/1` in the same browser for the script, next-slide preview, and 30-minute timer. Put the normal presentation window on the projector and keep presenter view on your laptop.
- Right Arrow or Space advances an animation. Left Arrow goes back. Use the visible buttons inside the demos and games.
- Fonts and math rendering are bundled locally. Phone participation requires the server. Call-out guesses and the show-of-hands game work without it.

## One QR room, two activities

1. Before class, open `/host` privately and enter the `HOST_KEY` from this app's Coolify environment variables. Create a **new room** for each rehearsal or class.
2. Open the deck and presenter view in the same browser. Keep the host dashboard in its own tab; the master key disappears after room creation.
3. On slide 2, click **Open the activity screen**, then switch the shared screen to that tab. Click **Enlarge** for a large view of the artistic QR image. If it is hard to scan, click **Show normal QR**. Both images open the same join page: students enter the displayed room code and a first name or nickname. Names appear on the projector; no account is required. Click **Back to activity** when everyone has joined.
4. Click **Start the 60 seconds**. Students enter a nonnegative integer n, trying to make `A = n^17 + 9` and `B = (n+1)^17 + 9` share a factor greater than 1. The server enforces the deadline. When it ends, click **Reveal the counterexample**.
5. Switch back to the deck after the reveal. When ready for the second activity, return to the host tab, click **Proof or Bluff**, then **Start round 1**. Students can reopen `/join` in the same browser to resume their player and see the current activity.
6. For each of the five rounds, students can change their vote until **Lock voting**. Ask someone to defend a step, then **Reveal the answer**. Continue with **Next round** and **Final score**.

The five arguments cover division by zero, consecutive integers, a missing induction base case, a true conclusion with an invalid converse argument, and an existence proof by cases. A correct majority earns the class a point; a tie earns the traps a point. An empty round awards no point. Individual scores appear in the final leaderboard. One vote is stored per browser. Names identify players on screen but do not authenticate their real identity; the room code does not grant host privileges.

Rooms expire after four hours. The deadline, guesses, votes, and host authorization survive a server restart when `/data` is persistent and `HOST_KEY` stays the same. Dropped connections reconnect automatically; visible tabs also refresh state every five seconds if the live stream fails. Waking a phone immediately reconnects and restores its current round, saved vote, and last hunt result. Recovery uses this browser's cookie: clearing site data or using a different browser requires joining again. **Change room** returns to the join form if a student reopens an older rehearsal room.

The host can switch between **Number hunt** and **Proof or Bluff** at any point. Leaving a running hunt pauses its timer. **Activity controls** can resume or restart the timer, reveal the hunt, jump to any proof round, or reopen voting. Reopening preserves votes for revision and removes that round's score until it is revealed again. Restarting the hunt timer preserves guesses. The two activities keep separate UI state; factorization is shown only in the hunt.

During a connection outage, controls show a reconnecting state and disable submissions. Requests time out instead of leaving buttons stuck. Late requests cannot change a newer round or restarted timer. A retried guess with the same request ID returns its saved receipt without counting it twice. For an offline fallback, use the call-out or show-of-hands controls in the deck.

The original QR images live in `public/qr/artwork.png` and `public/qr/normal.png`. They are copied into the built presentation unchanged, at their original resolution; nothing loads from Downloads. Replace either file with the original replacement PNG, then rebuild and deploy. Both images must encode `https://proofs.zaydkrunz.com/join`. The host remembers the artwork/normal choice for the browser tab, including across refreshes and activity changes. Clicking either image also opens its large view; Escape closes that view.

## Exact integers and honest factor lists

The hunt uses native JavaScript **BigInt** for the input, exponentiation, GCD, and factorization. It never converts those integers to floating-point `Number`. BigInt is arbitrary precision; the form's 100-digit input limit is a workload limit, not a 64-bit arithmetic limit. Inputs and outputs travel as decimal strings so JSON cannot round them.

The shared-factor result is exact. Prime factorization runs continuously in a phone Web Worker, with **no overall timeout**. It stops when both factorizations are complete, a new accepted guess replaces the search, the activity switches to Proof or Bluff, or the tab closes. The worker alternates between A and B and sends live progress without running the search on the page's main thread. It continues across the timer's end. Returning to the hunt starts a fresh factor search for the saved last guess. Browsers may throttle or suspend background tabs.

The search uses trial division, perfect-square detection, and repeated Pollard rho attempts. Deterministic Miller–Rabin certifies primes only below its proven `2^64` bound. Larger pieces that pass twelve Miller–Rabin bases are labeled **probable prime, not proven**, and the search continues. This certification bound does not limit the integers the worker can factor. A large prime may keep it searching indefinitely; this is intentional. Each attempt retains only its current state, without accumulating candidate history.

Repeated factors use exponent notation. The phone shows a short product for A and B, plus a remaining piece while the search runs. For more than five distinct prime terms, it shows the first three, an ellipsis, and the last. **Full numbers & details** expands the complete factor lists and exact decimal values. The full product of factors found multiplied by the remainder always equals the original number exactly.

The first nonnegative counterexample is `8424432925592889329288197322308900672459420460792433`. At this input, the exact GCD is `8936582237915716659950962253358945635793453256935559`. See the published source below. The participant API withholds the reveal until the host reveals it; the presentation itself contains the answers, as any ordinary classroom deck does.

## The sandwich bounty and guess receipts

The host screen and script include the Wingstop sandwich line during the one-minute hunt. With `STATE_PATH` configured, each validated input is appended to `guesses.jsonl` and synced to disk **before arithmetic**. A second record is synced after its result. Records include an increasing receipt number, room, player name, exact input, and timestamp. The host can download this room's log. After a crash, completed guesses missing from the room snapshot are recovered; an unfinished input remains evidence and is not automatically rerun.

Factorization consumes the participant's CPU. The server only performs the bounded input validation, exact exponentiation, and GCD. It accepts up to 100 input digits, one guess per player per half-second, and 6,000 guesses per room. Request bodies, connections, slow streams, and active rooms are bounded too. These protections reduce failure risk; they are not a guarantee that a machine cannot crash.

The journal has a 32 MiB cap and rejects new calculations if it cannot safely record them. Between classes, download any logs you want to retain, stop the app, archive `/data/guesses.jsonl`, then restart. Room state expires after four hours; the journal remains until archived. The durable-log claim is appropriate only when the host dashboard confirms disk logging is available.

## Timing

| Segment | Clock |
| --- | --- |
| Shared-factor hunt, reveal, and what proof means | 0:00–4:30 |
| Logic, implication, and quantifiers | 4:30–8:40 |
| Proof methods and worked examples | 8:40–19:00 |
| Choose a method | 19:00–19:45 |
| Five rounds of Proof or Bluff | 19:45–25:45 |
| Toolkit and exit challenge | 25:45–27:50 |
| Closing and questions | 27:50–30:00 |

The notes contain about 3,600 spoken words. Rehearse near 150 words per minute and honor the activity pauses. Timing depends on the class. If discussion runs long, shorten slide 23 and the recap on slide 25; keep the complete worked proofs intact.

## Local development

Requires Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Copy `.env.example` to `.env.local`, replace `HOST_KEY` with a random secret, then run `npm run voting` in another terminal. Vite forwards the activity routes to port 3040. For a production-like rehearsal, run `npm run build`, then `npm run voting`, and open `http://localhost:3040/host`.

The supplied QR images encode the public join URL, including during a local rehearsal. To join a local room, type the local server's `/join` address manually. The dynamic room-specific QR API still uses `PUBLIC_URL`, which must be reachable from participants' phones.

## Editing and checks

- `slides.md`: content, animation steps, timing, and presenter notes.
- `components/`: mathematical demos and projector activity displays.
- `lib/logic.mjs`: proof rounds and logic examples.
- `lib/hunt.mjs` and `voting/integers.mjs`: exact shared-factor challenge.
- `voting/factor-search.mjs` and `voting/factor-worker.js`: continuous factor search and live progress.
- `voting/factor.mjs`: deterministic primality test below `2^64` and the older bounded helper used by math checks.
- `server/server.mjs` and `server/guess-journal.mjs`: named rooms, host authorization, deadlines, voting, durable guess receipts, and live updates.
- `voting/`: phone and host pages.

```sh
npm run check
npm run build
```

The checks verify the 52-digit counterexample, exact factor products beyond 64 bits, a continuously running worker and replacement input, invalid input handling, name and host-access rules, journal recovery and storage limits, deadline and restart behavior, all five rounds, stale submissions, idempotent retries, personal-state recovery, failed disk writes, and 40 live connections making 400 durable 100-digit guesses. Transport tests cover phone wake, polling fallback, expired rooms, and request timeouts.

To create a static backup, use `npm run export`. On this Mac, append `-- --executable-path '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'` if Playwright has no browser installed. Static exports cannot preserve the interactive activities.

## Coolify deployment

Deploy the GitHub repository using its `Dockerfile`, port `3040`, and health check path `/health`. The build runs the tests and Slidev build. Use a single replica because broadcasts are in process.

Set runtime variables:

```text
HOST_KEY=<private host password, at least 10 characters; a long unique secret is recommended>
PUBLIC_URL=https://proofs.zaydkrunz.com
PORT=3040
STATE_PATH=/data/rooms.json
```

Mount a persistent volume at `/data`, writable by the container's `node` user (UID 1000). Keep `.env*`, `data/`, and `.qa/` out of Git. No host secret is embedded in the slides or QR codes. The server stores the chosen display names, guesses, and votes; it requests no contact information.

## Sources

- [Frenkel and Pelikán, On the greatest common divisor of the value of two polynomials](https://arxiv.org/abs/1608.07936), American Mathematical Monthly 124 (2017), 446–450, Example 1(b): the opening counterexample.
- [Richard Hammack's Book of Proof](https://richardhammack.github.io/BookOfProof/), Chapters 2, 4–7, 9–10: mathematical background. Explanations in the deck are original.
- [Deterministic Miller–Rabin bases](https://miller-rabin.appspot.com/): the seven-base test used only for integers below `2^64`.
- [Slidev](https://sli.dev/) and [KaTeX](https://katex.org/); Inter, Space Grotesk, and IBM Plex Mono bundled from Fontsource.
