"""
Custom User Model with Role-Based Access Control

This module defines the custom User model with support for:
- LOSER: Regular users who can report lost items
- STAFF: Office staff who can report found items and set secret questions
- ADMIN: Administrators with full access
"""

import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('role', 'ADMIN')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with UUID primary key and role-based access."""
    
    class RoleChoices(models.TextChoices):
        LOSER = 'LOSER', 'Loser (Regular User)'
        STAFF = 'STAFF', 'Staff (Lost & Found Office)'
        ADMIN = 'ADMIN', 'Administrator'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=255)
    full_name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    
    # Role-based access
    role = models.CharField(
        max_length=10,
        choices=RoleChoices.choices,
        default=RoleChoices.LOSER
    )
    
    # Account status fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    # Timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Profile picture (optional)
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        blank=True,
        null=True
    )
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} ({self.email})"
    
    @property
    def is_loser(self):
        """Check if user is a regular loser (person who lost item)."""
        return self.role == self.RoleChoices.LOSER
    
    @property
    def is_office_staff(self):
        """Check if user is Lost & Found office staff."""
        return self.role == self.RoleChoices.STAFF
    
    @property
    def is_admin(self):
        """Check if user is an administrator."""
        return self.role == self.RoleChoices.ADMIN
    
    def has_staff_permissions(self):
        """Check if user has staff-level permissions (STAFF or ADMIN)."""
        return self.role in [self.RoleChoices.STAFF, self.RoleChoices.ADMIN]
