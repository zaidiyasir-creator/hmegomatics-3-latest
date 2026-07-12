from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import asyncio
import logging
import os
import smtplib
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Any, Dict, List, Optional

import bcrypt
import jwt
from fastapi import (
    APIRouter,
    Depends,
    FastAPI,
    File,
    Header,
    HTTPException,
    Request,
    UploadFile,
)
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware


# ---------------- Logging ----------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("hm-geomatics")


# ---------------- Mongo ----------------
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]


# ---------------- Auth helpers ----------------
JWT_ALG = "HS256"
JWT_EXPIRES_HOURS = 24


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRES_HOURS),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALG)


async def get_current_user(
    authorization: Optional[str] = Header(default=None),
) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await db.users.find_one(
        {"id": payload["sub"]}, {"_id": 0, "password_hash": 0}
    )
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------------- Brute force (in-memory, simple) ----------------
_login_attempts: Dict[str, List[float]] = {}
RATE_WINDOW_SEC = 15 * 60
RATE_MAX = 5


def _rate_check(ip: str) -> None:
    now = time.time()
    bucket = [t for t in _login_attempts.get(ip, []) if now - t < RATE_WINDOW_SEC]
    if len(bucket) >= RATE_MAX:
        raise HTTPException(
            status_code=429,
            detail="Too many failed attempts. Try again in 15 minutes.",
        )
    _login_attempts[ip] = bucket


def _rate_fail(ip: str) -> None:
    _login_attempts.setdefault(ip, []).append(time.time())


def _rate_reset(ip: str) -> None:
    _login_attempts.pop(ip, None)


# ---------------- Models ----------------
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


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class Service(BaseModel):
    n: str
    icon: str = ""  # legacy path to /icons/*.svg (kept for backward compat, unused in new grid)
    t: str
    d: str
    photo: str = ""
    alt: str = ""
    key: str = ""  # lucide icon key: boundary|map|building|layers|ship|radar|drone|mountain|satellite|database|construction|utility|scan|activity
    slug: str = ""  # URL slug e.g. "land-boundary-survey"
    long_description: str = ""  # extended description for detail page
    equipment: List[str] = Field(default_factory=list)
    deliverables: List[str] = Field(default_factory=list)
    standards: List[str] = Field(default_factory=list)


