from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Send a test email using current EMAIL_* settings (run on Railway to debug SMTP).'

    def add_arguments(self, parser):
        parser.add_argument('recipient', help='Email address to send the test to')

    def handle(self, *args, **options):
        recipient = options['recipient'].strip()
        user = settings.EMAIL_HOST_USER
        password_set = bool(settings.EMAIL_HOST_PASSWORD)
        from_email = user or settings.DEFAULT_FROM_EMAIL

        self.stdout.write(f'EMAIL_HOST={settings.EMAIL_HOST}:{settings.EMAIL_PORT}')
        self.stdout.write(f'EMAIL_HOST_USER={user!r}')
        self.stdout.write(f'EMAIL_HOST_PASSWORD set={password_set}')
        self.stdout.write(f'From={from_email!r}')

        if not user or not password_set:
            self.stderr.write(self.style.ERROR(
                'Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD on Railway first.'
            ))
            return

        try:
            send_mail(
                '[Stag.io] SMTP test',
                'If you receive this, email delivery is configured correctly.',
                from_email,
                [recipient],
                fail_silently=False,
            )
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f'SMTP failed: {exc}'))
            self.stderr.write(
                'Gmail: enable 2FA, create an App Password at '
                'https://myaccount.google.com/apppasswords, set EMAIL_HOST_PASSWORD '
                '(16 chars, no spaces required).'
            )
            raise
        self.stdout.write(self.style.SUCCESS(f'Test email sent to {recipient}'))
