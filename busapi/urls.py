from django.urls import path
from .views import run_training, predict_seat
from .views_auth import signup, login_view, logout_view, current_user

urlpatterns = [
    path('auth/signup/', signup),
    path('auth/login/', login_view),
    path('auth/logout/', logout_view),
    path('auth/me/', current_user),


    path('predict-seat/', predict_seat, name='predict_seat'),
    path('train/', run_training, name='run_training' ),

]
