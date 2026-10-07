from rest_framework import serializers

EMAIL_MAX_LENGTH = 255


# Le champ s'appelle « username » parce que le frontend envoie le formulaire
# de connexion sous cette forme ; « source » lui rend son vrai nom.
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(source="email", max_length=EMAIL_MAX_LENGTH)
    # Un mot de passe peut commencer ou finir par un espace : je ne le rogne pas.
    password = serializers.CharField(trim_whitespace=False)


# Profil du compte connecté. Le hash du mot de passe n'y figure pas et ne doit
# jamais y figurer.
class AuthenticatedUserSerializer(serializers.Serializer):
    id_user = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.CharField()
    role = serializers.CharField()
