# api/views_user_data.py

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Favorite, SavedRoute


@csrf_exempt
@require_http_methods(["GET", "POST"])
def favorites(request):
    """
    즐겨찾기 조회 및 추가
    - GET: 현재 사용자의 즐겨찾기 목록 조회
    - POST: 즐겨찾기 추가
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "로그인이 필요합니다."}, status=401)

    if request.method == "GET":
        # 즐겨찾기 목록 조회
        favorites_list = Favorite.objects.filter(user=request.user).order_by('-created_at')
        data = [
            {
                "id": fav.id,
                "label": fav.label,
                "type": fav.type,
            }
            for fav in favorites_list
        ]
        return JsonResponse(data, safe=False, status=200)

    elif request.method == "POST":
        # 즐겨찾기 추가
        try:
            body = json.loads(request.body.decode("utf-8"))
            label = body.get("label")
            type_value = body.get("type")

            if not label or not type_value:
                return JsonResponse({"error": "label과 type이 필요합니다."}, status=400)

            if type_value not in ['bus', 'stop']:
                return JsonResponse({"error": "type은 'bus' 또는 'stop'이어야 합니다."}, status=400)

            # 중복 체크
            existing = Favorite.objects.filter(user=request.user, label=label, type=type_value).first()
            if existing:
                return JsonResponse({
                    "id": existing.id,
                    "label": existing.label,
                    "type": existing.type,
                }, status=200)

            # 새로 생성
            favorite = Favorite.objects.create(
                user=request.user,
                label=label,
                type=type_value
            )

            return JsonResponse({
                "id": favorite.id,
                "label": favorite.label,
                "type": favorite.type,
            }, status=201)

        except Exception as e:
            print("favorites POST error:", e)
            return JsonResponse({"error": "서버 오류"}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def favorite_detail(request, favorite_id):
    """
    즐겨찾기 삭제
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "로그인이 필요합니다."}, status=401)

    try:
        favorite = Favorite.objects.get(id=favorite_id, user=request.user)
        favorite.delete()
        return JsonResponse({"message": "삭제 완료"}, status=200)
    except Favorite.DoesNotExist:
        return JsonResponse({"error": "즐겨찾기를 찾을 수 없습니다."}, status=404)
    except Exception as e:
        print("favorite_detail DELETE error:", e)
        return JsonResponse({"error": "서버 오류"}, status=500)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def saved_routes(request):
    """
    저장된 경로 조회 및 추가
    - GET: 현재 사용자의 저장된 경로 목록 조회
    - POST: 저장된 경로 추가
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "로그인이 필요합니다."}, status=401)

    if request.method == "GET":
        # 저장된 경로 목록 조회
        routes_list = SavedRoute.objects.filter(user=request.user).order_by('-created_at')
        data = [
            {
                "id": route.id,
                "from": route.from_location,
                "to": route.to_location,
                "detail": route.detail,
                "type": route.type,
            }
            for route in routes_list
        ]
        return JsonResponse(data, safe=False, status=200)

    elif request.method == "POST":
        # 저장된 경로 추가
        try:
            body = json.loads(request.body.decode("utf-8"))
            from_location = body.get("from")
            to_location = body.get("to")
            detail = body.get("detail", "")
            type_value = body.get("type", "bus")

            if not from_location or not to_location:
                return JsonResponse({"error": "from과 to가 필요합니다."}, status=400)

            if type_value not in ['bus', 'stop']:
                return JsonResponse({"error": "type은 'bus' 또는 'stop'이어야 합니다."}, status=400)

            # 중복 체크
            existing = SavedRoute.objects.filter(
                user=request.user,
                from_location=from_location,
                to_location=to_location,
                detail=detail,
                type=type_value
            ).first()
            if existing:
                return JsonResponse({
                    "id": existing.id,
                    "from": existing.from_location,
                    "to": existing.to_location,
                    "detail": existing.detail,
                    "type": existing.type,
                }, status=200)

            # 새로 생성
            route = SavedRoute.objects.create(
                user=request.user,
                from_location=from_location,
                to_location=to_location,
                detail=detail,
                type=type_value
            )

            return JsonResponse({
                "id": route.id,
                "from": route.from_location,
                "to": route.to_location,
                "detail": route.detail,
                "type": route.type,
            }, status=201)

        except Exception as e:
            print("saved_routes POST error:", e)
            return JsonResponse({"error": "서버 오류"}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def saved_route_detail(request, route_id):
    """
    저장된 경로 삭제
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "로그인이 필요합니다."}, status=401)

    try:
        route = SavedRoute.objects.get(id=route_id, user=request.user)
        route.delete()
        return JsonResponse({"message": "삭제 완료"}, status=200)
    except SavedRoute.DoesNotExist:
        return JsonResponse({"error": "저장된 경로를 찾을 수 없습니다."}, status=404)
    except Exception as e:
        print("saved_route_detail DELETE error:", e)
        return JsonResponse({"error": "서버 오류"}, status=500)
