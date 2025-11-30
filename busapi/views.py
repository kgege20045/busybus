from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
import pandas as pd
from .models import bus_arrival_past

# ML 관련 함수는 선택적으로 import (파일이 없을 수 있음)
try:
    from .ml_train import train_model_and_save
except ImportError:
    train_model_and_save = None

try:
    from .ml_predict import predict_remaining_seats
except ImportError:
    def predict_remaining_seats(routeid_int, select_time_int):
        return []


def train_from_db():
    # db(bus_arrival_past)에서 훈련 데이터를 가져와 학습함수에 전달
    qs = bus_arrival_past.objects.all()
    df = pd.DataFrame(list(qs.values()))
    # train_model_and_save(df)


def run_training(request):
    train_from_db()
    return JsonResponse({"ok": True, "message": "Model training completed"})


def predict_seat(request):
    routeid = request.GET.get("routeid")
    select_time = request.GET.get("select_time")

    if not routeid or not select_time:
        return JsonResponse(
            {"ok": False, "error": "routeid, select_time 파라미터가 필요합니다."},
            status=400,
        )

    try:
        routeid_int = int(routeid)
        select_time_int = int(select_time)
    except ValueError:
        return JsonResponse(
            {"ok": False, "error": "routeid와 select_time은 정수여야 합니다."},
            status=400,
        )

    try:
        predications = predict_remaining_seats(routeid_int, select_time_int)
    except Exception as e:
        return JsonResponse(
            {"ok": False, "error": f"prediction error: {e}"},
            status=500,
        )

    return JsonResponse(
        {
            "ok": True,
            "routeid": routeid_int,
            "select_time": select_time_int,
            "predications": predications,
        },
        status=200,
    )


@csrf_exempt
@require_GET
def bus_realtime(request):
    """
    버스 노선별 실시간 데이터 조회
    - 쿼리 파라미터: routeid, service_date, time_slot
    - 반환: 해당 노선의 모든 정류장별 실시간 데이터 배열
    """
    routeid = request.GET.get('routeid')
    service_date = request.GET.get('service_date')
    time_slot = request.GET.get('time_slot')

    if not routeid or not service_date or not time_slot:
        return JsonResponse(
            {"error": "routeid, service_date, time_slot 파라미터가 필요합니다."},
            status=400,
        )

    try:
        # TODO: 실제 실시간 데이터 소스에서 데이터를 가져와야 합니다.
        # 현재는 빈 배열을 반환합니다. 실제 데이터베이스나 외부 API와 연동 필요
        # 예시: bus_arrival_past 모델에서 최근 데이터를 조회하거나 외부 API 호출

        # 임시로 빈 배열 반환 (프론트엔드가 에러 없이 동작하도록)
        data = []

        return JsonResponse(data, status=200, safe=False)
    except Exception as e:
        return JsonResponse(
            {"error": f"서버 오류: {str(e)}"},
            status=500,
        )


@csrf_exempt
@require_GET
def station_realtime(request):
    """
    정류장별 실시간 데이터 조회
    - 쿼리 파라미터: stationid, service_date, time_slot
    - 반환: 해당 정류장을 지나가는 모든 버스의 실시간 데이터 배열
    """
    stationid = request.GET.get('stationid')
    service_date = request.GET.get('service_date')
    time_slot = request.GET.get('time_slot')

    if not stationid or not service_date or not time_slot:
        return JsonResponse(
            {"error": "stationid, service_date, time_slot 파라미터가 필요합니다."},
            status=400,
        )

    try:
        # TODO: 실제 실시간 데이터 소스에서 데이터를 가져와야 합니다.
        # 현재는 빈 배열을 반환합니다. 실제 데이터베이스나 외부 API와 연동 필요
        # 예시: bus_arrival_past 모델에서 해당 정류장의 최근 데이터를 조회하거나 외부 API 호출

        # 임시로 빈 배열 반환 (프론트엔드가 에러 없이 동작하도록)
        data = []

        return JsonResponse(data, status=200, safe=False)
    except Exception as e:
        return JsonResponse(
            {"error": f"서버 오류: {str(e)}"},
            status=500,
        )