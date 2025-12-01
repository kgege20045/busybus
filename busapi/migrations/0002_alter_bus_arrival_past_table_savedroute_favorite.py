# Generated migration file
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('busapi', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelTable(
            name='bus_arrival_past',
            table='bus_arrival_past_3302_with_synthetic',
        ),
        migrations.AlterModelTable(
            name='savedroute',
            table='saved_routes',
        ),
        migrations.AlterModelTable(
            name='favorite',
            table='favorites',
        ),
    ]
