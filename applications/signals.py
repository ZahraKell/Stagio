from django.db.models.signals import post_save
from django.dispatch          import receiver
from .models import Application


@receiver(post_save, sender=Application)
def create_convention_on_accept(sender, instance, created, **kwargs):
    """
    Automatically creates a Convention when an application is accepted.
    The convention starts in PENDING_STUDENT status — waiting for student signature.
    """
    if created:
        return   # only act on status changes, not new applications
    if instance.status != Application.Status.ACCEPTED:
        return
    from conventions.models import Convention
    # Prevent creating a duplicate if signal fires more than once
    if Convention.objects.filter(application=instance).exists():
        return
    Convention.objects.create(
        application=instance,
        status=Convention.Status.PENDING_STUDENT,
    )