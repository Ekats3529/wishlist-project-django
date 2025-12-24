from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView
from .models import Wishlist, Item
from .forms import WishlistForm, RegistrationForm, ProfileEditForm, ItemForm
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse, HttpResponseForbidden
from .models import Item
from .recsys import get_wishlist_recommendations

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


@login_required
def edit_wishlist(request, wishlist_id):
    """Редактирование существующего wishlist"""

    wishlist = get_object_or_404(Wishlist, pk=wishlist_id)

    if wishlist.owner != request.user:
        return redirect('wishlists:wishlist_detail', wishlist_id=wishlist.id)

    template = 'wishlist/edit_wishlist.html'

    if request.method == 'POST':
        form = WishlistForm(request.POST, instance=wishlist)
        if form.is_valid():
            form.save()
            return redirect('wishlists:wishlist_detail', wishlist_id=wishlist.id)
    else:
        form = WishlistForm(instance=wishlist)

    return render(request, template, {'form': form, 'wishlist': wishlist})


@login_required
def add_item(request, wishlist_id):
    """Добавление нового предмета в wishlist"""
    wishlist = get_object_or_404(Wishlist, pk=wishlist_id)

    # Проверяем, что текущий пользователь — владелец списка
    if wishlist.owner != request.user:
        return redirect('wishlists:wishlist_detail', wishlist_id=wishlist.id)

    template = 'wishlist/add_item.html'

    if request.method == 'POST':
        form = ItemForm(request.POST, request.FILES)
        if form.is_valid():
            item = form.save(commit=False)
            item.wishlist = wishlist
            item.save()
            return redirect('wishlists:wishlist_detail', wishlist_id=wishlist.id)
    else:
        form = ItemForm()

    return render(request, template, {'form': form, 'wishlist': wishlist})


@login_required
def edit_item(request, item_id):
    """Редактирование существующего предмета в wishlist"""
    item = get_object_or_404(Item, pk=item_id)
    wishlist = item.wishlist

    # Проверяем, что текущий пользователь — владелец списка
    if wishlist.owner != request.user:
        return redirect('wishlists:wishlist_detail', wishlist_id=wishlist.id)

    template = 'wishlist/edit_item.html'

    if request.method == 'POST':
        form = ItemForm(request.POST, request.FILES, instance=item)
        if form.is_valid():
            form.save()
            return redirect('wishlists:wishlist_detail', wishlist_id=wishlist.id)
    else:
        form = ItemForm(instance=item)

    return render(request, template, {'form': form, 'wishlist': wishlist, 'item': item})


@login_required
def delete_item(request, item_id):
    """Удаление предмета из wishlist"""
    
    item = get_object_or_404(Item, pk=item_id)
    wishlist = item.wishlist

    # Проверяем, что текущий пользователь — владелец списка
    if wishlist.owner != request.user:
        return redirect('wishlists:wishlist_detail', wishlist_id=wishlist.id)

    if request.method == 'POST':
        item.delete()
        return redirect('wishlists:wishlist_detail', wishlist_id=wishlist.id)

    return render(request, 'wishlist/delete_item_confirm.html', {'item': item, 'wishlist': wishlist})




def wishlist_recommendations(request, wishlist_id):
    wishlist = get_object_or_404(Wishlist, id=wishlist_id)

    # Показываем только владельцу
    if not request.user.is_authenticated or request.user != wishlist.owner:
        return HttpResponseForbidden('Not allowed')

    data = get_wishlist_recommendations(wishlist)
    return JsonResponse(data, safe=False)




@login_required
@require_POST
@csrf_exempt
def add_recommendation(request, wishlist_id):
    """Добавление рекомендации в вишлист через AJAX"""
    print(f"DEBUG: add_recommendation called for wishlist_id={wishlist_id}")
    
    # Проверяем аутентификацию вручную
    if not request.user.is_authenticated:
        return JsonResponse({
            'success': False,
            'error': 'Требуется авторизация'
        }, status=401)
    
    wishlist = get_object_or_404(Wishlist, id=wishlist_id)
    
    # Проверяем, что пользователь владелец вишлиста
    if wishlist.owner != request.user:
        print(f"DEBUG: User {request.user} is not owner of wishlist {wishlist_id}")
        return JsonResponse({'error': 'Недостаточно прав'}, status=403)
    
    try:
        # Получаем данные из POST запроса
        title = request.POST.get('title')
        description = request.POST.get('description', '')
        
        if not title:
            return JsonResponse({
                'success': False,
                'error': 'Название обязательно'
            }, status=400)
        
        print(f"DEBUG: Creating item with title='{title}', description='{description}'")
        
        # Создаем новый предмет
        item = Item.objects.create(
            wishlist=wishlist,
            title=title,
            description=description,
            is_reserved=False
        )
        
        print(f"DEBUG: Item created with id={item.id}")
        
        # Возвращаем полную информацию о созданном предмете
        from django.utils import timezone
        from django.urls import reverse
        
        return JsonResponse({
            'success': True,
            'item_id': item.id,
            'item': {
                'id': item.id,
                'title': item.title,
                'description': item.description,
                'price': item.price,
                'is_reserved': item.is_reserved,
                'created_at': item.created_at.strftime('%d.%m.%Y %H:%M'),
                'edit_url': reverse('wishlists:edit_item', args=[item.id]),
                'delete_url': reverse('wishlists:delete_item', args=[item.id])
            },
            'message': f'Предмет "{title}" успешно добавлен'
        })
    except Exception as e:
        print(f"DEBUG: Exception occurred: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)