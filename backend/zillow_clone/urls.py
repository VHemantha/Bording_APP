"""
URL configuration for zillow_clone project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

from .views import spa_index

urlpatterns = [
    # NOT under admin/: the React app owns /admin/* (dashboard, /admin/listings/new, ...)
    # and both are served from one origin in production.
    path('django-admin/', admin.site.urls),
    path('api/', include('properties.urls')),
    path('api/', include('accounts.urls')),
    path('api/', include('ai_agent.urls')),
    # Listing photos users uploaded. Uploads are re-encoded JPEGs (properties/media.py), and
    # serve() refuses paths outside MEDIA_ROOT. Fine at this site's scale; a CDN or object
    # storage would take over if traffic grew.
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    # Everything else belongs to the React router. Excluding these prefixes keeps
    # unknown API/static/asset URLs returning a real 404 instead of the HTML shell.
    re_path(r'^(?!api/|django-admin/|static/|assets/|media/).*$', spa_index),
]
