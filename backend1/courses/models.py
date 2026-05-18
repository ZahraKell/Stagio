from django.db import models


class Course(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    link = models.URLField(max_length=500)

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title
