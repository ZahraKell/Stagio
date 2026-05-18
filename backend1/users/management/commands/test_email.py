from django.conf import settings
from django.core.management.base import BaseCommand

from users.email_utils import (
    _brevo_configured,
    _resend_configured,
    email_configured,
    get_from_email,
    send_transactional_email,
)


class Command(BaseCommand):
    help = 'Send a test email (Brevo/Resend on Railway, SMTP locally).'

    def add_arguments(self, parser):
        parser.add_argument('recipient', help='Email address to send the test to')

    def handle(self, *args, **options):
        recipient = options['recipient'].strip()

        if _brevo_configured():
            self.stdout.write('Provider: Brevo (HTTPS)')
            self.stdout.write(f'BREVO_SENDER_EMAIL={settings.BREVO_SENDER_EMAIL!r}')
        elif _resend_configured():
            self.stdout.write('Provider: Resend (HTTPS)')
            if 'onboarding@resend.dev' in (settings.DEFAULT_FROM_EMAIL or ''):
                self.stdout.write(self.style.WARNING(
                    'onboarding@resend.dev only delivers to your Resend account email. '
                    'Use Brevo (no domain) or verify a domain on Resend.'
                ))
        else:
            self.stdout.write('Provider: SMTP (local)')
            self.stdout.write(f'EMAIL_HOST={settings.EMAIL_HOST}:{settings.EMAIL_PORT}')
            self.stdout.write(f'EMAIL_HOST_USER={settings.EMAIL_HOST_USER!r}')

        self.stdout.write(f'From={get_from_email()!r}')

        if not email_configured():
            self.stderr.write(self.style.ERROR(
                'Railway (no domain): BREVO_API_KEY + BREVO_SENDER_EMAIL (verified in Brevo). '
                'Local: EMAIL_HOST_USER + EMAIL_HOST_PASSWORD.'
            ))
            return

        try:
            send_transactional_email(
                '[Stag.io] Email test',
                'If you receive this, email delivery is configured correctly.',
                [recipient],
            )
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f'Failed: {exc}'))
            raise

        self.stdout.write(self.style.SUCCESS(f'Test email sent to {recipient}'))
