# Generated migration file
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='bus_arrival_past',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('routeid', models.IntegerField()),
                ('timestamp', models.IntegerField()),
                ('remainseatcnt1', models.IntegerField()),
                ('vehid1', models.IntegerField()),
                ('station_num', models.IntegerField()),
            ],
            options={
                'db_table': 'bus_arrival_past_3302_with_synthetic',
            },
        ),
        migrations.CreateModel(
            name='Favorite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(max_length=100)),
                ('type', models.CharField(choices=[('bus', 'bus'), ('stop', 'stop')], max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'favorites',
            },
        ),
        migrations.CreateModel(
            name='SavedRoute',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('from_location', models.CharField(max_length=200)),
                ('to_location', models.CharField(max_length=200)),
                ('detail', models.CharField(max_length=200)),
                ('type', models.CharField(choices=[('bus', 'bus'), ('stop', 'stop')], max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_routes', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'saved_routes',
            },
        ),
        migrations.AddConstraint(
            model_name='favorite',
            constraint=models.UniqueConstraint(fields=['user', 'label', 'type'], name='busapi_favorite_user_label_type_uniq'),
        ),
    ]
