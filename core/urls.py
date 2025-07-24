from django.contrib import admin
from django.urls import path
from .views import *

urlpatterns = [
    path('',view=Index, name="home"),
    path('songs/', view= songs, name="song_list"),
    path('playlist/<int:id>/',view=playlist_songs,name="playlist_songs"),
    path('artists/<int:id>/',view=artists_songs,name="artists_songs"),
    path('likedsongs/',view=liked_songs,name="artists_songs"),
    path('import/',view=import_playlist,name="importplaylist"),
    path('playlist/add/',view=add_playlist,name="importplaylist"),
    path("songs/like/", toggle_like_song, name="like-song"),
    path("playlist/addsong/", add_song_to_playlist, name="add-to-playlist"),
    path("playlist/removesong/", remove_song_from_playlist, name="remove-from-playlist"),
]