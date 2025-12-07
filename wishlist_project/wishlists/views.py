from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView
from .models import Wishlist
from .forms import WishlistForm
from django.urls import reverse_lazy

# Пример данных для тестирования

wishlists = [
    {
        "id": 1,
        "title": "День рождения Екатерины",
        "description": "Все, что я хочу на день рождения",
        "owner": "ekate",
        "is_public": True,
        "items": [
            {
                "title": "Samsung Galaxy Watch",
                "description": "Умные часы с новыми функциями",
                "price": 500,
                "link": "https://example.com/samsung-watch",
                "image_url": "https://example.com/images/samsung-watch.jpg",
                "is_reserved": False
            },
            {
                "title": "Книга 'Python для начинающих'",
                "description": "Очень интересная книга по Python",
                "price": 25,
                "link": "https://example.com/python-book",
                "image_url": "https://example.com/images/python-book.jpg",
                "is_reserved": True
            }
        ]
    },
    {
        "id": 2,
        "title": "Новогодние подарки",
        "description": "Всё, что хочется на Новый год",
        "owner": "alex",
        "is_public": False,
        "items": [
            {
                "title": "Наушники Bose",
                "description": "Шумоподавляющие наушники",
                "price": 300,
                "link": "https://example.com/bose-headphones",
                "image_url": "https://example.com/images/bose-headphones.jpg",
                "is_reserved": False
            },
            {
                "title": "Настольная игра 'Каркассон'",
                "description": "Игра для весёлых вечеров",
                "price": 40,
                "link": "https://example.com/carcassonne",
                "image_url": "https://example.com/images/carcassonne.jpg",
                "is_reserved": False
            }
        ]
    },
    {
        "id": 3,
        "title": "Список желаний на отпуск",
        "description": "Все нужные вещи для поездки",
        "owner": "maria",
        "is_public": True,
        "items": [
            {
                "title": "Портативный аккумулятор",
                "description": "Чтобы телефон не разрядился в дороге",
                "price": 35,
                "link": "https://example.com/powerbank",
                "image_url": "https://example.com/images/powerbank.jpg",
                "is_reserved": False
            },
            {
                "title": "Солнцезащитные очки Ray-Ban",
                "description": "Классные очки для отдыха",
                "price": 150,
                "link": "https://example.com/rayban",
                "image_url": "https://example.com/images/rayban.jpg",
                "is_reserved": True
            }
        ]
    }
]



def index(request):
    template = 'wishlist/index.html'
    context = {'wishlists': wishlists[::-1]}
    return render(request, template, context)


def wishlist_detail(request, wishlist_id):
    template = 'wishlist/wishlist_detail.html'
    ids = [wishlist['id'] for wishlist in wishlists]
    print(ids)
    if wishlist_id in ids:
        context = {'wishlist': wishlists[ids.index(wishlist_id)]}
        return render(request, template, context)
    return render(request, template_name='wishlist/index.html')
