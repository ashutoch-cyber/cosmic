from django.db import models
from django.contrib.auth.models import User

class Alert(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    asteroid_name = models.CharField(max_length=100)
    approach_date = models.DateField()