class SiteContent(BaseModel):
    """Single editable document at db.content (key='site')."""

    hero_eyebrow_left: str = "EST · 2024"
    hero_eyebrow_left_sub: str = "SEREMBAN · 2.7297° N"
    hero_eyebrow_right: str = "LJT 617"
    hero_eyebrow_right_sub: str = "101.9381° E"
    hero_tagline: str = "WORLD DYNAMIC GEOMATIC LEADER · SEREMBAN, MALAYSIA"
    quote_text: str = (
        "Hard work and persistence have brought us here. Our strength has "
        "always been a focus on our people, our teams, and our clients."
    )
    quote_attribution_role: str = "Managing Director"
    quote_attribution_name: str = (
        "LSr Muhammad Hazwan bin Dato' LSr Mohd Mazlan"
    )
    quote_attribution_credential: str = "Licensed Land Surveyor"
    services: List[Service] = Field(default_factory=list)
    manifesto_eyebrow: str = "Our Promise · MMXXVI"
    manifesto_words: List[str] = Field(
        default_factory=lambda: ["Precision.", "Innovation.", "Excellence."]
    )
    manifesto_tagline: str = (
        "Three principles guiding every line, every level, every legal boundary we deliver."
    )
    about_intro: str = (
        "At HM Geomatics Sdn. Bhd., we deliver efficient, accurate, and "
        "integrated land surveying services. We combine knowledge, hands-on "
        "experience, and the latest technologies — from single lots to "
        "multi-level apartments, from private developments to major public "
        "infrastructure."
    )
    values: List[List[str]] = Field(
        default_factory=lambda: [
            ["R", "Respect"],
            ["A", "Accountability"],
            ["S", "Sustainability"],
            ["E", "Excellence"],
            ["C", "Cooperative"],
            ["C", "Customer-Centricity"],
        ]
    )
    director_name: str = "LSr Muhammad Hazwan bin Dato' LSr Mohd Mazlan"
    director_role: str = "Managing Director · Licensed Land Surveyor"
    director_bio: str = (
        "With over a decade of experience in land surveying and geomatics, "
        "LSr Hazwan leads HM Geomatics with a commitment to precision, "
        "innovation, and client excellence. Previously serving at Jurukur "
        "Teras Sdn. Bhd. from 2010–2024, he brings unmatched field "
        "expertise and professional credentials to every project."
    )
    director_photo: str = "/director-hazwan.jpg"
    director_quals: List[str] = Field(
        default_factory=lambda: [
            "Licensed Land Surveyor · Act 458",
            "FIG/IHO/ICA Category A",
            "CUUDS-LS 2024",
            "B.Eng Geomatic (Hons) · UTM 2014",
            "MAALS Member 2020",
        ]
    )
    address_line1: str = "No. 20, Betaria Business Centre"
    address_line2: str = "Jalan Durian Emas 3, Off Jalan Dato' Siamang Gagap"
    address_line3: str = "70100 Seremban, Negeri Sembilan, Malaysia"
    phone_office: str = "+606 761 0867"
    phone_director: str = "+6013 315 8958"
    email: str = "hazwan@hmgeomatics.com"
    whatsapp_number: str = "60133158958"
    ssm: str = "SSM: 202401037321 (1583168-K)"
    ljt: str = "LJT Reg. No: LJT 617"
    mof: str = "MOF Cert: J10961822104057517"
    cert_validity: str = "Valid: 10/01/2025 – 09/01/2028"
    practice_cert: str = "Practice Name Cert No: 01170"
    hours: str = (
        "Monday — Friday · 09:00 – 18:00 MYT · Field visits arranged by appointment"
    )


