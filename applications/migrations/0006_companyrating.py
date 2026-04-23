from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0005_alter_application_status'),
    ]

    operations = [
        migrations.CreateModel(
            name='CompanyRating',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.IntegerField()),
                ('comment', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('application', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='rating',
                    to='applications.application',
                )),
            ],
        ),
    ]