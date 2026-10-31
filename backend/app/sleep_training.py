"""19th CLI: python -m app.sleep_training --help (run from backend/)."""

import argparse
import csv
import hashlib
import json
import math
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from app.dbt_sleep_dataset import load_snapshot

ORIGIN = "https://training.19th.com"
ROOT = Path(__file__).resolve().parents[1]


def save(path, value):
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2, default=str), encoding="utf-8")
    temporary.replace(path)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_csv(path, rows, columns):
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def prepare(args):
    if args.out.exists() and any(args.out.iterdir()):
        raise ValueError("Output folder is not empty; use a new folder to preserve runs.")
    if not args.snapshot or not args.dbt_repo or not args.baby_id:
        raise ValueError("prepare requires --snapshot, --dbt-repo and --baby-id.")
    features, targets, rows = load_snapshot(args.snapshot, args.dbt_repo, args.baby_id)
    args.out.mkdir(parents=True, exist_ok=True)
    for horizon, target in zip((30, 60), targets):
        write_csv(args.out / f"train-{horizon}.csv", rows["train"], features + [target])
        data = (args.out / f"train-{horizon}.csv").read_bytes()
        request = {
            "name": f"Baby sleep within {horizon} minutes",
            "file": {"content_length": len(data), "sha256": hashlib.sha256(data).hexdigest()},
            "spec": {"target_column": target, "input_columns": features,
                     "output_kind": "event_probability", "positive_label": "yes",
                     "training_mode": args.mode},
            "model_variant": "fast", "wait": False, "inline": False,
        }
        save(args.out / f"request-{horizon}.json", request)
    for split in ("val", "test"):
        save(args.out / f"{split}.json", rows[split])
    summary = {
        "source": "dbt.ml_sleep_training_set", "snapshot": str(args.snapshot.resolve()),
        "snapshot_sha256": hashlib.sha256(args.snapshot.read_bytes()).hexdigest(),
        "feature_spec_sha256": hashlib.sha256((args.dbt_repo / "ml/baby_ml/features.py").read_bytes()).hexdigest(),
        "baby_id": args.baby_id, "features": features, "targets": targets,
        "split_column": "split_forward_time",
        "splits": {part: {"rows": len(rs), "first": min(r["prediction_time"] for r in rs),
                           "last": max(r["prediction_time"] for r in rs)} for part, rs in rows.items()},
        "positive_rates": {part: {target: sum(r[target] == "yes" for r in rs) / len(rs)
                                   for target in targets} for part, rs in rows.items()},
        "assumptions": ["Existing dbt grid, feature values and day splits preserved",
                        "Single-baby experiment: previous pooled model scores are not directly comparable",
                        "Event-time backtest; import/edit availability cannot be reconstructed",
                        "No names, dates of birth, IDs, notes or absolute timestamps uploaded"],
    }
    save(args.out / "summary.json", summary)
    print(json.dumps(summary, indent=2))


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # Never forward a bearer token via a redirect.


def api(url, data=None, content_type="application/json", idempotency_key=None):
    parsed = urlsplit(url)
    if (parsed.scheme != "https" or parsed.netloc not in
            {"training.19th.com", "inference.get19th.com"} or parsed.username):
        raise ValueError("Refusing to send credentials to an undocumented API origin.")
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env.19th")
    key = os.environ.get("NINETEENTH_API_KEY")
    if not key:
        raise ValueError("Set NINETEENTH_API_KEY in backend/.env.19th or the environment.")
    headers = {"Authorization": f"Bearer {key}", "Content-Type": content_type}
    if idempotency_key:
        headers["Idempotency-Key"] = idempotency_key
    request = Request(url, data=data, headers=headers)
    with build_opener(NoRedirect()).open(request, timeout=100) as response:
        return json.load(response)


def multipart(request, data):
    boundary = "babytraining" + uuid.uuid4().hex
    prefix = (
        f'--{boundary}\r\nContent-Disposition: form-data; name="request"\r\n'
        'Content-Type: application/json\r\n\r\n' + json.dumps(request) +
        f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="training.csv"\r\n'
        'Content-Type: text/csv\r\n\r\n'
    ).encode()
    return prefix + data + f"\r\n--{boundary}--\r\n".encode(), f"multipart/form-data; boundary={boundary}"


def train(args):
    for horizon in (30, 60):
        response_path = args.out / f"fit-{horizon}.json"
        if response_path.exists():
            print(f"{horizon}m: saved run exists; use status (no new submission).")
            continue
        request = read(args.out / f"request-{horizon}.json")
        data = (args.out / f"train-{horizon}.csv").read_bytes()
        if request["file"] != {"content_length": len(data), "sha256": hashlib.sha256(data).hexdigest()}:
            raise ValueError("CSV changed after preparation. Prepare a new output folder.")
        key_path = args.out / f"submission-{horizon}.json"
        fingerprint = hashlib.sha256(json.dumps(request, sort_keys=True).encode() + data).hexdigest()
        if key_path.exists():
            submission = read(key_path)
            if submission["fingerprint"] != fingerprint:
                raise ValueError("Request changed since submission; use a new output folder.")
            if (datetime.now(timezone.utc) - datetime.fromisoformat(submission["created_at"])).days >= 7:
                raise ValueError("Idempotency key expired. Recover the existing run from 19th before retrying.")
        else:
            submission = {"key": str(uuid.uuid4()), "fingerprint": fingerprint,
                          "created_at": datetime.now(timezone.utc).isoformat()}
            save(key_path, submission)  # Persist BEFORE sending, for safe recovery after timeouts.
        body, content_type = multipart(request, data)
        result = api(ORIGIN + "/v1/fit", body, content_type, submission["key"])
        save(response_path, result)
        print(f"{horizon}m: {result.get('state')} (run {result.get('run_id')})")


