from typing import List, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.analytics import ComparisonResponse, DailyMetricsRow
from app.services import analytics_service

router = APIRouter()


@router.get("/daily-metrics", response_model=List[DailyMetricsRow])
def get_daily_metrics(
    baby_id: UUID,
    min_age_days: Optional[int] = Query(None, ge=0),
    max_age_days: Optional[int] = Query(None, ge=0),
    db: Session = Depends(get_db),
) -> List[dict]:
    """One baby's daily metrics from the dbt mart, oldest first."""
    return analytics_service.get_daily_metrics(
        db, baby_id, min_age_days=min_age_days, max_age_days=max_age_days
    )


@router.get("/compare", response_model=ComparisonResponse)
def compare_babies(
    align: Literal["age_weeks", "age_days"] = "age_weeks",
    db: Session = Depends(get_db),
) -> ComparisonResponse:
    """All babies' metrics on a shared age axis for the Compare tab.

    age_weeks returns per-week averages (one row per baby per week of age);
    age_days returns the raw daily rows. Join/overlay on the age column.
    """
    babies = analytics_service.get_comparison_babies(db)
    if align == "age_weeks":
        return ComparisonResponse(
            align=align,
            babies=babies,
            weekly=analytics_service.get_weekly_comparison(db),
        )
    return ComparisonResponse(
        align=align,
        babies=babies,
        daily=analytics_service.get_daily_comparison(db),
    )
