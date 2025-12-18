from django.contrib import admin
from .models import DeviceToken
@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ("id","user","platform","updated_at")
    search_fields = ("user__username","token")
