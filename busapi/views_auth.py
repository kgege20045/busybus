# api/views_auth.py

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout


@csrf_exempt
def signup(request):
    """회원가입"""
    if request.method != "POST":
        return JsonResponse({"error": "POST만 지원합니다."}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8"))
        username = body.get("username")
        password = body.get("password")

        if not username or not password:
            return JsonResponse({"error": "username과 password가 필요합니다."}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "이미 존재하는 아이디입니다."}, status=400)

        user = User.objects.create_user(username=username, password=password)

        return JsonResponse({"message": "회원가입 완료", "username": user.username}, status=201)

    except Exception as e:
        print("signup error:", e)
        return JsonResponse({"error": "서버 오류"}, status=500)


@csrf_exempt
def login_view(request):
    """로그인 (세션 생성)"""
    if request.method != "POST":
        return JsonResponse({"error": "POST만 지원합니다."}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8"))
        username = body.get("username")
        password = body.get("password")

        if not username or not password:
            return JsonResponse({"error": "username과 password가 필요합니다."}, status=400)

        user = authenticate(request, username=username, password=password)
        if user is None:
            return JsonResponse({"error": "아이디 또는 비밀번호가 올바르지 않습니다."}, status=400)

        # 세션 생성
        login(request, user)

        return JsonResponse(
            {"message": "로그인 성공", "username": user.username},
            status=200
        )

    except Exception as e:
        print("login error:", e)
        return JsonResponse({"error": "서버 오류"}, status=500)


@csrf_exempt
def logout_view(request):
    """로그아웃 (세션 삭제)"""
    if request.method != "POST":
        return JsonResponse({"error": "POST만 지원합니다."}, status=405)

    logout(request)
    return JsonResponse({"message": "로그아웃 완료"}, status=200)


def current_user(request):
    """현재 로그인된 사용자 정보 조회 (프론트가 앱 시작할 때 사용)"""
    if request.user.is_authenticated:
        return JsonResponse({
            "is_authenticated": True,
            "username": request.user.username
        })
    else:
        return JsonResponse({"is_authenticated": False})
