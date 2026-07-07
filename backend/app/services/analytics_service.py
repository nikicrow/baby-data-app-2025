"""Read-only queries against the dbt-built marts schema.

marts.mart_daily_metrics is owned by the dbt-baby-data repo and refreshed
with `dbt run`; it is not a SQLAlchemy model, so these queries use raw SQL.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

DAILY_METRICS_TABLE = "marts.mart_daily_metrics"

_DAILY_QUERY = text(f"""
    select *
    from {DAILY_METRICS_TABLE}
    where baby_id = :baby_id
      and (:min_age_days is null or age_days >= :min_age_days)
      and (:max_age_days is null or age_days <= :max_age_days)
    order by metric_date
""")

_DAILY_ALL_BABIES_QUERY = text(f"""
    select *
    from {DAILY_METRICS_TABLE}
    order by age_days, baby_name
""")

_WEEKLY_QUERY = text(f"""
    select
        baby_id,
        baby_name,
        age_weeks,
        count(*) as days_in_week,
        round(avg(night_sleep_minutes), 1) as avg_night_sleep_minutes,
        round(avg(longest_night_stretch_minutes), 1) as avg_longest_night_stretch_minutes,
        round(avg(nap_count), 1) as avg_nap_count,
        round(avg(total_nap_minutes), 1) as avg_total_nap_minutes,
        round(avg(avg_nap_minutes), 1) as avg_nap_length_minutes,
        round(avg(feed_count), 1) as avg_feed_count,
        round(avg(avg_feed_interval_minutes), 1) as avg_feed_interval_minutes,
        round(avg(avg_wake_window_minutes), 1) as avg_wake_window_minutes,
        round(avg(max_wake_window_minutes), 1) as avg_max_wake_window_minutes,
        round(avg(diaper_count), 1) as avg_diaper_count
    from {DAILY_METRICS_TABLE}
    group by baby_id, baby_name, age_weeks
    order by age_weeks, baby_name
""")

_BABIES_QUERY = text(f"""
    select
        m.baby_id,
        m.baby_name,
        p.date_of_birth,
        max(m.age_days) as max_age_days
    from {DAILY_METRICS_TABLE} m
    inner join public.baby_profiles p on p.id = m.baby_id
    group by m.baby_id, m.baby_name, p.date_of_birth
    order by p.date_of_birth
""")


def _run(db: Session, query, **params) -> List[dict]:
    """Execute a marts query, translating a missing table into a 503."""
    try:
        result = db.execute(query, params or None)
    except ProgrammingError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"{DAILY_METRICS_TABLE} is missing or invalid. "
                "Run `dbt run` in the dbt-baby-data repo to build it."
            ),
        ) from exc
    return [dict(row) for row in result.mappings()]


def get_daily_metrics(
    db: Session,
    baby_id: UUID,
    min_age_days: Optional[int] = None,
    max_age_days: Optional[int] = None,
) -> List[dict]:
    """One baby's daily metric rows, oldest first."""
    return _run(
        db,
        _DAILY_QUERY,
        baby_id=str(baby_id),
        min_age_days=min_age_days,
        max_age_days=max_age_days,
    )


def get_comparison_babies(db: Session) -> List[dict]:
    """The babies present in the mart, with their data extent."""
    return _run(db, _BABIES_QUERY)


def get_weekly_comparison(db: Session) -> List[dict]:
    """All babies' metrics averaged per week of age."""
    return _run(db, _WEEKLY_QUERY)


def get_daily_comparison(db: Session) -> List[dict]:
    """All babies' raw daily rows ordered by age for age-aligned charts."""
    return _run(db, _DAILY_ALL_BABIES_QUERY)
