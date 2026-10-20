## What

<!-- What problem does this solve, in one to three lines, in plain language. -->

## Scope

<!-- Required. Say what is in and what is deliberately left out. -->
<!--
In scope:
- The option catalogue and its standard prices
- The endpoints that read and write it

Out of scope:
- The order form, which comes next
-->

## Changes

<!-- The concrete changes, as bullets. -->

## Risk level

<!-- Required: low | medium | high -->
<!-- low   = documents, styles, an isolated screen
     medium = a behaviour change, a new screen, a database change
     high  = login, permissions, money, a data migration, anything a customer sees -->

## Rollback plan

<!-- Exactly how to get back if this goes wrong. "Revert it" on its own is not a plan. -->
<!--
1. Revert commit <sha>
2. No database change to undo
3. Redeploy from main
-->

## Test evidence

<!-- Real commands and real numbers. Not "tests pass". -->
<!--
web:    npm run typecheck   (pass)
web:    npm run lint        (pass)
web:    npm test            (166 passed, 18 files)
web:    npm run build       (pass)
server: ./mvnw verify       (pass)
-->

## Database changes

<!-- New tables, columns or migrations, and whether they can be re-run safely. Write "none" if there are none. -->

## Requirements this meets

<!-- The requirement codes from docs/SRS.md this delivers or changes. Write "none" for work that
     is not requirement-driven, such as tooling. -->

## Checklist

- [ ] Branch follows the naming used in this repository
- [ ] Screens: typecheck, lint, tests and build all pass
- [ ] Server: `./mvnw verify` passes
- [ ] New behaviour has tests
- [ ] No password, key or personal file in the diff
- [ ] Money is in whole sen and written as RM, never a dollar sign
- [ ] The three documents still agree with what was built, or say why not
- [ ] Rollback plan is specific
