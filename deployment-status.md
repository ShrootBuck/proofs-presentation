# Deployment status

Updated October 29, 2026.

The revised deck contains the shared-factor hunt, exact BigInt arithmetic, continuous on-device factorization with no overall timeout, a separate host dashboard, names and room codes, durable guess receipts, and five Proof or Bluff rounds. The source and study script are current. The [private GitHub repository](https://github.com/ShrootBuck/proofs-presentation) is the deployment source. Public hosting is **not live**.

## Prepared in Coolify

- Existing application: **Prove It**
- [Application configuration](https://coolify.zaydkrunz.com/project/kp2lbocqj3hb6f7qhmnycbpe/environment/ghjimjd1htvvheyvilf8ieuf/application/wlqvq4kwljn7xqmnp1ftwyu4)
- Port `3040`; intended public URL `https://proofs.zaydkrunz.com`.
- Runtime variables and a `/data` persistent volume were previously saved and verified.
- The private production host key is in the gitignored `.env.production.local` file and Coolify environment variables.

The old inline Dockerfile deployment failed before building with `Argument list too long`. The replacement is a normal GitHub-backed Dockerfile build. Coolify and GitHub are signed in again. The existing Coolify GitHub App is being connected to the presentation repository.

## Verification boundaries

- All 14 automated checks pass, including exact factor products beyond 64 bits, continuous worker progress and replacement, named players, host authorization, disk-journal recovery and capacity handling, deadlines, restart behavior, and 40-participant API sessions.
- A local Mac load check accepted 400 guesses from 40 simulated players, each with a 100-digit input, and wrote all 800 input/result records to disk. It took 3.8 seconds, with a 394 ms p95 request time. This is a local check, not a measurement of the production laptop or classroom Wi-Fi.
- The production Slidev build passes.
- The dependency audit reports zero known vulnerabilities after updating KaTeX and pinning patched DOMPurify and image-size versions.
- The earlier 26-slide version was visually checked and exported. The latest host, phone, opening, and five-round game need a fresh visual pass; the old local PDF is not a current deliverable.
- Browser navigation to `localhost:3030` and `dash.cloudflare.com` still returns a saved-permission denial after the reboot and after clearing site data. No alternate browser or indirect access has been used to bypass that denial.
- Cloudflare hostname routing and public end-to-end verification remain unfinished.

See [README.md](README.md) for local operation and deployment configuration.
