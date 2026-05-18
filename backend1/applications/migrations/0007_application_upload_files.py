from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0006_application_attestation_file_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='uploaded_convention_file',
            field=models.FileField(blank=True, null=True, upload_to='conventions/student_uploads/'),
        ),
        migrations.AddField(
            model_name='application',
            name='student_attestation_upload',
            field=models.FileField(blank=True, null=True, upload_to='attestations/student_uploads/'),
        ),
    ]
