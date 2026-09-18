# Revenue Insight — Flash Report & Account Intelligence (Interactive Demo)

This is an interactive public demo edition of the **Flash Report & Account Intelligence** system developed for B2B sales and executive intelligence.

## Overview

The platform translates multi-source intelligence (SEC filings, hiring trends, procurement notices, news signals, and relationship graphs) into prioritized account briefs and executive flash reports.

- **Executive Flash Report**: Curated cycle-over-cycle change reports identifying key movements and high-priority trends.
- **Cross-Account Intelligence Q&A**: Relationship-aware query engine answering strategic questions across the portfolio.
- **20 Interactive Account Briefs**: Deep-dive scorecards, manufacturing footprints, and actionable executive insights.

## Public Demo Edition Note

- **Anonymized Data**: Account identities, personnel references, and proprietary indicators have been mapped to realistic industrial pseudonyms (*Aegis Ground Dynamics*, *Vanguard Precision Systems*, *Apex Motion Dynamics*, etc.) to preserve client and partner confidentiality.
- **Zero Login Requirement**: Access controls have been opened for portfolio exploration.

## Running Locally

You can run this demo locally with any static web server:

```bash
# Using Node.js serve
npm start

# Or using Python 3
python3 -m http.server 8000 --directory public
```

Then visit `http://localhost:8000/flash-report/` or `http://localhost:8000/`.

## Deploying to Vercel

```bash
vercel deploy --prod
```
