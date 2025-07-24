from django.contrib import admin
from django.urls import path
from .views import *

urlpatterns = [
    path('',view=Login_view, name="login"),
    path('register/', view = Register_view, name="register"),
    path("logout/",view=Logout_view,name="logout")
]