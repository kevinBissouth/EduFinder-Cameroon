from rest_framework.throttling import AnonRateThrottle


# Limite les tentatives de connexion par adresse, pour freiner la recherche de
# mots de passe par essais successifs. Le débit est réglé dans
# REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["login"].
class LoginRateThrottle(AnonRateThrottle):
    scope = "login"
