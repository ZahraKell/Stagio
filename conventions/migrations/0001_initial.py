from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('applications', '0005_alter_application_status'),
        ('users', '0002_company_company_name_company_company_sector_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Convention',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(
                    choices=[
                        ('DRAFT', 'Draft'),
                        ('PENDING_STUDENT', 'Pending Student Signature'),
                        ('PENDING_COMPANY', 'Pending Company Signature'),
                        ('PENDING_ADMIN', 'Pending Admin Validation'),
                        ('VALIDATED', 'Validated'),
                        ('REJECTED', 'Rejected'),
                    ],
                    default='DRAFT',
                    max_length=20,
                )),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('student_signed_at', models.DateTimeField(blank=True, null=True)),
                ('company_signed_at', models.DateTimeField(blank=True, null=True)),
                ('admin_signed_at', models.DateTimeField(blank=True, null=True)),
                ('pdf_file', models.FileField(blank=True, null=True, upload_to='conventions/pdfs/')),
                ('agreement_date', models.DateField(blank=True, null=True)),
                ('student_agreement', models.BooleanField(default=False)),
                ('company_agreement', models.BooleanField(default=False)),
                ('validation_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('application', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='conventions',
                    to='applications.application',
                )),
                ('administration', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='conventions',
                    to='users.administration',
                )),
            ],
        ),
    ]