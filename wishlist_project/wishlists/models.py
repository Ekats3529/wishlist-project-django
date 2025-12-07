from django.db import models
from django.contrib.auth.models import User

class Wishlist(models.Model):
    title = models.CharField("Название списка", max_length=200)
    description = models.TextField("Описание", blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlists')
    is_public = models.BooleanField("Публичный", default=True)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True)

    class Meta:
        verbose_name = "Список желаний"
        verbose_name_plural = "Списки желаний"
        ordering = ['-created_at']

    def __str__(self):
        return self.title
    

class Item(models.Model):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name='items')
    title = models.CharField("Название предмета", max_length=200)
    description = models.TextField("Описание", blank=True)
    price = models.DecimalField("Цена", max_digits=10, decimal_places=2, null=True, blank=True)
    link = models.URLField("Ссылка на покупку", blank=True)
    image = models.ImageField("Изображение", upload_to='items/', blank=True, null=True)
    is_reserved = models.BooleanField("Зарезервирован", default=False)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True)

    class Meta:
        verbose_name = "Предмет"
        verbose_name_plural = "Предметы"
        ordering = ['-created_at']

    def __str__(self):
        return self.title
