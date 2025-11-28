from django.db import models
##DB 연결
class bus_arrival_past(models.Model):
    routeid = models.IntegerField()
    timestamp = models.IntegerField()
    remainseatcnt1 = models.IntegerField()
    vehid1 = models.IntegerField()
    station_num = models.IntegerField()

    class Meta:
        db_table = "bus_arrival_past"

