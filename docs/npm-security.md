# npm dependency security — 2026-10-08

## Deployment and tooling boundary

Production uses GitHub `main` and Vercel's Git integration. No package script,
checked-in CI workflow or application import uses the project's `vercel`
devDependency. The preceding production build used platform CLI 62.1.0,
independently of the installed project CLI 41.4.1. Removing the unused project
CLI removes its archive extraction, development server and HTTP dependency
tree. It does not upgrade or configure Vercel's managed platform CLI.

The registry's current CLI 63.1.0 was evaluated in an isolated lockfile. Its
unmodified dependency tree still reports Critical/High findings, so installing
the latest CLI is not an adequate remediation by itself. If a future workflow
needs CLI commands, qualify that toolchain separately instead of automatically
restoring the old dependency or invoking an unpinned `npx vercel`.

## Qualified updates

Next.js 16.3.8, React/ReactDOM 18.3.1, next-auth 4.24.15, Stripe 16.12.0,
Tailwind 3.4.17 and all other direct runtime versions are unchanged.

| Change | Reason |
|---|---|
| ESLint 9.23.0 → 9.39.5 | Same-major tooling update brings patched plugin-kit; lint diagnostics remain identical. |
| `ajv@6` → 6.15.0 | Same-major legacy security line; fixes GHSA-2g4f-4pwh-qvx6. |
| `@humanfs/node@0.16` → 0.16.8 | Compatible patch for symlink-following copy, GHSA-p498-v437-472g. |
| `qs@6` → 6.16.0 | Compatible Stripe serializer patch for GHSA-4mjr-xmp4-gh2g and earlier qs findings. User-provided payment metadata reaches this serializer. |
| `yaml@2` → 2.9.1 | Same-major patch line addressing GHSA-48c2-rrv3-qjmp in configuration parsing. |
| `postcss-selector-parser@6` → 6.1.4 | Maintained legacy patch includes the CVE-2026-9358 recursion fix; does not fix the distinct flat-selector issue below. |

Existing scoped overrides from the preceding security release remain in place.
Each new override stays within the consumer's declared compatible range.
No cross-major override, automatic audit fix or application refactoring is used.

## Residual advisory boundaries

### braces 3.0.3 — GHSA-vfj7-8cjw-p6xm / CVE-2026-93687

No patched version is published at this review. Deeply nested attacker-chosen
brace patterns can exhaust the process stack. Callers in this project are
Tailwind's fast-glob/micromatch and chokidar, plus the Next ESLint plugin's
fast-glob. Tailwind `content` contains five literal repository paths. No
application API accepts glob patterns or imports these packages. COD/CIF/XRD
uploads and payment metadata are not passed to these pattern engines.

All 27 Next server output traces were checked: none references braces,
micromatch, fast-glob, chokidar, Tailwind or postcss-selector-parser. This is
additional evidence for the build/lint boundary, not a proof about every
possible future execution path. `npm audit --omit=dev` still counts Tailwind
because it is declared under dependencies; that label alone does not establish
deployed request-time reachability.

### postcss-selector-parser 6.1.4 — GHSA-rj75-hqrm-r3gf / CVE-2026-104844

Flat selectors can cause quadratic CPU consumption. The published fix is
7.1.6; the legacy 6.x patches do not contain it. Tailwind 3 declares `^6.1.2`.
Do not force version 7 merely to silence audit. Current inputs are checked-in
CSS/configuration and source class names, not user-supplied styles/selectors.
Generated CSS was compared byte-for-byte against the preceding release.

### Compensating boundary and follow-up

Treat source/CSS/glob configuration as trusted build inputs. Review contributions
that alter build configuration or dependency lockfiles before running them in a
credentialed environment. Do not add an endpoint accepting patterns or CSS
without revisiting these findings. Untrusted source builds should be isolated
from deployment credentials; production user uploads must remain outside the
build source tree. No new CI/platform control was configured by this release.

Residual findings are **OPEN**, with current exposure limited by the existing
architecture. Runtime paths reviewed here are not applicable to these two
vulnerable mechanisms; build/lint exposure to malicious source remains real.
Acceptance of residual risk is proposed to the application owner, not presumed.
Monitor publisher advisories for a braces fix and a compatible parser backport.
A Tailwind/parser major migration requires its own qualification and release.

## Validation and rollback

Require clean npm ci, all 45 frontend regressions, TypeScript, unchanged lint
diagnostics, production build, 14 synthetic auth checks, 11 built HTTP checks,
USER/ADMIN, COD/polling, three CIF fixtures, hardware-GPU 3D and XRD smoke.
Synthetic Stripe tests verify serialization and webhook signatures locally;
they never call Stripe or create payment objects.

Rollback baseline: commit `1329019ea7962f79ec1d2eda67e07574b6cc064f`,
Vercel `dpl_AC88JzsGJB2T24Ci7jGSFpyTLWnC`. Backend and production credentials
are outside this release. No backend memory tuning is included.

Sources:

- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- https://github.com/advisories/GHSA-rj75-hqrm-r3gf
- https://github.com/postcss/postcss-selector-parser/releases
- https://github.com/advisories/GHSA-23hp-3jrh-7fpw
- https://vercel.com/docs/cli
- https://registry.npmjs.org/vercel
