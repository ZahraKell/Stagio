from django.apps import AppConfig # pyright: ignore[reportMissingModuleSource]

class ApplicationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.applications"

    def ready(self):
        """
        Called once when Django finishes loading.
        Importing signals.py here connects all @receiver decorators.
        """
        import apps.applications.signals  # noqa: F401