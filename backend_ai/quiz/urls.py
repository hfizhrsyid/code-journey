from django.urls import path
from .views import (
    generate_question_view,
    check_answer_view,
    get_question_view,
    generate_question_set_view,
    get_questions,
    submit_answer,
    get_user_attempts,
    get_topics,
    run_code,
    get_user_badges,
    get_all_badges,
    check_badge_unlock,
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
    
    # NEW: Database-first question endpoints (Step 3)
    path("questions/", get_questions, name="get_questions"),
    path("questions/submit/", submit_answer, name="submit_answer"),
    path("questions/run/", run_code, name="run_code"),  # New: Run code with test cases
    path("questions/attempts/", get_user_attempts, name="get_user_attempts"),
    path("topics/", get_topics, name="get_topics"),
    
    # Badge endpoints
    path("badges/", get_all_badges, name="get_all_badges"),
    path("user/badges/", get_user_badges, name="get_user_badges"),
    path("badges/check/", check_badge_unlock, name="check_badge_unlock"),
    
    # OLD: Legacy AI-generation endpoints (to be deprecated)
    path("generate-question/", generate_question_view, name="generate_question"),
    path("generate-question-set/", generate_question_set_view, name="generate_question_set"),
    path("check-answer/", check_answer_view, name="check_answer"),
    path("question/<int:question_id>/", get_question_view, name="get_question"),
]