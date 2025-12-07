from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView
from .models import Wishlist
from .forms import WishlistForm
from django.urls import reverse_lazy

wishlists = [
    {
        "id": 1,
        "title": "День рождения Екатерины",
        "description": "Все, что я хочу на день рождения",
        "owner": "ekats",
        "is_public": True,
        "items": [
            
        ]
    },
    {
        "id": 2,
        "title": "Новогодние подарки",
        "description": "Всё, что хочется на Новый год",
        "owner": "alex",
        "is_public": False,
        "items": [
            
        ]
    },
]


def index(request):
    template = 'wishlist/index.html'
    context = {'wishlists': wishlists[::-1]}
    return render(request, template, context)

