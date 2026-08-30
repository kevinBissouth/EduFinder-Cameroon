# Géocodage one-shot : transforme « adresse + ville, Cameroun » en
# coordonnées via Nominatim (OpenStreetMap, gratuit, sans clé) et stocke le
# résultat sur chaque établissement publié qui n'en a pas encore.
# Idempotent : relancer ne retraite que les lignes sans coordonnées.
# Exécution : python -m app.db.geocode  (depuis backend/)
import time

import httpx
from sqlmodel import Session, select

from app.db.session import engine
from app.models.establishment import Establishment

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

HEADERS = {"User-Agent": "EduFinderCameroon/1.0 (school directory demo)"}
DELAY_SECONDS = 1.1 


def geocode_missing_coordinates() -> None:
    with Session(engine) as session:
        establishments = session.exec(
            select(Establishment).where(Establishment.status == "published")
        ).all()

        targets = [e for e in establishments if e.latitude is None or e.longitude is None]
        print(f"{len(targets)} établissement(s) à géocoder.")

        with httpx.Client(headers=HEADERS, timeout=15) as client:
            for establishment in targets:
                city_name = establishment.city.name if establishment.city else ""
                query_parts = [
                    part
                    for part in (establishment.address, city_name, "Cameroun")
                    if part
                ]
                query = ", ".join(query_parts)

                response = client.get(
                    NOMINATIM_URL,
                    params={"q": query, "format": "json", "limit": 1},
                )
                results = response.json()

                if results:
                    best = results[0]
                    establishment.latitude = float(best["lat"])
                    establishment.longitude = float(best["lon"])
                    session.add(establishment)
                    print(f"  OK  {establishment.name} -> {best['lat']}, {best['lon']}")
                else:
                    print(f"  ??  {establishment.name} -> introuvable ({query})")

               
                time.sleep(DELAY_SECONDS)

        session.commit()
    print("Géocodage terminé.")


if __name__ == "__main__":
    geocode_missing_coordinates()
