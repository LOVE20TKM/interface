# Issue tracker: Local Markdown

Issues and specs for this repo live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- Spec: `.scratch/<feature-slug>/spec.md`
- Tickets: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`
- Triage state: a `Status:` line near the top of each ticket
- Comments: appended under `## Comments`

## Skill operations

- Publish: create the corresponding file under `.scratch/<feature-slug>/`
- Fetch: read the referenced path or issue number

## Wayfinding

- Map: `.scratch/<effort>/map.md`
- Child ticket: `.scratch/<effort>/issues/<NN>-<slug>.md`
- Blocking: record `Blocked by: NN, NN`
- Claim: set `Status: claimed`
- Resolve: add `## Answer`, set `Status: resolved`, then update the map
