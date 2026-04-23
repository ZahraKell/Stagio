from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('offers', '0003_internshipoffer_field_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='internshipoffer',
            name='deadline',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='internshipoffer',
            name='skills',
            field=models.TextField(blank=True, null=True),
        ),
    ]