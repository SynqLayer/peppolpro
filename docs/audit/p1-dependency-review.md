# P1-17 dependency review (2026-09-13)

The exact-version assertions originated in f153f790547dae86a14356ff5994fa1cba567a6b (security override pins). They now verify actual lockfile resolutions against reviewed package.json pins, including nested dependency resolution. The project search found no other hardcoded dependency-version assertions.

js-yaml 4.3.1 was published on 2026-07-31T17:39:51.183Z; 4.3.2 on 2026-08-26T20:42:48.747Z. Both registry manifests identify publisher and sole maintainer vitaly, and repository nodeca/js-yaml. The upstream 4.3.2 changelog documents CPU limits for empty merge mappings and a maximum merge sequence length of 100. No new install lifecycle hook was introduced. Both manifests lack provenance attestations; publisher identity alone is not cryptographic proof of account security.

The downloaded 4.3.2 tarball SHA-512 matches registry integrity and package-lock.json. All 27 runtime files under lib/, index.js and bin/js-yaml.js match the upstream 4.3.2 tag byte for byte. These checks support retaining 4.3.2; no conflicting provenance evidence was found.

Sources:
- https://registry.npmjs.org/js-yaml
- https://github.com/nodeca/js-yaml/blob/4.3.2/CHANGELOG.md
- https://github.com/nodeca/js-yaml/tree/4.3.2

Next/eslint-config-next 16.3.5, sharp 0.35.4, js-yaml 4.3.2 and @humanfs/node 0.16.8 each passed lint, typecheck, all 229 tests and a production build. The final npm audit reports zero advisories. Build configuration matches CI dummy values and does not prove live integrations.
