from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('wishlists/<int:wishlist_id>/', views.wishlist_detail, name='wishlist_detail'),
]