def status(args):
    for horizon in (30, 60):
        path = args.out / f"fit-{horizon}.json"
        old = read(path)
        url = urljoin(ORIGIN, old["status_url"])
        if urlsplit(url).netloc != "training.19th.com":
            raise ValueError("Status must be on the training origin.")
        result = api(url)
        save(path, result)
        print(json.dumps({"horizon": horizon, "state": result.get("state"),
                          "prediction": result.get("model", {}).get("prediction"),
                          "error": result.get("error")}, indent=2))


def probabilities(out, horizon, inputs):
    fit = read(out / f"fit-{horizon}.json")
    prediction = fit.get("model", {}).get("prediction", {})
    if fit.get("state") != "ready" or prediction.get("state") != "ready":
        raise ValueError(f"{horizon}m model is not ready for hosted inference; run status.")
    values = []
    for start in range(0, len(inputs), 500):
        batch = inputs[start:start+500]
        result = api(prediction["url"], json.dumps({"input": batch}).encode())
        output = result["output"]
        if len(output) != len(batch):
            raise ValueError("Inference output count does not match input count.")
        for item in output:
            value = float(item["probability"])
            if not math.isfinite(value) or not 0 <= value <= 1:
                raise ValueError("Invalid probability in inference response.")
            values.append(value)
    return values


def metrics(labels, values):
    tp = sum(y and p >= .5 for y, p in zip(labels, values))
    fp = sum(not y and p >= .5 for y, p in zip(labels, values))
    fn = sum(y and p < .5 for y, p in zip(labels, values))
    return {"brier_score": sum((p - y) ** 2 for y, p in zip(labels, values)) / len(labels),
            "precision_at_0.5": tp / (tp + fp) if tp + fp else None,
            "recall_at_0.5": tp / (tp + fn) if tp + fn else None,
            "positive_rate": sum(labels) / len(labels), "rows": len(labels)}


def evaluate(args):
    rows = read(args.out / f"{args.split}.json")
    summary = read(args.out / "summary.json")
    inputs = [{key: r[key] for key in summary["features"]} for r in rows]
    results, predictions = {}, {}
    for horizon, target in zip((30, 60), summary["targets"]):
        cache = args.out / f"predictions-{args.split}-{horizon}.json"
        if cache.exists():
            saved = read(cache)
            if saved["prediction_ids"] != [r["prediction_id"] for r in rows]:
                raise ValueError("Cached prediction rows changed; use an intact run folder.")
            values = saved["probabilities"]
        else:
            values = probabilities(args.out, horizon, inputs)
            save(cache, {"prediction_ids": [r["prediction_id"] for r in rows], "probabilities": values})
        labels = [int(r[target] == "yes") for r in rows]
        baseline = summary["positive_rates"]["train"][target]
        results[target] = {"model": metrics(labels, values),
                           "constant_training_rate_baseline": metrics(labels, [baseline] * len(rows))}
        predictions[target] = values
    a, b = summary["targets"]
    results["inconsistent_horizons"] = sum(x > y for x, y in zip(predictions[a], predictions[b]))
    save(args.out / f"evaluation-{args.split}.json", results)
    print(json.dumps(results, indent=2))


def predict(args):
    if not args.inputs:
        raise ValueError("predict requires --inputs JSON containing dbt-compatible feature records.")
    summary = read(args.out / "summary.json")
    inputs = read(args.inputs)
    inputs = [inputs] if isinstance(inputs, dict) else inputs
    if not isinstance(inputs, list) or not inputs:
        raise ValueError("Inputs must be a nonempty object or array of objects.")
    for record in inputs:
        if not isinstance(record, dict) or set(record) != set(summary["features"]):
            raise ValueError("Each input must contain exactly the saved dbt feature columns.")
        if any(isinstance(v, (dict, list)) or (isinstance(v, float) and not math.isfinite(v))
               for v in record.values()):
            raise ValueError("Inputs must contain finite scalar values or null.")
    results = {f"sleep_within_{h}m": probabilities(args.out, h, inputs) for h in (30, 60)}
    results["inconsistent_horizons"] = [a > b for a, b in zip(results["sleep_within_30m"], results["sleep_within_60m"])]
    print(json.dumps(results, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["prepare", "train", "status", "evaluate", "predict"])
    parser.add_argument("--out", type=Path, default=ROOT / "training-output" / "dbt-imogen-19th")
    parser.add_argument("--baby-id")
    parser.add_argument("--mode", choices=["instant", "standard", "high", "ultra"], default="standard")
    parser.add_argument("--snapshot", type=Path)
    parser.add_argument("--dbt-repo", type=Path)
    parser.add_argument("--split", choices=["val", "test"], default="val")
    parser.add_argument("--inputs", type=Path)
    args = parser.parse_args()
    try:
        globals()[args.command](args)
    except Exception as exc:
        from urllib.error import HTTPError
        if isinstance(exc, HTTPError):
            print(f"19th HTTP {exc.code}. Retry-After: {exc.headers.get('Retry-After', 'not supplied')}.")
            print("Saved submission keys are preserved. Check API permissions/limits before retrying.")
        elif isinstance(exc, ValueError):
            print(str(exc))
        else:
            print(f"{type(exc).__name__}: operation failed; saved run files are preserved.")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
