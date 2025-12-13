from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import SessionAuthentication
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login as auth_login
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from .serializers import UserSerializer, LoginSerializer, UserProfileSerializer
import logging
from functools import wraps

logger = logging.getLogger(__name__)

def add_cors_headers(view_func):
    """Decorator to add CORS headers to responses"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Handle preflight OPTIONS requests
        if request.method == 'OPTIONS':
            response = HttpResponse()
            response['Access-Control-Allow-Origin'] = 'http://localhost:8081'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Max-Age'] = '3600'
            return response
        
        # Call the actual view
        response = view_func(request, *args, **kwargs)
        
        # Add CORS headers to the response
        response['Access-Control-Allow-Origin'] = 'http://localhost:8081'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
        
        return response
    return wrapper


@add_cors_headers
@csrf_exempt
@api_view(["POST", "OPTIONS"])
@authentication_classes([])
@permission_classes([AllowAny])
def signup(request):
    """
    Register a new user
    
    POST /api/auth/signup/
    {
        "username": "john_doe",
        "email": "john@example.com",
        "password": "secure_pass123",
        "password2": "secure_pass123",
        "first_name": "John",
        "last_name": "Doe"
    }
    """
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    try:
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Log the user in
            auth_login(request, user)
            
            return Response({
                "message": "User created successfully",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return Response(
            {"error": f"Registration failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@add_cors_headers
@csrf_exempt
@api_view(["POST", "OPTIONS"])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    """
    Login user and return user info with session
    
    POST /api/auth/login/
    {
        "username": "john_doe",
        "password": "secure_pass123"
    }
    """
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    try:
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Log the user in (sets session)
            auth_login(request, user)
            
            return Response({
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response(
            {"error": f"Login failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get current user profile (requires authentication)
    
    GET /api/auth/profile/
    """
    try:
        user = request.user
        serializer = UserProfileSerializer(user)
        
        return Response({
            "user": serializer.data,
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Profile error: {str(e)}")
        return Response(
            {"error": f"Failed to retrieve profile: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@add_cors_headers
@csrf_exempt
@api_view(["POST", "OPTIONS"])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout user
    
    POST /api/auth/logout/
    """
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    try:
        from django.contrib.auth import logout as auth_logout
        auth_logout(request)
        return Response({
            "message": "Logout successful",
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response(
            {"error": f"Logout failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
