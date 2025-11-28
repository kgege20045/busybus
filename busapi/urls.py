from django.urls import path
from .views import run_training, predict_seat


urlpatterns = [
    path('predict-seat/', predict_seat, name='predict_seat'),
    path('train/', run_training, name='run_training' ),

]

