# Deployment status

Updated October 29, 2026.

The revised deck contains the shared-factor hunt, exact BigInt arithmetic, phone factor lists, and five Proof or Bluff rounds. The source and study script are current. Public hosting is **not live**.

## Prepared in Coolify

- Existing application: **Prove It**
- [Application configuration](https://coolify.zaydkrunz.com/project/kp2lbocqj3hb6f7qhmnycbpe/environment/ghjimjd1htvvheyvilf8ieuf/application/wlqvq4kwljn7xqmnp1ftwyu4)
- Port `3040`; intended public URL `https://proofs.zaydkrunz.com`.
- Runtime variables and a `/data` persistent volume were previously saved and verified.
- The private production host key is in the gitignored `.env.production.local` file and Coolify environment variables.

The old inline Dockerfile deployment failed before building with `Argument list too long`. The replacement plan is a normal GitHub-backed Dockerfile build, authorized by the user.

## Verification boundaries

- Automated math, room, deadline, and 40-participant checks pass for the revised implementation.
- The production Slidev build passes.
- The earlier 26-slide version was visually checked and exported. The new opening and five-round game still require a fresh visual pass; the old local PDF is not a current deliverable.
- Browser navigation to `localhost:3030` and `dash.cloudflare.com` still returns a saved-permission denial after the reboot and after clearing site data. No alternate browser or indirect access has been used to bypass that denial.
- Cloudflare hostname routing and public end-to-end verification remain unfinished.

See [README.md](README.md) for local operation and deployment configuration.
