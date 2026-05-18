from django.conf import settings
from django.core.management.base import BaseCommand

from users.email_utils import email_configured, get_from_email, send_transactional_email


class Command(BaseCommand):
    help = 'Send a test email (Resend on Railway, SMTP locally).'

    def add_arguments(self, parser):
        parser.add_argument('recipient', help='Email address to send the test to')

    def handle(self, *args, **options):
        recipient = options['recipient'].strip()

        if getattr(settings, 'RESEND_API_KEY', ''):
            self.stdout.write('Provider: Resend (HTTPS)')
            self.stdout.write(f'RESEND_API_KEY set=True')
        else:
            self.stdout.write('Provider: SMTP')
            self.stdout.write(f'EMAIL_HOST={settings.EMAIL_HOST}:{settings.EMAIL_PORT}')
            self.stdout.write(f'EMAIL_HOST_USER={settings.EMAIL_HOST_USER!r}')
            self.stdout.write(f'EMAIL_HOST_PASSWORD set={bool(settings.EMAIL_HOST_PASSWORD)}')

        self.stdout.write(f'DEFAULT_FROM_EMAIL={get_from_email()!r}')

        if not email_configured():
            self.stderr.write(self.style.ERROR(
                'Email not configured. Railway: set RESEND_API_KEY and '
                'DEFAULT_FROM_EMAIL=Stag.io <onboarding@resend.dev>. '
                'Local: set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD.'
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
            if not getattr(settings, 'RESEND_API_KEY', ''):
                self.stderr.write(
                    'Gmail SMTP does not work on Railway. Create a free Resend account '
                    '(https://resend.com), add RESEND_API_KEY to Railway variables.'
                )
            raise

        self.stdout.write(self.style.SUCCESS(f'Test email sent to {recipient}'))
