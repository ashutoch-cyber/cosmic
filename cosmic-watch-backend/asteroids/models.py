from django.db import models
from django.contrib.auth.models import User

class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    asteroid_id = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
