# myapp/roles/serializers.py
from django.contrib.auth.models import Group, Permission
from rest_framework import serializers

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name"]

class PermissionSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source="content_type.app_label", read_only=True)
    model     = serializers.CharField(source="content_type.model", read_only=True)

    class Meta:
        model  = Permission
        fields = ["id", "name", "codename", "app_label", "model"]