DEFAULT_SERVICES = [
    Service(
        n="01",
        key="boundary",
        slug="land-boundary-survey",
        t="Land Boundary Survey",
        d="Accurate determination of legal land boundaries for subdivision, title transfer, development approvals and property ownership.",
        photo="/services/01_land_boundary_survey.webp",
        alt="HM Geomatics licensed surveyor using a total station on a land boundary",
        long_description="Land boundary surveys precisely establish the legal limits of a property, forming the foundation for every land transaction, subdivision approval and development submission in Malaysia. Our team is licensed under Akta Juruukur Tanah Berlesen 1958 (Act 458) and registered with Lembaga Jurukur Tanah Malaysia, delivering boundary marking, re-establishment and pre-computation plans certified for submission to PTG, JUPEM and local planning authorities.",
        equipment=["Leica TS16 total station", "Trimble R12i GNSS receiver", "Robotic tribrach + reflector prisms", "Digital theodolite (backup)"],
        deliverables=["Certified boundary plan (Pelan Ukur)", "Coordinate list (GDM 2000)", "Photographic evidence of marker recovery", "Field survey report"],
        standards=["JUPEM Cadastral Standards", "Akta Juruukur Tanah 1958 (Act 458, Rev. 2024)", "Peninsular Malaysia Datum (GDM 2000)"],
    ),
    Service(
        n="02",
        key="map",
        slug="topographic-survey-mapping",
        t="Topographic Survey & Mapping",
        d="Detailed mapping of natural and man-made features supporting engineering design, planning and construction projects.",
        photo="/services/02_topographic_survey_mapping.webp",
        alt="Topographic survey and mapping — contour lines and terrain features",
        long_description="Topographic surveys capture the three-dimensional character of a site — elevations, gradients, drainage, vegetation, structures and utilities — producing the base plans your architects and engineers rely on. We combine GNSS RTK, robotic total stations and UAV photogrammetry to deliver contour and detail mapping accurate enough for design-development and construction submission.",
        equipment=["Leica TS16 robotic total station", "Trimble R12i GNSS (RTK)", "DJI Matrice 350 RTK UAV", "GPR for buried service overlay"],
        deliverables=["Contour plan (0.25 m or 0.5 m intervals)", "Detail plan with feature codes", "Digital Terrain Model (DTM)", "3D CAD file (.dwg / .dgn)"],
        standards=["Peninsular Malaysia Datum (GDM 2000)", "JKR / JUPEM survey specifications", "Client engineering specifications"],
    ),
    Service(
        n="03",
        key="building",
        slug="engineering-survey",
        t="Engineering Survey",
        d="High-precision setting out, alignment and control surveys for buildings, roads, bridges and infrastructure projects.",
        photo="/services/03_engineering_survey.webp",
        alt="Engineering survey — precision setting out on a construction site",
        long_description="Engineering surveys ensure that every column, foundation, kerb, invert and alignment on a construction site is set out to millimetre precision. Our surveyors establish primary control networks, transfer levels, monitor structural alignment and provide the as-built verification your consultants and CoW require throughout the project lifecycle.",
        equipment=["Leica TS16 robotic total station (1″)", "Trimble R12i GNSS", "Digital precise level (Leica LS15)", "Prism poles + fixed reflectors"],
        deliverables=["Site control network + coordinate list", "Setting-out plans", "Level book / benchmark register", "Fortnightly progress reports"],
        standards=["JKR Design Standards", "BS 5606 Setting Out Tolerances", "ISO 4463 Measurement Methods for Building"],
    ),
    Service(
        n="04",
        key="layers",
        slug="title-cadastral-survey",
        t="Title / Cadastral Survey",
        d="Boundary verification and cadastral documentation supporting subdivision, land registration and property ownership.",
        photo="/services/04_title_cadastral_survey.webp",
        alt="Title and cadastral survey — boundary verification and documentation",
        long_description="Cadastral surveys formally document the legal footprint of a parcel for issuance of Geran Mukim, Pajakan or strata titles. HM Geomatics prepares Pre-Computation Plans (PCP), Certified Plans (CP) and strata layouts for submission to JUPEM and PTG. Every plan is signed off by our licensed land surveyor.",
        equipment=["Leica TS16 total station", "Trimble R12i GNSS (RTK)", "JUPEM-approved cadastral software", "Field-to-finish coding workflow"],
        deliverables=["Pre-Computation Plan (PCP)", "Certified Plan (CP)", "Strata / stratum plans", "Digital submission package for JUPEM e-Kadaster"],
        standards=["JUPEM e-Kadaster specifications", "Akta Hakmilik Strata 1985", "National Land Code 1965"],
    ),
    Service(
        n="05",
        key="ship",
        slug="hydrographic-survey",
        t="Hydrographic Survey",
        d="Bathymetric and hydrographic surveys for ports, rivers, coastal developments and offshore engineering projects.",
        photo="/services/05_hydrographic_survey.webp",
        alt="Hydrographic survey — bathymetric mapping on a survey vessel",
        long_description="Hydrographic surveys reveal what lies beneath the waterline — riverbeds, harbour approaches, reclamation footprints and offshore project areas. Certified under FIG / IHO / ICA Category A standards, we deliver multibeam bathymetry, side-scan mosaics and precise tide-corrected volume calculations for ports, marinas and coastal engineering works.",
        equipment=["Multibeam echosounder", "Motion Reference Unit (MRU)", "RTK GNSS with heading", "Sound velocity profiler + tide gauge"],
        deliverables=["Bathymetric chart", "Side-scan sonar mosaic", "Volume / dredge calculation report", "IHO Special Order QC log"],
        standards=["IHO S-44 Special Order", "FIG / IHO / ICA Category A", "IMCA S-014 Survey Standards"],
    ),
    Service(
        n="06",
        key="scan",
        slug="lidar-survey",
        t="LiDAR Survey",
        d="High-resolution laser scanning for terrain modelling, asset documentation and infrastructure mapping.",
        photo="/services/06_lidar_survey.webp",
        alt="LiDAR survey — 3D laser scanning point cloud",
        long_description="LiDAR delivers dense, geometrically accurate 3D point clouds of terrain, forest canopies, industrial plants and heritage structures — often in a fraction of the time of conventional survey. Our airborne and terrestrial LiDAR workflows produce classified deliverables ready for engineering design, BIM coordination and asset management.",
        equipment=["Airborne LiDAR (payload)", "Terrestrial laser scanner (Leica RTC360)", "Mobile mapping backpack", "Ground control network via GNSS"],
        deliverables=["Classified LAS / LAZ point cloud", "Digital Elevation & Terrain Models", "Feature-extracted CAD drawings", "Point-cloud viewer package"],
        standards=["ASPRS LiDAR Standards", "USGS Lidar Base Specification v2.1", "Client BIM/CAD deliverable specs"],
    ),
    Service(
        n="07",
        key="radar",
        slug="underground-utility-detection-mapping",
        t="Underground Utility Detection & Mapping",
        d="Accurate detection and mapping of underground utilities to minimise construction risks and prevent accidental damage.",
        photo="/services/07_underground_utility_detection_mapping.webp",
        alt="Underground utility detection and mapping with ground penetrating radar",
        long_description="Undetected buried services are the single largest cause of avoidable construction incidents. Our utility detection combines electromagnetic locators and ground-penetrating radar (GPR) to trace metallic and non-metallic services, delivering a georeferenced 3D map of what lies beneath the surface — reducing strike risk and safeguarding programme.",
        equipment=["Multi-frequency GPR", "Electromagnetic locator", "Utility tracer wire kit", "GNSS RTK positioning"],
        deliverables=["Georeferenced utility plan", "PAS 128 Quality Level classification", "3D CAD utility model", "Site marking + photographic register"],
        standards=["PAS 128:2022 Detection of Underground Utilities", "SUE Utility Quality Levels A–D", "TNB / IWK / SYABAS record checks"],
    ),
    Service(
        n="08",
        key="mountain",
        slug="mining-survey",
        t="Mining Survey",
        d="Survey solutions for mining operations including stockpile measurement, volume calculations, compliance and monitoring.",
        photo="/services/08_mining_survey.webp",
        alt="Mining survey — open pit stockpile measurement",
        long_description="From lease boundary establishment to periodic volume take-off and slope monitoring, our mining survey services support quarries, open-pit operations and reclamation projects. We combine UAV photogrammetry, terrestrial laser scanning and GNSS to deliver the reserves, movement and compliance data mining engineers rely on.",
        equipment=["DJI Matrice 350 RTK UAV", "Terrestrial laser scanner", "Trimble R12i GNSS", "Robotic total station"],
        deliverables=["Stockpile volume report", "Pit progression maps", "Slope monitoring dashboard", "Reclamation as-built plans"],
        standards=["JMG (Minerals & Geoscience) reporting", "AS 3798 (earthworks fill certification)", "Client mine plan compliance"],
    ),
    Service(
        n="09",
        key="drone",
        slug="drone-survey-uav",
        t="Drone Survey (UAV)",
        d="Professional UAV aerial mapping, photogrammetry and site monitoring for fast, safe and cost-effective geospatial data collection.",
        photo="/services/09_drone_survey_uav.webp",
        alt="Drone survey (UAV) — aerial photogrammetry over a project site",
        long_description="UAV surveys deliver up-to-date aerial imagery and photogrammetric mapping at a fraction of the time and cost of ground-based methods. Our CAAM-registered pilots fly RTK-equipped platforms to produce centimetre-accurate orthomosaics, DSMs and progress reels for planning, construction and monitoring.",
        equipment=["DJI Matrice 350 RTK", "DJI Mavic 3 Enterprise", "DJI Terra & Pix4D processing", "GCP kit with RTK base"],
        deliverables=["High-resolution orthomosaic (GSD ≤ 2 cm)", "Digital Surface Model (DSM)", "3D textured mesh", "Progress video / time-lapse"],
        standards=["CAAM UAS Operations (Part IX)", "ASPRS Positional Accuracy", "Client mapping accuracy specs"],
    ),
]


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category: Optional[str] = Field(default=None, max_length=120)
    location: Optional[str] = Field(default=None, max_length=160)
    year: Optional[str] = Field(default=None, max_length=20)
    description: Optional[str] = Field(default=None, max_length=2000)
    image: Optional[str] = None
    order: Optional[int] = 0


