"""
Route: /api/reports
Generates and downloads reports in CSV and PDF formats.
"""
import io
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from database.db import get_session
from services.report_service import export_csv, export_pdf, get_summary

router = APIRouter(prefix="/api", tags=["Reports"])


@router.get("/reports/summary")
def report_summary(session: Session = Depends(get_session)):
    """Return text summary and sentiment/emotion counts for the Reports page."""
    try:
        return get_summary(session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")


@router.get("/reports/download")
def download_report(
    format: str = Query(default="csv", enum=["csv", "pdf"]),
    session: Session = Depends(get_session),
):
    """
    Download the full analysis report.
    - format=csv → CSV file
    - format=pdf → PDF file
    """
    try:
        if format == "csv":
            buf = export_csv(session)
            return StreamingResponse(
                iter([buf.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=sentiment_report.csv"},
            )
        elif format == "pdf":
            buf = export_pdf(session)
            return StreamingResponse(
                buf,
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=sentiment_report.pdf"},
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {e}")


# Backward-compatible aliases
@router.get("/export/csv")
def export_csv_compat(session: Session = Depends(get_session)):
    buf = export_csv(session)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sentiment_report.csv"},
    )


@router.get("/export/pdf")
def export_pdf_compat(session: Session = Depends(get_session)):
    buf = export_pdf(session)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=sentiment_report.pdf"},
    )


@router.get("/insights/summary")
def insights_summary_compat(session: Session = Depends(get_session)):
    return get_summary(session)
