from django.urls import path
from .views import AsteroidFeedView

urlpatterns = [
    path('feed/', AsteroidFeedView.as_view()),
]
