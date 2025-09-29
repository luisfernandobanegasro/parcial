from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finanzas', '0002_finanzas_sql'),
    ]

    operations = [
        migrations.AddField(
            model_name='concepto',
            name='codigo',
            field=models.CharField(default='', max_length=30, blank=True),
        ),
        migrations.AddField(
            model_name='concepto',
            name='tipo',
            field=models.CharField(default='cuota', max_length=20, choices=[('cuota', 'cuota'), ('multa', 'multa'), ('extraordinario', 'extraordinario')]),
        ),
    ]
