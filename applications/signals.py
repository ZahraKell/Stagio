from django.db.models.signals import post_save # type: ignore
from django.dispatch          import receiver # type: ignore
from .models import Application

@receiver(post_save, sender=Application)
def create_convention_on_accept(sender, instance, created, **kwargs):
 # Only act on updates (not on initial creation)
    if created:
        return
    # Only act when status is ACCEPTED
    if instance.status != Application.Status.ACCEPTED:
        return
    # Import here to avoid circular imports
    # (Convention is in a separate app that imports Application)
    from conventions.models import Convention # type: ignore
    # Check if a convention already exists for this application
    # (hasattr check works because of the OneToOneField related_name="convention")
    if hasattr(instance, "convention"):
        return   # Already created — do nothing
    # Create the convention in DRAFT state
    Convention.objects.create(
        application=instance,
        status=Convention.Status.PENDING_STUDENT,  # First step: awaiting student signature
    )