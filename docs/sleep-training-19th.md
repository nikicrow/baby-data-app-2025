# 19th sleep training adapter (prepared, not submitted)

The canonical modeling project is `C:/Users/nikil/dbt-baby-data`. Its `baby_ml`
package owns features, labels, chronological splits, and model comparisons.
This adapter was prepared in the app workspace and should move alongside
`baby_ml` before ongoing model development. No training has been submitted.

## Prepared dataset

The adapter reads the frozen `ml_sleep_training_set_20260923T211259.parquet`
snapshot and the actual `baby_ml/features.py` FeatureSpec. It preserves all 52
features and existing 10-minute prediction rows; it does not recreate dbt logic.
For Imogen, the existing forward-time splits contain 7,395 train, 1,791 validation,
and 1,782 test rows. Only train rows go into the training CSVs. Both labels are
onset-based: a new sleep starts within (0,30] or (0,60] minutes while awake.

The prepared files are in `backend/training-output/dbt-imogen-19th/` (gitignored).
`summary.json` records source and FeatureSpec hashes, row counts, dates and class
balance. The earlier `2026-history/` export is superseded and must not be used.
No names, baby IDs, dates of birth, timestamps, or notes are uploaded. Age and
sleep/feed/diaper summaries are model inputs. Identifiers stay in local evaluation
files for joining scores back to the existing comparison framework.

## Commands in the current workspace

Run from `baby-data-app-2025/backend`. Use the dbt environment, which already has
pandas and parquet support:

```powershell
$mlPython = 'C:/Users/nikil/dbt-baby-data/.venv/Scripts/python.exe'
& $mlPython -m app.sleep_training train
& $mlPython -m app.sleep_training status
# Repeat status later until both hosted prediction states are ready.
& $mlPython -m app.sleep_training evaluate --split val
# Only after choices are frozen:
& $mlPython -m app.sleep_training evaluate --split test
```

Set `NINETEENTH_API_KEY` in the environment or in `backend/.env.19th` (gitignored).
The key needs `training:write`, `training:read`, and `inference:invoke`.
Training submits TWO standard-effort probability models; check the account's
allowance/cost before submission. The API request JSON, CSV bytes, idempotency
keys and returned run IDs are retained. Retry a lost submission with the same
command and unchanged files; saved runs are queried with status, never retrained.
Keys expire after seven days; recover an existing run before making new work.

`predict --inputs path/to/features.json` accepts one object or a list with exactly
the saved dbt feature columns. It does not calculate live features from app logs.
A production endpoint still needs parity with the dbt calculations and timestamp
semantics. The dbt snapshot uses naive timestamps; the adapter preserves them
locally and does not reinterpret them as UTC or upload them.

## Evaluation discipline

Evaluate on validation first. The existing test period has already been examined
in prior notebooks, so it is a historical benchmark, not a fresh untouched test.
Keep a later future period for final deployment validation. Cached predictions
include row IDs, preserving exact alignment for `baby_ml.Predictions`.

The CLI reports Brier score, precision/recall at 0.5, training-rate baseline, and
instances of P(30m) > P(60m). The existing baby_ml comparison framework should
also be used for PR-AUC, ROC-AUC, calibration and day-grouped uncertainty.
Independent horizon models can disagree; results are flagged rather than clamped.

Earlier tree/Jev/Kumo experiments trained or contextualized on BOTH babies.
This run uses Imogen only as requested, so old pooled results are not a controlled
comparison. Refit comparison models on the same Imogen-only train rows and score
on the same validation rows. Historical notebook results favor recent training
data; train+val refits must be compared against other train+val models on test,
not against train-only models on validation.

Missing sleep logs and backfilled records remain limits of an event-time
backtest. There is no claimed 19th accuracy until training and evaluation finish.

API references checked 29 October 2026:
- https://www.19th.com/docs/training
- https://www.19th.com/docs/inference
