from django.urls import path
from .views import UserRegistrationView, UserLoginView, UserProfileView, DeleteAccountView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('delete/', DeleteAccountView.as_view(), name='user-delete'),
]