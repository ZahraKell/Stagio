from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Application


@receiver(post_save, sender=Application)
def create_convention_on_accept(sender, instance, created, **kwargs):
    if created:
        return
    if instance.status != Application.Status.ACCEPTED:
        return

    from conventions.models import Convention
    from notifications.models import Notification

    try:
        _ = instance.convention
        return  # already exists, do nothing
    except Exception:
        pass  # doesn't exist yet, continue

    Convention.objects.create(
        application=instance,
        status=Convention.Status.PENDING_STUDENT,
    )
    Notification.objects.create(
        recipient=instance.student.user,
        message=f"Your application for '{instance.offer.title}' was accepted. Please sign your convention.",
    )