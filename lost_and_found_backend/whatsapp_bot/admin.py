from django.contrib import admin
from .models import WhatsAppSession


@admin.register(WhatsAppSession)
class WhatsAppSessionAdmin(admin.ModelAdmin):
    list_display = ("phone_number", "state", "updated_at")
    search_fields = ("phone_number",)
    readonly_fields = ("updated_at",)
