# Deployment status

Updated October 29, 2026.

The presentation and classroom server are deployed at **https://proofs.zaydkrunz.com**. The [private GitHub repository](https://github.com/ShrootBuck/proofs-presentation) is the deployment source.

- Presentation: https://proofs.zaydkrunz.com
- Separate host dashboard: https://proofs.zaydkrunz.com/host
- Student entry: https://proofs.zaydkrunz.com/join
- Study script: [presenter-script.md](presenter-script.md)

## Running deployment

- Coolify application: **Prove It Live**
- [Application configuration](https://coolify.zaydkrunz.com/project/kp2lbocqj3hb6f7qhmnycbpe/environment/ghjimjd1htvvheyvilf8ieuf/application/rczkgpel3ebclkklkjgzciaa)
- Verified implementation commit: `637bf636312c12423f95273330d3c177eb238e76`.
- [Successful deployment and health check](https://coolify.zaydkrunz.com/project/kp2lbocqj3hb6f7qhmnycbpe/environment/ghjimjd1htvvheyvilf8ieuf/application/rczkgpel3ebclkklkjgzciaa/deployment/mxnysextneuxmmwxwls4zdci), October 29 at 6:20 PM Arizona time.
- GitHub App access is limited to the existing Pickle Balls repository and this presentation repository. Its permissions are read-only.
- `HOST_KEY` is a runtime-only environment variable, reused from the original presentation setup. It is also in the gitignored `.env.production.local` file; no secret is in Git or the QR code.
- `PUBLIC_URL=https://proofs.zaydkrunz.com`; Dockerfile defaults supply port `3040` and `STATE_PATH=/data/rooms.json`.
- Persistent volume `rczkgpel3ebclkklkjgzciaa-prove-it-live-data` mounts at `/data`.
- Runtime limits: one CPU, 512 MiB memory, 128 MiB memory reservation.
- The existing Cloudflare tunnel has a published application route for `proofs.zaydkrunz.com` to `http://localhost:80`; Coolify routes this hostname to the app's internal port `3040`. Cloudflare created its CNAME automatically. HTTPS works at the public edge.

The old inline **Prove It** resource remains stopped. Its earlier `Argument list too long` build failure was replaced by this normal GitHub-backed Dockerfile deployment.

## Verified behavior

- All 14 local automated checks pass: exact factor products beyond 64 bits, continuous worker progress and replacement, names, host authorization, disk-journal recovery and capacity handling, deadlines, restart behavior, and 40-participant API sessions.
- The production Slidev build and the deployed container's Docker health check pass.
- The dependency audit reports zero known vulnerabilities after updating KaTeX and pinning patched DOMPurify and image-size versions.
- A local Mac load check accepted 400 guesses from 40 simulated players, each with a 100-digit input, and wrote all 800 input/result records to disk. It took 3.8 seconds, with a 394 ms p95 request time. This measures the local Mac, not the production laptop or classroom Wi-Fi.
- A live HTTPS API rehearsal on the deployed server verified two named players, exact 100-digit input handling, the real 60-second deadline, all five voting rounds, correct class and individual scores, and all four durable input/result journal records. The log endpoint rejects requests without host authorization.
- The live factor-worker module is served correctly. Factorization has no overall timeout; a new accepted guess replaces the previous worker.

## Browser verification

The current production build was rehearsed in the browser locally: named joining, the 60-second hunt, a 100-digit replacement guess, live factor updates, the reveal, all five voting rounds, and the 5/5 individual leaderboard. The search was still running after 234 seconds and continued through the proof game. The student layout was inspected at 390 x 844; the host at 1280 x 720. Both Slidev activity launchers and the offline fallbacks were checked, including the two new proof rounds. A crowded verdict in the fifth offline round was tightened before delivery. The old local PDF is not a current deliverable.

The public service passed the HTTPS API rehearsal. This Mac's system resolver was still caching the hostname's earlier empty DNS answer during the visual pass, so the UI rehearsal used the same production build at localhost. Cloudflare's resolver and the local Tailscale DNS query already returned the public addresses; no network settings were changed.

The earlier Cloudflare browser-access problem was resolved by using Brave's native computer controls at the user's request. No Cloudflare setup action remains pending.

See [README.md](README.md) for operation, factor-search behavior, and log retention.
