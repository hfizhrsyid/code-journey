#!/usr/bin/env python
"""Test if authentication is working by checking request.user"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth.models import User, AnonymousUser
from rest_framework.authtoken.models import Token

print('=' * 70)
print('AUTHENTICATION TEST')
print('=' * 70)

# Check users and tokens
users = User.objects.all()
print(f'\nUsers in database: {users.count()}')
for u in users:
    try:
        token = Token.objects.get(user=u)
        print(f'  {u.username}: Token = {token.key[:10]}...')
    except Token.DoesNotExist:
        print(f'  {u.username}: NO TOKEN')

print('\n' + '=' * 70)
print('RECOMMENDATION:')
print('=' * 70)
print('If user has no token, create one:')
print('  from rest_framework.authtoken.models import Token')
print('  from django.contrib.auth.models import User')
print('  user = User.objects.get(username="YOUR_USERNAME")')
print('  token, created = Token.objects.get_or_create(user=user)')
print('  print(f"Token: {token.key}")')
print('=' * 70)
