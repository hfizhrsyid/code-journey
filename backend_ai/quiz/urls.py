from django.urls import path
from .views import (
    generate_question_view,
    check_answer_view,
    get_question_view,
    generate_question_set_view,
)
from .auth_views import (
    signup,
    login,
    user_profile,
    logout,
)

urlpatterns = [
    # Authentication endpoints
    path("auth/signup/", signup, name="signup"),
    path("auth/login/", login, name="login"),
    path("auth/profile/", user_profile, name="user_profile"),
    path("auth/logout/", logout, name="logout"),
    
    # Question endpoints
    path("generate-question/", generate_question_view, name="generate_question"),
    path("generate-question-set/", generate_question_set_view, name="generate_question_set"),
    path("check-answer/", check_answer_view, name="check_answer"),
    path("question/<int:question_id>/", get_question_view, name="get_question"),
]