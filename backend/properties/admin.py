from django.contrib import admin

from .models import Inquiry, Property, PropertyImage


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['address', 'city', 'price', 'beds', 'baths', 'status', 'furnishing', 'owner']
    list_filter = ['city', 'home_type', 'status', 'furnishing']
    search_fields = ['address', 'city', 'zip_code']
    inlines = [PropertyImageInline]


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ['name', 'property', 'email', 'phone', 'created_at']
    search_fields = ['name', 'email', 'phone', 'message']
