from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response   import Response
from rest_framework            import status
from .models import Notification


# ── HELPERS ───────────────────────────────────────────────────────────────────
# Consistent response format used across all apps in this project.

def ok(data=None, message="OK"):
    return Response({"error": False, "message": message, "data": data})

def fail(message="Error", http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error": True, "message": message}, status=http_status)


# ── VIEW 1: GET ALL MY NOTIFICATIONS ──────────────────────────────────────────
# GET /api/notifications/
# Returns all notifications for the logged-in user, newest first.
# Optional filter: ?is_read=false  or  ?is_read=true
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_notifications(request):
    notifications = Notification.objects.filter(
        recipient=request.user
    ).order_by('-created_at')

    # Optional read/unread filter
    is_read_param = request.query_params.get('is_read')
    if is_read_param is not None:
        if is_read_param.lower() == 'true':
            notifications = notifications.filter(is_read=True)
        elif is_read_param.lower() == 'false':
            notifications = notifications.filter(is_read=False)

    data = [
        {
            'id':         n.pk,
            'message':    n.message,
            'is_read':    n.is_read,
            'created_at': n.created_at.isoformat(),
        }
        for n in notifications
    ]

    return ok(
        data={
            'total':         notifications.count(),
            'unread':        notifications.filter(is_read=False).count(),
            'notifications': data,
        },
        message="Notifications retrieved."
    )


# ── VIEW 2: COUNT UNREAD NOTIFICATIONS ────────────────────────────────────────
# GET /api/notifications/unread-count/
# Useful for showing a badge number on the frontend navbar.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).count()

    return ok(data={"unread_count": count}, message="Unread count retrieved.")


# ── VIEW 3: MARK ONE NOTIFICATION AS READ ─────────────────────────────────────
# PATCH /api/notifications/<pk>/read/
# User can only mark their OWN notifications — the query filters by recipient.
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_as_read(request, pk):
    try:
        notification = Notification.objects.get(pk=pk, recipient=request.user)
    except Notification.DoesNotExist:
        return fail("Notification not found.", status.HTTP_404_NOT_FOUND)

    notification.is_read = True
    notification.save(update_fields=['is_read'])   # only update this one column

    return ok(message="Notification marked as read.")


# ── VIEW 4: MARK ALL NOTIFICATIONS AS READ ────────────────────────────────────
# PATCH /api/notifications/read-all/
# .update() runs a single SQL UPDATE — much faster than looping and saving one by one.
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_all_as_read(request):
    updated_count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).update(is_read=True)

    return ok(message=f"{updated_count} notification(s) marked as read.")
