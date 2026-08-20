---
title: Lead Gen - Safe Local, Staging and Production Environments
status: draft
target_repo: dane-04-code/bitoleadgendash
priority: P0
---

# Build Contract: Separate Local, Staging and Production

## Problem

The documented local `.env.local` points to the live BITO Supabase project. An agent testing locally can therefore alter real leads, assignments, reps and pipeline history. Mock mode does not provide a production-like integration environment.

## Outcome

Local development is non-production by default, staging has separate credentials and synthetic/sanitized data, and production credentials are available only to the production deployment.

## Required environment model

| Environment | Data | Writes | Intended use |
|---|---|---|---|
| Local | Mock or dedicated local database | Safe | Coding and unit tests |
| Staging | Separate Supabase project with synthetic/sanitized fixtures | Safe | Integration and acceptance testing |
| Demo | Stable curated dataset; may initially share staging by explicit decision | Controlled | Presentations |
| Production | Live BITO project | Real | Sales team only |

## P0 requirements

- Document every current deployment, environment variable and database target without exposing values.
- Make local startup select mock/local data unless the developer takes an explicit, clearly labelled action.
- Add an unmistakable environment indicator outside production.
- Create/update `.env.example` with names and safe descriptions only.
- Add startup validation that refuses unsafe or incomplete combinations of environment and credentials.
- Provide a staging-data seed path using synthetic or approved sanitized data.
- Document deployment, credential ownership, rotation and rollback.
- Ensure staging and demo cannot write to production through Hermes, dashboard jobs or copied secrets.

## Blocking human decisions

- Hosting provider/project for staging.
- Separate Supabase staging project approval and owner.
- Whether demo initially shares staging.
- Approved production-deployment administrator.

## Explicit non-goals

- Multi-tenancy or white-labelling.
- Copying production PII into staging.
- Changing production schema as part of environment setup.
- Purchasing domains.
- Rebuilding deployment infrastructure beyond what isolation requires.

## Acceptance criteria

- [ ] A fresh clone cannot connect to production by default.
- [ ] Local development runs successfully with safe data.
- [ ] Staging has a distinct database and credentials.
- [ ] No production secrets exist in tracked files or staging configuration.
- [ ] The UI clearly identifies non-production environments.
- [ ] A documented smoke test passes in staging.
- [ ] Production deployment remains functional after configuration changes.
- [ ] Secret scan and repository history check report no newly exposed credentials.

## Safety gates

Infrastructure creation, secret changes, data copying and deployment all require explicit human approval. Never print secret values in logs or handback.

