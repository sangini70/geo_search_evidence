# GEO Search Evidence Collector

Local First + Modular Monolith Skeleton for the GEO Search Evidence Collector.

This Stage 5-1 slice calls NAVER only when local credentials are configured and
preserves the provider response as a RAW snapshot. It does not normalize,
validate, calculate metrics, or generate a Search Evidence Pack.

## Run

Requires Node.js with native ES module and test support. No package install is
required.

```text
npm run check
npm test
npm start
```

Open `http://localhost:4173` after starting the local server.

## Local credentials

Copy `.env.example` to `.env` and fill these values locally:

- `NAVER_ADS_CUSTOMER_ID`: NAVER Ads customer ID
- `NAVER_ADS_ACCESS_LICENSE`: NAVER Ads access license
- `NAVER_ADS_SECRET_KEY`: NAVER Ads secret key

Never paste real values into chat, source code, browser code, logs, or RAW
files. Without these values the UI remains `WAITING_FOR_CREDENTIALS` and no
external request is made.

## Structure

- `src/core`: Canonical entity contracts and stable domain constants
- `src/app`: application entry and local HTTP server
- `src/collectors`: Collector boundary
- `src/providers`: provider-specific adapter boundary
- `src/normalizers`: normalization boundary
- `src/validators`: validation boundary
- `src/metrics`: derived metric boundary
- `src/repositories`: Local First repository contracts
- `src/exporters`: general export boundary
- `src/handoff`: Strategy Converter handoff boundary
- `src/ui`: minimal status screen only
- `data`: reserved local persistence projections
- `tests`: skeleton import/contract checks

Competition Ratio remains `NOT_CONFIGURED` until its existing GEO Source of
Truth is confirmed.
