# Dependency audit fixes

The October 2026 audit reported seven moderate entries from two transitive
chains. `gray-matter` and the unused `frontmatter` package pulled in js-yaml 3,
argparse 1 and vulnerable sprintf-js. Tailwind typography pulled in an older
postcss-selector-parser. npm proposed downgrading gray-matter and typography;
those downgrades were not used.

- Remove unused `frontmatter` (there were no imports).
- Keep gray-matter 4 for its delimiter/content handling. Override its js-yaml
  dependency with the direct js-yaml 4.3.2 dependency.
- Route content parsing and sitemap generation through `lib/frontmatter.js`.
  Its YAML engine uses `load`/`dump` instead of gray-matter's default
  `safeLoad`/`safeDump` calls, which modern js-yaml retires.
- Override only typography's selector parser with patched 7.1.6.
- Commit package.json and package-lock.json together; npm install/ci respects
  the overrides. Avoid reverting either override without checking the audit.

References:

- [gray-matter custom engines](https://github.com/jonschlinkert/gray-matter#optionsengines)
- [js-yaml documentation](https://github.com/nodeca/js-yaml)
- [sprintf-js advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)
- [selector parser advisory and fixed release](https://github.com/advisories/GHSA-rj75-hqrm-r3gf)

Validation:

1. `npm install`, then `npm audit` (expected zero reported vulnerabilities).
2. `npm test`: parser regression cases plus generator, sitemap, export and UI tests.
3. `npm run build`, then `npm run validate-export`.
4. Serve `out` locally; inspect home, a post, elements, a category and search
   at desktop/mobile widths in both themes. Check headings, lists and code blocks.

Before updating dependencies, all 196 Markdown documents were parsed with the
previous engine and their metadata/content saved outside the repository. After
updating, comparison found every document's metadata/content unchanged, including
JSON date representations. Full tests passed: 19 unit and 11 UI tests.
