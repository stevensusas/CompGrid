# control/urls.py
from django.urls import path
from .views import StartMachineView
from .views import StopMachineView

urlpatterns = [
    path('start-machine/', StartMachineView.as_view(), name='start_machine'),
    path('stop-machine/', StopMachineView.as_view(), name='stop_machine')
]
