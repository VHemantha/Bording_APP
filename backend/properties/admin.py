from django.contrib import admin

from .models import Property, PropertyImage


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['address', 'city', 'state', 'price', 'beds', 'baths', 'status']
    list_filter = ['city', 'state', 'home_type', 'status']
    search_fields = ['address', 'city', 'zip_code']
    inlines = [PropertyImageInline]
