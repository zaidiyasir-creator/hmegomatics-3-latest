from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "hmgeomatics2026")

app = FastAPI(title="HM Geomatics API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class EnquiryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=40)
    subject: Optional[str] = Field(default=None, max_length=160)
    message: str = Field(min_length=1, max_length=4000)


class Enquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AdminAuth(BaseModel):
    password: str


# ---------- Helpers ----------
def require_admin(token: Optional[str]) -> None:
    if not token or token != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"service": "HM Geomatics", "status": "ok"}


@api_router.post("/enquiries", response_model=Enquiry)
async def create_enquiry(payload: EnquiryCreate):
    obj = Enquiry(
        name=payload.name.strip(),
        email=str(payload.email).strip(),
        phone=(payload.phone or "").strip() or None,
        subject=(payload.subject or "").strip() or None,
        message=payload.message.strip(),
    )
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.enquiries.insert_one(doc)
    return obj


@api_router.post("/admin/login")
async def admin_login(payload: AdminAuth):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"token": ADMIN_PASSWORD, "ok": True}


@api_router.get("/admin/enquiries", response_model=List[Enquiry])
async def list_enquiries(x_admin_token: Optional[str] = Header(default=None)):
    require_admin(x_admin_token)
    docs = (
        await db.enquiries.find({}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(1000)
    )
    for d in docs:
        if isinstance(d.get("created_at"), str):
            try:
                d["created_at"] = datetime.fromisoformat(d["created_at"])
            except ValueError:
                d["created_at"] = datetime.now(timezone.utc)
    return docs


@api_router.delete("/admin/enquiries/{enquiry_id}")
async def delete_enquiry(
    enquiry_id: str, x_admin_token: Optional[str] = Header(default=None)
):
    require_admin(x_admin_token)
    res = await db.enquiries.delete_one({"id": enquiry_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"deleted": enquiry_id}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
