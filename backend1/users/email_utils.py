"""
Send transactional email.

Railway blocks outbound SMTP (ports 587/465) — use Resend (HTTP) in production.
Local dev can keep Gmail SMTP when RESEND_API_KEY is empty.
"""
import logging

import requests
from django.conf import settings
from django.core.mail import get_connection, send_mail

logger = logging.getLogger(__name__)


def email_configured() -> bool:
    if getattr(settings, 'RESEND_API_KEY', ''):
        return bool(settings.DEFAULT_FROM_EMAIL)
    return bool(settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD)


def get_from_email() -> str:
    return settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER or 'webmaster@localhost'


def send_transactional_email(subject: str, message: str, recipient_list: list[str]) -> None:
    recipients = [r.strip() for r in recipient_list if r and str(r).strip()]
    if not recipients:
        raise ValueError('No recipients provided.')

    api_key = getattr(settings, 'RESEND_API_KEY', '') or ''
    if api_key:
        _send_via_resend(api_key, subject, message, recipients)
        return
    _send_via_smtp(subject, message, recipients)


def _send_via_resend(api_key: str, subject: str, message: str, recipients: list[str]) -> None:
    response = requests.post(
        'https://api.resend.com/emails',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        json={
            'from': get_from_email(),
            'to': recipients,
            'subject': subject,
            'text': message,
        },
        timeout=20,
    )
    if response.status_code >= 400:
        logger.error('Resend API %s: %s', response.status_code, response.text)
        response.raise_for_status()


def _send_via_smtp(subject: str, message: str, recipients: list[str]) -> None:
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        raise RuntimeError(
            'SMTP not configured. Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD, '
            'or set RESEND_API_KEY for production (Railway).'
        )
    connection = get_connection(
        fail_silently=False,
        timeout=getattr(settings, 'EMAIL_TIMEOUT', 15),
    )
    send_mail(
        subject,
        message,
        get_from_email(),
        recipients,
        fail_silently=False,
        connection=connection,
    )
