"""
Send transactional email.

Railway blocks outbound SMTP — use HTTPS providers in production:
  1. Brevo (recommended without a custom domain — verify your Gmail as sender)
  2. Resend (requires a verified domain to email arbitrary recipients)
  3. Gmail SMTP (local development only)
"""
import logging

import requests
from django.conf import settings
from django.core.mail import get_connection, send_mail

logger = logging.getLogger(__name__)


def _brevo_configured() -> bool:
    return bool(
        getattr(settings, 'BREVO_API_KEY', '')
        and getattr(settings, 'BREVO_SENDER_EMAIL', '')
    )


def _resend_configured() -> bool:
    return bool(getattr(settings, 'RESEND_API_KEY', '') and settings.DEFAULT_FROM_EMAIL)


def email_configured() -> bool:
    if _brevo_configured():
        return True
    if _resend_configured():
        return True
    return bool(settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD)


def get_from_email() -> str:
    if _brevo_configured():
        name = getattr(settings, 'BREVO_SENDER_NAME', '') or 'Stag.io'
        return f'{name} <{settings.BREVO_SENDER_EMAIL}>'
    return settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER or 'webmaster@localhost'


def send_transactional_email(subject: str, message: str, recipient_list: list[str]) -> None:
    recipients = [r.strip() for r in recipient_list if r and str(r).strip()]
    if not recipients:
        raise ValueError('No recipients provided.')

    if _brevo_configured():
        _send_via_brevo(subject, message, recipients)
        return
    if _resend_configured():
        _send_via_resend(settings.RESEND_API_KEY, subject, message, recipients)
        return
    _send_via_smtp(subject, message, recipients)


def _send_via_brevo(subject: str, message: str, recipients: list[str]) -> None:
    api_key = settings.BREVO_API_KEY
    sender_email = settings.BREVO_SENDER_EMAIL
    sender_name = getattr(settings, 'BREVO_SENDER_NAME', '') or 'Stag.io'

    response = requests.post(
        'https://api.brevo.com/v3/smtp/email',
        headers={
            'accept': 'application/json',
            'api-key': api_key,
            'content-type': 'application/json',
        },
        json={
            'sender': {'name': sender_name, 'email': sender_email},
            'to': [{'email': email} for email in recipients],
            'subject': subject,
            'textContent': message,
        },
        timeout=20,
    )
    if response.status_code >= 400:
        hint = _brevo_error_hint(response)
        logger.error('Brevo API %s to %s: %s', response.status_code, recipients, hint)
        raise RuntimeError(hint)


def _brevo_error_hint(response: requests.Response) -> str:
    try:
        body = response.json()
        message = body.get('message') or body.get('error') or str(body)
    except ValueError:
        message = response.text
    if response.status_code in (401, 403):
        return (
            f'Brevo auth/sender error: {message}. '
            'Verify BREVO_API_KEY and confirm the sender at '
            'https://app.brevo.com/senders (click the confirmation email).'
        )
    return f'Brevo API error {response.status_code}: {message}'


def _resend_error_hint(response: requests.Response) -> str:
    try:
        body = response.json()
        message = (body.get('message') or body.get('error') or '').lower()
    except ValueError:
        message = (response.text or '').lower()

    if 'only send testing emails to your own' in message or 'verify a domain' in message:
        return (
            'Resend test sender (onboarding@resend.dev) can only email your Resend account. '
            'Use Brevo instead (no domain): set BREVO_API_KEY + BREVO_SENDER_EMAIL on Railway, '
            'or verify a domain at https://resend.com/domains.'
        )
    if response.status_code == 403:
        return 'Resend rejected the request (403). Check API key and domain verification.'
    if response.status_code == 422:
        return 'Resend rejected the recipient or from address (422).'
    return f'Resend API error {response.status_code}: {response.text[:300]}'


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
        hint = _resend_error_hint(response)
        logger.error('Resend API %s to %s: %s', response.status_code, recipients, hint)
        raise RuntimeError(hint)


def _send_via_smtp(subject: str, message: str, recipients: list[str]) -> None:
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        raise RuntimeError(
            'SMTP not configured. For Railway use BREVO_API_KEY + BREVO_SENDER_EMAIL, '
            'or RESEND_API_KEY with a verified domain.'
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