class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: Optional[str] = None
    location: Optional[str] = None
    year: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------- Email ----------------
def _send_email_sync(subject: str, body: str) -> None:
    host = os.environ.get("SMTP_HOST", "").strip()
    user = os.environ.get("SMTP_USER", "").strip()
    pwd = os.environ.get("SMTP_PASSWORD", "").strip()
    sender = os.environ.get("SMTP_FROM", "").strip() or user
    recipient = os.environ.get("EMAIL_TO", "").strip()
    port = int(os.environ.get("SMTP_PORT", "587") or 587)

    if not host or not user or not pwd or not sender or not recipient:
        logger.info("SMTP not configured — skipping email notification")
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = recipient
    msg.set_content(body)

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=10) as s:
                s.login(user, pwd)
                s.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=10) as s:
                s.starttls()
                s.login(user, pwd)
                s.send_message(msg)
        logger.info("Enquiry email sent to %s", recipient)
    except Exception as exc:
        logger.warning("Failed to send enquiry email: %s", exc)


async def send_enquiry_email(enq: Enquiry) -> None:
    subject = f"[HM Geomatics] New enquiry — {enq.subject or 'No subject'}"
    body = (
        f"New enquiry received via the HM Geomatics website.\n\n"
        f"Name:    {enq.name}\n"
        f"Email:   {enq.email}\n"
        f"Phone:   {enq.phone or '—'}\n"
        f"Subject: {enq.subject or '—'}\n"
        f"When:    {enq.created_at.isoformat()}\n\n"
        f"Message:\n{enq.message}\n\n"
        f"— HM Geomatics website"
    )
    await asyncio.to_thread(_send_email_sync, subject, body)


