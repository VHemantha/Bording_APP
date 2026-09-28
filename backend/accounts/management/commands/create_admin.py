from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Creates (or promotes) a staff/superuser account for the admin dashboard, non-interactively.'

    def add_arguments(self, parser):
        parser.add_argument('--username', required=True)
        parser.add_argument('--email', default='')
        parser.add_argument('--password', required=True)

    def handle(self, *args, **options):
        username = options['username']
        user, created = User.objects.get_or_create(username=username, defaults={'email': options['email']})
        user.email = options['email'] or user.email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(options['password'])
        user.save()

        verb = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(f'{verb} admin user "{username}".'))
