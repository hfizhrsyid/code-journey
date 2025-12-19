from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Badge, UserBadge, Topic, Question, QuestionAttempt


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User registration and profile"""
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'password2']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs
    
    def create(self, validated_data):
        """Create new user"""
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        """Authenticate user credentials"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        if not username or not password:
            raise serializers.ValidationError("Username and password required.")
        
        user = authenticate(username=username, password=password)
        
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        
        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile view"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'username', 'date_joined']

class BadgeSerializer(serializers.ModelSerializer):
    """Serializer for Badge model"""
    topic_name = serializers.CharField(source='topic.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon', 'badge_type', 'topic', 'topic_name', 'requirement', 'is_active']


class UserBadgeSerializer(serializers.ModelSerializer):
    """Serializer for earned badges"""
    badge = BadgeSerializer(read_only=True)
    badge_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = UserBadge
        fields = ['id', 'badge', 'badge_id', 'earned_at']
        read_only_fields = ['id', 'earned_at']


class TopicSerializer(serializers.ModelSerializer):
    """Serializer for Topic model"""
    class Meta:
        model = Topic
        fields = ['id', 'name', 'description', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for Question model"""
    topic_name = serializers.CharField(source='topic.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_type', 'difficulty', 'topic', 'topic_name', 'question_text', 'code_template', 'options', 'explanation']


class QuestionAttemptSerializer(serializers.ModelSerializer):
    """Serializer for QuestionAttempt model"""
    question = QuestionSerializer(read_only=True)
    
    class Meta:
        model = QuestionAttempt
        fields = ['id', 'question', 'answer', 'is_correct', 'created_at']