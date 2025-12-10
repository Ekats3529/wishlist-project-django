from django.urls import path
from . import views

app_name = 'wishlists'

urlpatterns = [
    path('', views.index, name='index'),
    path('create/', views.create_wishlist, name='create'),
    path('profile/<str:username>/', views.user_profile, name='profile'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('wishlists/<int:wishlist_id>/', views.wishlist_detail, name='wishlist_detail'),
    path('wishlists/<int:wishlist_id>/edit/', views.edit_wishlist, name='edit_wishlist'),
    path('wishlists/<int:wishlist_id>/add_item/', views.add_item, name='add_item'),
    path('wishlists/item/<int:item_id>/edit/', views.edit_item, name='edit_item'),
    path('wishlists/item/<int:item_id>/delete/', views.delete_item, name='delete_item'),
    path('auth/registration/', views.register, name='register'),

    path('wishlists/item/<int:item_id>/recommendations/', views.item_recommendations, name='item_recommendations'),

]
