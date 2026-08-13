from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database

router = APIRouter(
    prefix="/brand",
    tags=["brands"]
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/brands", response_model=List[schemas.Brand])
def read_brands(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_brands(db, skip=skip, limit=limit)

@router.post("/brands", response_model=schemas.Brand)
def create_brand(brand: schemas.BrandCreate, db: Session = Depends(get_db)):
    return crud.create_brand(db=db, brand=brand)

@router.get("/{brand_id}/ppms", response_model=List[schemas.PPM])
def read_ppms(brand_id: int, db: Session = Depends(get_db)):
    return crud.get_ppms(db, brand_id=brand_id)

@router.post("/ppms", response_model=schemas.PPM)
def create_ppm(ppm: schemas.PPMCreate, db: Session = Depends(get_db)):
    return crud.create_ppm(db=db, ppm=ppm)

@router.get("/{brand_id}/analysis", response_model=List[schemas.WeeklyAnalysis])
def get_analysis(brand_id: int, db: Session = Depends(get_db)):
    return crud.get_weekly_analyses(db, brand_id=brand_id)

@router.post("/{brand_id}/ppms/{ppm_id}/analyze", response_model=schemas.WeeklyAnalysis)
def trigger_weekly_analysis(brand_id: int, ppm_id: int, db: Session = Depends(get_db)):
    analysis = crud.generate_weekly_analysis(db, brand_id=brand_id, ppm_id=ppm_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="PPM not found")
    return analysis
