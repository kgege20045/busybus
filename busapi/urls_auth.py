# api/urls_auth.py

from django.urls import path
from .views_auth import signup, login_view, logout_view, current_user

urlpatterns = [
    path('signup/', signup),
    path('login/', login_view),
    path('logout/', logout_view),
    path('me/', current_user),
]
