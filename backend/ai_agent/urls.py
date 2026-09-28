from django.urls import path

from . import views

urlpatterns = [
    path('ai/search/', views.ai_search, name='ai-search'),
    path('ai/assistant/', views.ai_assistant, name='ai-assistant'),
    path('ai/extract-listing/', views.ai_extract_listing, name='ai-extract-listing'),
]
