from django.contrib import admin
from django.conf.urls.static import static
from django.conf import settings
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', RedirectView.as_view(url='/wishlists/', permanent=False)),
    path('wishlists/', include('wishlists.urls', namespace='wishlists')),
    path('pages/', include('pages.urls', namespace='pages')),
    path('users/', include('django.contrib.auth.urls'))
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
