import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'backend_ai.settings'

import django
django.setup()

# Import services to apply the monkey patch
from quiz import services  # This will apply the httpx monkey patch

from django.conf import settings
from groq import Groq

api_key = settings.GROQ_API_KEY
print(f"API Key configured: {bool(api_key)}")
print(f"API Key length: {len(api_key) if api_key else 0}")

try:
    print("\nAttempting to initialize Groq client...")
    client = Groq(api_key=api_key)
    print("✓ Client initialized successfully!")
    print(f"Client type: {type(client)}")
    print(f"Client base_url: {getattr(client, 'base_url', 'N/A')}")
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
