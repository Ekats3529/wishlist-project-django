from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView
from .models import Wishlist, Item
from .forms import WishlistForm, RegistrationForm, ProfileEditForm
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.auth.decorators import login_required

User = get_user_model()

def get_public_wishlists():
    return Wishlist.objects.filter(
        is_public=True
    )


def index(request):
    template = 'wishlist/index.html'
    wishlists = (
        get_public_wishlists()
        .order_by('-created_at')
        .all()
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


def register(request):
    """Регистрация пользователя"""

    template = 'registration/registration_form.html'

    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = RegistrationForm()

    return render(request, template, {'form': form})


@login_required
def create_wishlist(request):
    """Создание нового wishlist"""

    template = 'wishlist/create_wishlist.html'
    
    if request.method == 'POST':
        form = WishlistForm(request.POST)
        if form.is_valid():
            wishlist = form.save(commit=False)
            wishlist.owner = request.user       
            wishlist.save()                     
            return redirect('wishlists:index')
    else:
        form = WishlistForm()

    return render(request, template, {'form': form})


def user_profile(request, username):
    """Страница профиля пользователя с пагинацией"""

    template = 'wishlist/profile.html'

    profile = get_object_or_404(User, username=username)

    if request.user == profile:
        wishlist_list = Wishlist.objects.filter(owner=profile).select_related(
            'owner'
        ).order_by('-updated_at').all()
    else:
        wishlist_list = get_public_wishlists().filter(author=profile, ).order_by('-updated_at').all()


    return render(request, template, {
        'profile': profile,
        'wishlists': wishlist_list
    })


@login_required
def edit_profile(request):
    """Редактирование информации профиля"""

    template = 'registration/registration_form.html'

    if request.method == 'POST':
        form = ProfileEditForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            return redirect('wishlist:profile', username=request.user.username)
    else:
        form = ProfileEditForm(instance=request.user)

    return render(request, template, {'form': form})

