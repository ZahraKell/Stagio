from django.apps import AppConfig # pyright: ignore[reportMissingModuleSource]

class ApplicationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "applications"

    def ready(self):
        import applications.signals  # noqa: F401