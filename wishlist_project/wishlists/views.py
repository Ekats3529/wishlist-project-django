from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView
from .models import Wishlist, Item
from .forms import WishlistForm
from django.urls import reverse_lazy


def index(request):
    template = 'wishlist/index.html'
    wishlists = (
        Wishlist.objects
        .order_by('-created_at')
        .all()[:5]
    )
    context = {'wishlists': wishlists}
    return render(request, template, context)


def wishlist_detail(request, wishlist_id):
    template = 'wishlist/wishlist_detail.html'
    wishlist = get_object_or_404(
        Wishlist.objects.all(),
        pk=wishlist_id
    )
    context = {'wishlist': wishlist}
    return render(request, template, context)

