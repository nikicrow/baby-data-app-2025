"""Export frontend wire types from Pydantic. Run with the repository's Python environment.

This imports schemas without starting the API or querying the database.
Use --check in CI to detect schema drift without modifying the generated file.
"""

import argparse
import json
from pathlib import Path
import re
import sys

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "backend"))

from app.schemas import analytics, baby, diaper, feeding, growth, sleep  # noqa: E402


def ts_type(schema):
    if "$ref" in schema:
        return schema["$ref"].rsplit("/", 1)[-1]
    if "anyOf" in schema:
        return " | ".join(ts_type(item) for item in schema["anyOf"])
    if "enum" in schema:
        return " | ".join(json.dumps(value) for value in schema["enum"])
    if "const" in schema:
        return json.dumps(schema["const"])
    kind = schema.get("type")
    if kind == "array":
        return f"Array<{ts_type(schema['items'])}>"
    if kind == "object":
        extra = schema.get("additionalProperties", True)
        return f"Record<string, {ts_type(extra) if isinstance(extra, dict) else 'unknown'}>"
    pattern = schema.get("pattern", "")
    if re.fullmatch(r"\^\([a-z]+(?:\|[a-z]+)+\)\$", pattern):
        return " | ".join(json.dumps(value) for value in pattern[2:-2].split("|"))
    return {"string": "string", "integer": "number", "number": "number", "boolean": "boolean", "null": "null"}.get(kind, "unknown")


def generate():
    definitions = {}
    responses = set()
    for module, prefix in [(baby, "BabyProfile"), (feeding, "FeedingSession"), (sleep, "SleepSession"), (diaper, "DiaperEvent"), (growth, "GrowthMeasurement")]:
        for suffix in ["Create", "Update", "Response"]:
            name = prefix + suffix
            model = getattr(module, name)
            schema = model.model_json_schema(mode="serialization" if suffix == "Response" else "validation")
            definitions.update(schema.pop("$defs", {}))
            definitions[name] = schema
            if suffix == "Response":
                responses.add(name)
    for name in ["BabySummary", "DailyMetricsRow", "WeeklyMetricsRow", "ComparisonResponse"]:
        schema = getattr(analytics, name).model_json_schema(mode="serialization")
        definitions.update(schema.pop("$defs", {}))
        definitions[name] = schema
        responses.add(name)

    lines = ["// Generated from backend/app/schemas by frontend/scripts/generate_api_types.py.",
             "// Do not edit. Dates are YYYY-MM-DD; datetimes are ISO 8601 strings.",
             "// Optional request fields may be omitted; null follows Pydantic's nullable fields.", ""]
    for name, schema in sorted(definitions.items()):
        if "properties" not in schema:
            if "enum" in schema:
                values_name = name[0].lower() + name[1:] + "Values"
                lines += [f"export const {values_name} = {json.dumps(schema['enum'])} as const;",
                          f"export type {name} = typeof {values_name}[number];", ""]
            else:
                lines += [f"export type {name} = {ts_type(schema)};", ""]
            continue
        lines.append(f"export interface {name} {{")
        required = set(schema.get("required", []))
        for field, value in schema["properties"].items():
            constraints = {key: value[key] for key in ["format", "minimum", "exclusiveMinimum", "maximum", "minLength", "maxLength", "pattern"] if key in value}
            if constraints:
                lines.append(f"  /** {json.dumps(constraints, separators=(',', ':'))} */")
            optional = "" if name in responses or field in required else "?"
            lines.append(f"  {field}{optional}: {ts_type(value)};")
        lines += ["}", ""]
    return "\n".join(lines)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    destination = REPO / "frontend/src/types/api.generated.ts"
    result = generate()
    if args.check:
        if not destination.exists() or destination.read_text(encoding="utf-8") != result:
            sys.exit("API types are out of date. Run frontend/scripts/generate_api_types.py.")
        print("API types match Pydantic schemas.")
    else:
        destination.write_text(result, encoding="utf-8")
        print("Generated frontend/src/types/api.generated.ts")
