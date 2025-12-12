from django.urls import path
from .views import (
    generate_question_view,
    check_answer_view,
    get_question_view,
    generate_question_set_view,  # ADD THIS
)

urlpatterns = [
    path("generate-question/", generate_question_view, name="generate_question"),
    path("generate-question-set/", generate_question_set_view, name="generate_question_set"),  # ADD THIS
    path("check-answer/", check_answer_view, name="check_answer"),
    path("question/<int:question_id>/", get_question_view, name="get_question"),
]