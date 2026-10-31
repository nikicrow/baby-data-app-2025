"""Export the existing dbt/baby_ml contract without redefining features or labels."""

import importlib.util
import json


def load_snapshot(snapshot, dbt_repo, baby_id):
    import pandas as pd

    # Load the actual FeatureSpec without importing baby_ml's heavyweight
    # package __init__ (which eagerly loads SHAP, plotting and all estimators).
    path = dbt_repo / "ml" / "baby_ml" / "features.py"
    spec = importlib.util.spec_from_file_location("dbt_sleep_features", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    df = pd.read_parquet(snapshot)
    df = df.loc[df.baby_id.astype(str) == baby_id].copy()
    if df.empty:
        raise ValueError("Baby ID is absent from the selected dbt snapshot.")
    features = module.FeatureSpec().feature_columns(df)
    targets = list(module.FeatureSpec.LABELS[:2])
    if not df.prediction_id.is_unique:
        raise ValueError("Duplicate prediction IDs in snapshot.")
    if set(df.split_forward_time.unique()) != {"train", "val", "test"}:
        raise ValueError("Expected the existing train/val/test forward-time split.")
    if df[targets].isna().any().any() or not df[targets].isin([0, 1]).all().all():
        raise ValueError("Targets must be observed binary values.")
    if (df[targets[0]] > df[targets[1]]).any():
        raise ValueError("30-minute positives must also be 60-minute positives.")
    numeric = df[features].select_dtypes("number")
    if numeric.isin([float("inf"), -float("inf")]).any().any():
        raise ValueError("Infinite feature value in snapshot.")
    for column in features:
        if pd.api.types.is_datetime64_any_dtype(df[column]):
            raise ValueError("Absolute datetimes must not be uploaded as features.")
    # Retain the snapshot row order for joins back to existing Predictions.
    groups = {s: df.loc[df.split_forward_time == s] for s in ("train", "val", "test")}
    for earlier, later in (("train", "val"), ("val", "test")):
        if groups[earlier].prediction_time.max() + pd.Timedelta(minutes=60) >= groups[later].prediction_time.min():
            raise ValueError("Label windows cross a split boundary; review/purge consistently for all models.")
    for target in targets:
        if set(groups["train"][target].unique()) != {0, 1}:
            raise ValueError("Training requires both positive and negative labels.")
    # JSON conversion gives native scalars and nulls, including categorical/nullable columns.
    rows = {}
    for split, group in groups.items():
        columns = ["prediction_id", "prediction_time", "calendar_date"] + features + targets
        rows[split] = json.loads(group[columns].to_json(orient="records", date_format="iso"))
        for row in rows[split]:
            for target in targets:
                row[target] = "yes" if row[target] == 1 else "no"
    return features, targets, rows
