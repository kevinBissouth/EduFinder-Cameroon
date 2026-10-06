import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.admin import admin_router
from app.api.auth import auth_router
from app.api.csrf import CsrfOriginMiddleware
from app.api.manager import manager_router
from app.api.routes import public_router
from app.core.config import MEDIA_DIR, settings


os.makedirs(MEDIA_DIR, exist_ok=True)

app = FastAPI(title=settings.app_name, version=settings.version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(CsrfOriginMiddleware)


@app.middleware("http")
async def secure_media_headers(request, call_next):
    """Blocage du sniffing MIME pour les fichiers téléversés.

    Les contenus médias sont validés à l'upload (magic bytes), donc seuls des
    JPEG/PNG/WebP/PDF arrivent sur le disque avec la bonne extension. Je pose
    nosniff pour qu'un navigateur n'interprète jamais le fichier sous un autre
    type. Je ne mets pas de CSP sandbox : elle rendrait les images illisibles.
    """
    response = await call_next(request)
    if request.url.path.startswith("/media"):
        response.headers["X-Content-Type-Options"] = "nosniff"
    return response


app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

app.include_router(public_router)
app.include_router(auth_router)
app.include_router(manager_router)
app.include_router(admin_router)
