# ml_predict.py

from pathlib import Path
from typing import List, Dict

import joblib
import pandas as pd

from django.conf import settings
from .models import bus_arrival_past


def _load_model_payload(model_path: str = "bus_model.pkl"):
    """모델 파일 로드"""
    model_abspath = Path(settings.BASE_DIR) / "busapi" / model_path
    payload = joblib.load(model_abspath)
    return payload


def _slot_index_to_center_min(slot_index: int) -> int:
    """
    slot_index(0~6)를 slot_center_min(분 단위)로 변환
    0 → 06:00 → 360
    1 → 06:30 → 390
    ...
    6 → 09:00
    """
    if not 0 <= slot_index <= 6:
        raise ValueError("slot_index는 0~6이어야 합니다.")

    start_min = 5 * 60 + 45  # 05:45 (345)
    slot_center_min = start_min + (slot_index * 30) + 15
    return slot_center_min


def predict_remaining_seats(routeid: str, slot_index: int) -> List[Dict]:
    """
    문자열 routeid + slot_index 기반 잔여좌석 예측
    """
    # 1) 모델 로드
    payload = _load_model_payload()
    model = payload["model"]
    feature_cols = payload["feature_cols"]

    # 2) 슬롯 index → slot_center_min
    slot_center_min = _slot_index_to_center_min(slot_index)

    # 3) DB에서 해당 routeid의 모든 station_num 가져옴
    station_nums = list(
        bus_arrival_past.objects.filter(routeid=str(routeid))
        .values_list("station_num", flat=True)
        .distinct()
        .order_by("station_num")
    )

    if not station_nums:
        return []

    # 4) 예측용 데이터프레임 만들기
    rows = [
        {
            "routeid": int(routeid),          # 모델 특성용
            "station_num": s,
            "slot_center_min": slot_center_min,
        }
        for s in station_nums
    ]

    df_pred = pd.DataFrame(rows)
    X = df_pred[feature_cols]
    
    print(X) #디버깅 용
    # 5) 모델 예측
    df_pred["y_pred"] = model.predict(X)

    # 6) 응답 형태 구성
    results: List[Dict] = []
    for _, row in df_pred.iterrows():
        results.append(
            {
                "routeid": str(row["routeid"]),          # 문자열 유지
                "station_num": int(row["station_num"]),
                "slot_index": slot_index,
                "remainseat_pred": float(row["y_pred"]),
            }
        )

    return results
