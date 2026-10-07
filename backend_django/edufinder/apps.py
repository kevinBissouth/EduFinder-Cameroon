from django.apps import AppConfig


class EdufinderConfig(AppConfig):
    name = "edufinder"

    def ready(self) -> None:
        from edufinder.sqlite_text import install_on_new_connections

        install_on_new_connections()
