"""
Route: /api/visualizations + /api/dashboard
Aggregated data for charts and dashboard summary.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from database.db import get_session
from services.visualize_service import (
    get_visualization_data, get_dashboard_summary, get_dataset_preview
)

router = APIRouter(prefix="/api", tags=["Visualizations"])


@router.get("/visualizations/data")
def visualizations_data(session: Session = Depends(get_session)):
    """
    Return aggregated sentiment + emotion data for chart rendering.
    """
    try:
        return get_visualization_data(session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visualization failed: {e}")


@router.get("/dashboard/summary")
def dashboard_summary(session: Session = Depends(get_session)):
    """
    Return high-level KPI summary for the Dashboard page.
    """
    try:
        return get_dashboard_summary(session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard summary failed: {e}")


# Backward-compat alias used by the existing frontend
@router.get("/dashboard")
def dashboard_compat(session: Session = Depends(get_session)):
    return get_visualization_data(session)


@router.get("/dataset/preview")
def dataset_preview(limit: int = 50, session: Session = Depends(get_session)):
    """
    Return a preview of the analyzed dataset.
    """
    return get_dataset_preview(session, limit)
