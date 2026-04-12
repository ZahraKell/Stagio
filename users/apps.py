from django.apps import AppConfig # pyright: ignore[reportMissingModuleSource]

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'