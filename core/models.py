from django.db import models
from django.contrib.auth.models import User

def song_file_path(instance, filename):
    return f"songs/{instance.title}/{filename}"

class Artist(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    records = models.IntegerField()
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']


class Song(models.Model):
    title = models.CharField(max_length=255, db_index=True)
    banner = models.CharField(max_length=500)
    url = models.CharField(max_length=500)
    times_played = models.SmallIntegerField(default=0)
    added_on = models.DateField()
    artists = models.ManyToManyField(Artist, related_name='songs')
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-added_on']

# class LikedSong(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='song_like')
#     song = models.ForeignKey(User, on_delete=models.CASCADE, related_name='song')

#     def __str__(self):
#         return f"{self.user} likes {self.song}"
    
class LikedSong(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_songs')
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name='liked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} likes {self.song.title}"

    class Meta:
        unique_together = ('user', 'song')  # Prevent duplicate likes

