from django.db import models
from django.contrib.auth.models import User

##DB 연결
class bus_arrival_past(models.Model):
    routeid = models.CharField(max_length=20)
    timestamp = models.IntegerField()
    remainseatcnt1 = models.IntegerField()
    vehid1 = models.IntegerField()
    station_num = models.IntegerField()

    class Meta:
        db_table = "bus_arrival_past_3302_with_synthetic"


class Favorite(models.Model):
    """
    사용자별 즐겨찾기 모델
    - 버스 번호나 정류장을 즐겨찾기로 저장
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    label = models.CharField(max_length=100)  # 버스 번호 또는 정류장 이름
    type = models.CharField(max_length=10, choices=[('bus', 'bus'), ('stop', 'stop')])  # 'bus' 또는 'stop'
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "favorites"
        unique_together = ['user', 'label', 'type']  # 같은 사용자가 같은 항목을 중복 저장하지 않도록

    def __str__(self):
        return f"{self.user.username} - {self.label} ({self.type})"


class SavedRoute(models.Model):
    """
    사용자별 저장된 경로 모델
    - 출발지, 도착지, 상세 정보를 저장
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_routes')
    from_location = models.CharField(max_length=200)  # 출발지
    to_location = models.CharField(max_length=200)  # 도착지
    detail = models.CharField(max_length=200)  # 상세 정보 (버스 번호 등)
    type = models.CharField(max_length=10, choices=[('bus', 'bus'), ('stop', 'stop')])  # 'bus' 또는 'stop'
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "saved_routes"

    def __str__(self):
        return f"{self.user.username} - {self.from_location} → {self.to_location}"