# ---------------- Seeding ----------------
async def seed_admin() -> None:
    email = os.environ["ADMIN_EMAIL"].lower().strip()
    password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one(
            {
                "id": str(uuid.uuid4()),
                "email": email,
                "password_hash": hash_password(password),
                "name": "Admin",
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        logger.info("Seeded admin user %s", email)
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one(
            {"email": email},
            {"$set": {"password_hash": hash_password(password)}},
        )
        logger.info("Updated admin password hash for %s", email)


async def seed_content() -> None:
    existing = await db.content.find_one({"key": "site"})
    if existing is None:
        doc = SiteContent(services=DEFAULT_SERVICES).model_dump()
        doc["key"] = "site"
        await db.content.insert_one(doc)
        logger.info("Seeded default site content")


async def ensure_indexes() -> None:
    await db.users.create_index("email", unique=True)
    await db.enquiries.create_index([("created_at", -1)])
    await db.projects.create_index([("order", 1), ("created_at", -1)])
    await db.content.create_index("key", unique=True)


# ---------------- Lifespan ----------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await ensure_indexes()
        await seed_admin()
        await seed_content()
    except Exception as exc:
        logger.error("Startup error: %s", exc)
    yield
    client.close()


app = FastAPI(title="HM Geomatics API", lifespan=lifespan)

# Serve uploaded images
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

api_router = APIRouter(prefix="/api")


# ---------------- Public routes ----------------
@api_router.get("/")
async def root():
    return {"service": "HM Geomatics", "status": "ok"}


@api_router.get("/content")
async def get_content() -> dict:
    doc = await db.content.find_one({"key": "site"}, {"_id": 0, "key": 0})
    if not doc:
        # Should not happen because seed_content runs at startup
        return SiteContent(services=DEFAULT_SERVICES).model_dump()
    return doc


@api_router.get("/services/{slug}")
async def get_service_by_slug(slug: str) -> dict:
    doc = await db.content.find_one({"key": "site"}, {"_id": 0, "services": 1})
    services = (doc or {}).get("services", [])
    for s in services:
        if (s.get("slug") or "") == slug:
            return s
    raise HTTPException(status_code=404, detail="Service not found")


@api_router.get("/projects", response_model=List[Project])
async def list_projects_public() -> List[dict]:
    docs = (
        await db.projects.find({}, {"_id": 0})
        .sort([("order", 1), ("created_at", -1)])
        .to_list(200)
    )
    for d in docs:
        if isinstance(d.get("created_at"), str):
            try:
                d["created_at"] = datetime.fromisoformat(d["created_at"])
            except ValueError:
                d["created_at"] = datetime.now(timezone.utc)
    return docs


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
    # Fire-and-forget email
    asyncio.create_task(send_enquiry_email(obj))
    return obj


# ---------------- Auth routes ----------------
@api_router.post("/auth/login")
async def auth_login(payload: LoginPayload, request: Request):
    ip = request.client.host if request.client else "unknown"
    _rate_check(ip)

    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        _rate_fail(ip)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    _rate_reset(ip)
    token = create_access_token(user["id"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", "Admin"),
            "role": user.get("role", "admin"),
        },
    }


@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    return user


# ---------------- Backward-compat shim (old /api/admin/login) ----------------
class LegacyAdminAuth(BaseModel):
    password: str


@api_router.post("/admin/login")
async def legacy_admin_login(payload: LegacyAdminAuth, request: Request):
    """Legacy endpoint kept for any cached clients. Issues a JWT for the
    seeded admin if the password matches ADMIN_PASSWORD."""
    ip = request.client.host if request.client else "unknown"
    _rate_check(ip)
    admin_email = os.environ["ADMIN_EMAIL"].lower().strip()
    user = await db.users.find_one({"email": admin_email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        _rate_fail(ip)
        raise HTTPException(status_code=401, detail="Invalid password")
    _rate_reset(ip)
    token = create_access_token(user["id"], user["email"])
    return {"token": token, "access_token": token, "ok": True}


# ---------------- Admin · Enquiries ----------------
@api_router.get("/admin/enquiries", response_model=List[Enquiry])
async def list_enquiries(user: dict = Depends(get_current_user)):
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
    enquiry_id: str, user: dict = Depends(get_current_user)
):
    res = await db.enquiries.delete_one({"id": enquiry_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"deleted": enquiry_id}


# ---------------- Admin · Content ----------------
@api_router.put("/admin/content")
async def update_content(
    payload: SiteContent, user: dict = Depends(get_current_user)
):
    doc = payload.model_dump()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.content.update_one(
        {"key": "site"}, {"$set": doc}, upsert=True
    )
    return {"ok": True}


# ---------------- Admin · Projects ----------------
@api_router.get("/admin/projects", response_model=List[Project])
async def list_projects_admin(user: dict = Depends(get_current_user)):
    return await list_projects_public()


@api_router.post("/admin/projects", response_model=Project)
async def create_project(
    payload: ProjectCreate, user: dict = Depends(get_current_user)
):
    obj = Project(**payload.model_dump())
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.projects.insert_one(doc)
    return obj


@api_router.put("/admin/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    payload: ProjectCreate,
    user: dict = Depends(get_current_user),
):
    existing = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    updates = payload.model_dump()
    await db.projects.update_one({"id": project_id}, {"$set": updates})
    merged = {**existing, **updates}
    if isinstance(merged.get("created_at"), str):
        try:
            merged["created_at"] = datetime.fromisoformat(merged["created_at"])
        except ValueError:
            merged["created_at"] = datetime.now(timezone.utc)
    return Project(**merged)


@api_router.delete("/admin/projects/{project_id}")
async def delete_project(
    project_id: str, user: dict = Depends(get_current_user)
):
    res = await db.projects.delete_one({"id": project_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"deleted": project_id}


# ---------------- Admin · Upload ----------------
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB


@api_router.post("/admin/upload")
async def upload_image(
    file: UploadFile = File(...), user: dict = Depends(get_current_user)
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {sorted(ALLOWED_EXTS)}",
        )
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 8 MB)")

    name = f"{uuid.uuid4().hex}{ext}"
    out = UPLOAD_DIR / name
    out.write_bytes(data)
    return {"url": f"/api/uploads/{name}", "filename": name, "bytes": len(data)}


# ---------------- Router & Middleware ----------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
