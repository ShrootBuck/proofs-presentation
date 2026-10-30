# Prove It

A 30-minute Slidev presentation by Zayd Krunz about mathematical proof: 25 timed slides, a reference appendix, a verbatim presenter script, and two live classroom activities.

## Presenting

- Local preview: `http://localhost:3030`. Intended public URL: `https://proofs.zaydkrunz.com`. See [deployment-status.md](deployment-status.md) for verified hosting status.
- Open `/#/presenter/1` in the same browser for the script, next-slide preview, and 30-minute timer. Put the normal presentation window on the projector and keep presenter view on your laptop.
- Right Arrow or Space advances an animation. Left Arrow goes back. Use the visible buttons inside the demos and games.
- The study script is in [presenter-script.md](presenter-script.md). Bracketed cues and timing labels are stage directions, not spoken text.
- Fonts and math rendering are bundled locally. Phone participation requires the server. Call-out guesses and the show-of-hands game work without it.

## One QR room, two activities

1. Before class, open `/host` privately and enter the `HOST_KEY` from this app's Coolify environment variables. Create a **new room** for each rehearsal or class.
2. Open the deck and presenter view using the links on that page, in the same browser.
3. On slide 2, students scan the QR code or visit `/join` and enter the room code. No names or accounts are requested.
4. Click **Start the 60 seconds**. Students enter a nonnegative integer n, trying to make `A = n^17 + 9` and `B = (n+1)^17 + 9` share a factor greater than 1. The server enforces the deadline. When it ends, click **Reveal the counterexample**.
5. Students keep the same phone page open. On slide 22, click **Open Proof or Bluff**, then **Start round 1**.
6. For each of the five rounds, students can change their vote until **Lock voting**. Ask someone to defend a step, then **Reveal the answer**. Continue with **Next round** and **Final score**.

The five arguments cover division by zero, consecutive integers, a missing induction base case, a true conclusion with an invalid converse argument, and an existence proof by cases. A correct majority earns the class a point; a tie earns the traps a point. An empty round awards no point. One vote is stored per browser, so this is a discussion game, not an identity-verified assessment.

Rooms expire after four hours. The deadline, guesses, votes, and host authorization survive a server restart when `/data` is persistent and `HOST_KEY` stays the same. Dropped connections reconnect automatically. For the offline fallback, select **Use call-out guesses** on slide 2 or **Use show of hands** on slide 22. Presenter and audience windows share local demo state when opened in the same browser.

## Exact integers and honest factor lists

The hunt uses native JavaScript **BigInt** for the input, exponentiation, GCD, and factorization. It never converts those integers to floating-point `Number`. BigInt is arbitrary precision; the form's 100-digit input limit is a workload limit, not a 64-bit arithmetic limit. Inputs and outputs travel as decimal strings so JSON cannot round them.

The shared-factor result is exact. Prime factorization is a separate, time-bounded job in a phone Web Worker. It uses trial division and Pollard rho, with deterministic Miller–Rabin only below its proven `2^64` bound. That bound controls which remainders may be **certified prime**, not which integers the hunt can calculate. Larger unresolved pieces are explicitly labeled **unfactored remainder**, never prime.

For more than ten prime factors, the phone shows the first four, an ellipsis, and the last factor, with a control to expand the full list. The complete decimal values of A, B, and any remainder can also be expanded. Factors found multiplied by the remainder always equal the original number exactly.

The first nonnegative counterexample is `8424432925592889329288197322308900672459420460792433`. At this input, the exact GCD is `8936582237915716659950962253358945635793453256935559`. See the published source below. The participant API withholds the reveal until the host reveals it; the presentation itself contains the answers, as any ordinary classroom deck does.

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

The notes contain about 3,600 spoken words. Rehearse near 150 words per minute and honor the activity pauses. Timing depends on the class. If discussion runs long, shorten slide 21 and the recap on slide 23; keep the complete worked proofs intact.

## Local development

Requires Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Copy `.env.example` to `.env.local`, replace `HOST_KEY` with a random secret, then run `npm run voting` in another terminal. Vite forwards the activity routes to port 3040. For a production-like rehearsal, run `npm run build`, then `npm run voting`, and open `http://localhost:3040/host`.

QR codes use `PUBLIC_URL`, which must be reachable from participants' phones.

## Editing and checks

- `slides.md`: content, animation steps, timing, and presenter notes.
- `components/`: mathematical demos and projector activity displays.
- `lib/logic.mjs`: proof rounds and logic examples.
- `lib/hunt.mjs` and `voting/integers.mjs`: exact shared-factor challenge.
- `voting/factor.mjs`: bounded prime factorization.
- `server/server.mjs`: rooms, host authorization, deadlines, voting, and live updates.
- `voting/`: phone and host pages.

```sh
npm run notes
npm run check
npm run build
```

The checks verify the 52-digit counterexample, exact factor products, invalid input handling, deadline and restart behavior, and a 40-participant session covering both activities and all five rounds.

To create a static backup, use `npm run export`. On this Mac, append `-- --executable-path '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'` if Playwright has no browser installed. Static exports cannot preserve the interactive activities.

## Coolify deployment

Deploy the GitHub repository using its `Dockerfile`, port `3040`, and health check path `/health`. The build runs the tests and Slidev build. Use a single replica because broadcasts are in process.

Set runtime variables:

```text
HOST_KEY=<long random private secret, at least 24 characters>
PUBLIC_URL=https://proofs.zaydkrunz.com
PORT=3040
STATE_PATH=/data/rooms.json
```

Mount a persistent volume at `/data`, writable by the container's `node` user (UID 1000). Keep `.env*`, `data/`, and `.qa/` out of Git. No host secret is embedded in the slides or QR codes. The server stores no names or contact information.

## Sources

- [Frenkel and Pelikán, On the greatest common divisor of the value of two polynomials](https://arxiv.org/abs/1608.07936), American Mathematical Monthly 124 (2017), 446–450, Example 1(b): the opening counterexample.
- [Richard Hammack's Book of Proof](https://richardhammack.github.io/BookOfProof/), Chapters 2, 4–7, 9–10: mathematical background. Explanations in the deck are original.
- [Deterministic Miller–Rabin bases](https://miller-rabin.appspot.com/): the seven-base test used only for integers below `2^64`.
- [Slidev](https://sli.dev/) and [KaTeX](https://katex.org/); Inter, Space Grotesk, and IBM Plex Mono bundled from Fontsource.
