from django import forms
from .models import Wishlist, Item
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model

User = get_user_model()

class WishlistForm(forms.ModelForm):
    class Meta:
        model = Wishlist
        fields = ['title', 'description', 'is_public']


class RegistrationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('username', 'email', 'first_name', 'last_name')


class ProfileEditForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name')


class ItemForm(forms.ModelForm):
    class Meta:
        model = Item
        fields = ['title', 'description', 'price', 'link', 'image', 'is_reserved']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Название предмета'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Описание', 'rows': 3}),
            'price': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Цена'}),
            'link': forms.URLInput(attrs={'class': 'form-control', 'placeholder': 'Ссылка на покупку'}),
            'image': forms.ClearableFileInput(attrs={'class': 'form-control'}),
            'is_reserved': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
