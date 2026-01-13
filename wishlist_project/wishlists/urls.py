from django.urls import path
from . import views

app_name = 'wishlists'

urlpatterns = [
    path('', views.index, name='index'),
    path('create/', views.create_wishlist, name='create'),
    
    # Импорт нового вишлиста
    path('import/', views.import_wishlist, name='import_wishlist'),
    
    path('profile/<str:username>/', views.user_profile, name='profile'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    
    path('<int:wishlist_id>/', views.wishlist_detail, name='wishlist_detail'),
    path('<int:wishlist_id>/edit/', views.edit_wishlist, name='edit_wishlist'),
    path('<int:wishlist_id>/delete/', views.delete_wishlist, name='delete_wishlist'),
    path('<int:wishlist_id>/add_item/', views.add_item, name='add_item'),
    
    # Экспорт вишлиста
    path('<int:wishlist_id>/export/', views.export_wishlist, name='export_wishlist'),
    
    # Импорт в существующий вишлист
    path('<int:wishlist_id>/import/', views.import_to_existing_wishlist, name='import_to_existing_wishlist'),

    path('<int:wishlist_id>/add_recommendation/', views.add_recommendation, name='add_recommendation'),
    
    path('item/<int:item_id>/edit/', views.edit_item, name='edit_item'),
    path('item/<int:item_id>/delete/', views.delete_item, name='delete_item'),
    
    path('auth/registration/', views.register, name='register'),
   
    path(
        '<int:wishlist_id>/recommendations/',
        views.wishlist_recommendations,
        name='wishlist_recommendations'
    ),
]