from django.shortcuts import render
from django.http import JsonResponse
import pandas as pd
from .models import bus_arrival_past
from .ml_train import train_model_and_save

def train_from_db():
    # db(bus_arrival_past)에서 훈련 데이터를 가져와 학습함수에 전달
    qs = bus_arrival_past.objects.all()
    df = pd.DataFrame(list(qs.values()))
    #train_model_and_save(df)

def run_training(request):
    train_from_db()
    return JsonResponse({"ok": True, "message": "Model training completed"})

def predict_seat(request):
    # 1) 프론트에서 보내줄 쿼리 파라미터 받기
    routeId = request.GET.get('routeId')
    time = request.GET.get('time')

    # 2) 간단한 유효성 검사 (없으면 에러 반환)
    if not routeId or not time:
        return JsonResponse(
            {"ok": False, "error": "route, stationId, time 파라미터가 필요합니다."},
            status=400,
        )

    # TODO: 나중에 여기서 DB 조회 + XGBoost 예측 넣기
    # 지금은 일단 가짜 숫자
    predicted = 5

    data = {
        "ok": True,
        "route": routeId,
        "stationId": int(stationId),
        "time": time,
        "predicted_remaining_seats": predicted,
    }
    return JsonResponse(data)