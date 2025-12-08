from django.urls import path
from . import views

app_name = 'wishlists'

urlpatterns = [
    path('', views.index, name='index'),
    path('create/', views.create_wishlist, name='create'),
    path('profile/<str:username>/', views.user_profile, name='profile'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('wishlists/<int:wishlist_id>/', views.wishlist_detail, name='wishlist_detail'),
    path('auth/registration/', views.register, name='register'),
]
