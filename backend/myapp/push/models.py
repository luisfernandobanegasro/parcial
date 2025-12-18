from django.db import models
from django.conf import settings

class DeviceToken(models.Model):
    ANDROID = "android"
    IOS     = "ios"
    WEB     = "web"
    PLATFORM_CHOICES = [(ANDROID, "Android"), (IOS, "iOS"), (WEB, "Web")]

    user     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="device_tokens")
    token    = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default=ANDROID)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user_id} • {self.platform}"
