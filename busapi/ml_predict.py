# ml_predict.py
##모델 사용하여 예측하는 코드
#입력 : routeid, select_time 형태

# busapi/ml_predict.py

from pathlib import Path
from typing import List, Dict

import joblib
import pandas as pd
from django.conf import settings

from .models import bus_arrival_past


def _load_model_payload(model_path: str = "bus_model.pkl"):
    model_abspath = Path(settings.BASE_DIR) / "busapi" / model_path
    payload = joblib.load(model_abspath)
    return payload


def _time_str_to_slot_center_min(t: str) -> int:
    """
    'HH:MM' -> slot_center_min 계산
    5:45~6:15 -> 6:00, 6:15~6:45 -> 6:30, ...
    """
    h, m = t.split(":")
    time_min = int(h) * 60 + int(m)

    start_min = 5 * 60 + 45  # 345
    end_min = 9 * 60 + 15    # 555

    if not (start_min <= time_min < end_min):
        raise ValueError("select_time은 06:00~09:00 사이여야 합니다.")

    slot_center_min = ((time_min - start_min) // 30) * 30 + start_min + 15
    return slot_center_min


def predict_remaining_seats(routeid: int, select_time: str) -> List[Dict]:
    """
    routeid, select_time("HH:MM") 기준으로
    해당 노선의 모든 station_num 에 대해 잔여좌석 예측값 반환.
    """
    payload = _load_model_payload()
    model = payload["model"]
    feature_cols = payload["feature_cols"]

    slot_center_min = _time_str_to_slot_center_min(select_time)

    # 이 노선에 존재하는 정류장 번호 목록
    stations_qs = (
        bus_arrival_past.objects.filter(routeid=routeid)
        .values_list("station_num", flat=True)
        .distinct()
        .order_by("station_num")
    )
    station_nums = list(stations_qs)
    if not station_nums:
        return []

    # 예측용 데이터프레임 생성
    rows = [
        {"routeid": routeid, "station_num": s, "slot_center_min": slot_center_min}
        for s in station_nums
    ]
    df_pred = pd.DataFrame(rows)
    X = df_pred[feature_cols]
    df_pred["y_pred"] = model.predict(X)

    results: List[Dict] = []
    for _, row in df_pred.iterrows():
        results.append(
            {
                "routeid": int(row["routeid"]),
                "station_num": int(row["station_num"]),
                "select_time": select_time,
                "remainseat_pred": float(row["y_pred"]),
            }
        )
    return results