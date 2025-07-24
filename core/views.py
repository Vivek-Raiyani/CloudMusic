from django.shortcuts import render,HttpResponse
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from .models import *
from playlist.models import *
from .utils.spotifyplaylist import *
from datetime import date
from django.conf import settings
from django.views.decorators.http import require_POST
from django.http import JsonResponse


# Create your views here.
@login_required
def Index(request):
    user= request.user
    user_playlist = Playlist.objects.filter(user= request.user).all()
    artists = Artist.objects.all()
    return render(request,"index.html",context={"playlists" : user_playlist,"artists": artists})

def songs(request):
    if request.method == "POST":
        playlist_id = request.POST.get("playlist_id")
        songs= Song.objects.all()
        return render(request,"songlist.html",context={"songs" : songs,"playlist_id":playlist_id})
    else:   
    # paginator = Paginator(Song.objects.all(), per_page=20)
    # songs = paginator.get_page(page_number)
        songs= Song.objects.all()
        return render(request,"songlist.html",context={"songs" : songs,"MEDIA_URL": settings.MEDIA_URL})

def playlist_songs(request, id):
    if id <= 0 :
        songs_data = []
        user_liked_songs = set(
            LikedSong.objects.filter(user=request.user).values_list("song_id", flat=True)
        )
        songs= Song.objects.all()
        for song in songs:
            song_info = {
                "id": song.id,
                "title": song.title,
                "banner": song.banner if song.banner else "",
                "url": song.url if song.url else "",
                "liked": song.id in user_liked_songs,
            }
            songs_data.append(song_info)
        
        return render(request,"playlistsongs.html",context={"songs" : songs_data,"MEDIA_URL": settings.MEDIA_URL})

    print("playlist song called")

    playlist = Playlist.objects.filter(id=id).prefetch_related('songs').first()
    user_liked_songs = set(
        LikedSong.objects.filter(user=request.user).values_list("song_id", flat=True)
    )

    if not playlist:
        return HttpResponse("Playlist not found", status=404)

    songs_data = []
    for song in playlist.songs.all():
        song_info = {
            "id": song.id,
            "title": song.title,
            "banner": song.banner if song.banner else "",
            "url": song.url if song.url else "",
            "liked": song.id in user_liked_songs,
        }
        songs_data.append(song_info)

    playlist_details = {
        "id": playlist.id,
        "title": playlist.title,
        "banner": playlist.banner if playlist.banner else "",
    }

    print("Playlist Details:", playlist_details)

    return render(
        request,
        "playlistsongs.html",
        context={
            "playlist": playlist_details,
            "songs": songs_data,
            "MEDIA_URL": settings.MEDIA_URL,
        }
    )

def artists_songs(request, id):
    print("artists song called")

    artists = Artist.objects.filter(id=id).prefetch_related("songs").first()
    print(artists)
    user_liked_songs = set(
        LikedSong.objects.filter(user=request.user).values_list("song_id", flat=True)
    )

    songs_data = []
    for song in artists.songs.all():
        song_info = {
            "id": song.id,
            "title": song.title,
            "banner": song.banner if song.banner else "",
            "url": song.url if song.url else "",
            "liked": song.id in user_liked_songs,
        }
        songs_data.append(song_info)

    playlist_details = {
        "id": artists.id,
        "title": artists.name,
        "banner": "",
    }


    return render(
        request,
        "playlistsongs.html",
        context={
            "playlist": playlist_details,
            "songs": songs_data,
            "MEDIA_URL": settings.MEDIA_URL,
        }
    )

def liked_songs(request):
    print("liked song called")

    songs = Song.objects.all()

    user_liked_songs = set(
        LikedSong.objects.filter(user=request.user).values_list("song_id", flat=True)
    )

    songs_data = []
    for song in songs:
        if song.id in user_liked_songs:
            song_info = {
                "id": song.id,
                "title": song.title,
                "banner": song.banner if song.banner else "",
                "url": song.url if song.url else "",
                "liked": True,
            }
            songs_data.append(song_info)

    playlist_details = {
        "id": 0,
        "title": "Liked Songs",
        "banner": "",
    }


    return render(
        request,
        "playlistsongs.html",
        context={
            "playlist": playlist_details,
            "songs": songs_data,
            "MEDIA_URL": settings.MEDIA_URL,
        }
    )


def import_playlist(request):
    if request.method == "POST":
        playlist_url = request.POST.get("PlaylistUrl")
        # print(playlist_url) we need to identify 
        playlist= DownloadPLaylist(playlist_url)
        title = playlist["name"]
        banner = playlist["images"]
        user= request.user
        if banner:
            banner= banner[0]["url"]
            print("banner : "+banner)
        print("title : "+title)
        print(user)
        db_playlist = Playlist.objects.create(
            title=title,
            banner=banner,
            user=request.user
        )

        songs = []
        track_items = playlist['tracks']['items']
        for item in track_items:
            track = item.get('track')
            print("gathering playlist song")
            if track:
                title = track.get('name')
                banner= track.get('album').get('images')
                artists= track.get("artists")
                print(banner)
                if banner:
                    banner= banner[0]["url"]
                print(title)
                print(banner)
                print(artists)
                if not Song.objects.filter(title = title).exists():

                    print("gathering song artists")
                    song_artits_list = []
                    for artist in artists:
                        if Artist.objects.filter(name = artist['name']).exists():
                            db_artist= Artist.objects.filter(name = artist['name']).first()
                            db_artist.records+=1
                            song_artits_list.append(db_artist)
                        else:
                            new_artist = Artist.objects.create(
                                name= artist['name'],
                                records = 1
                            )
                            song_artits_list.append(new_artist)
                    

                    song_path = DownloadSong(song_title=title)
                    song = Song.objects.create(
                        title = title,
                        banner = banner,
                        url= song_path,
                        added_on = date.today(),
                    )
                    song.artists.set(song_artits_list)

                    songs.append(song)
                else:
                     print("Song already present")
                     db_song= Song.objects.filter(title = title).first()
                     songs.append(db_song)
        
        db_playlist.songs.set(songs)  
        
        return HttpResponse(playlist)
    else:
        return render(request,"import.html")
    
def add_playlist(request):
    if request.method == "POST":
        playlist = request.POST.get("Playlist")
        banner = request.FILES.get("Banner")
        
        Playlist.objects.create(
            title=playlist,
            user=request.user,
            created_at=date.today(),
            updated_at=date.today()
        )
        return HttpResponse("suceess")
    else:
        return render(request,"import.html")

@require_POST
@login_required
def add_song_to_playlist(request):
    playlist_id = request.POST.get("playlist_id")
    song_id = request.POST.get("song_id")
    print(playlist_id)
    print(song_id)
    try:
        playlist = Playlist.objects.get(id=playlist_id, user=request.user)
        song = Song.objects.get(id=song_id)
        playlist.songs.add(song)
        return HttpResponse("")
    except Exception as e:
        return HttpResponse("")

@require_POST
@login_required
def remove_song_from_playlist(request):
    playlist_id = request.POST.get("playlist_id")
    song_id = request.POST.get("song_id")
    print("req for delete"+playlist_id+"--"+song_id)
    try:
        playlist = Playlist.objects.get(id=playlist_id, user=request.user)
        song = Song.objects.get(id=song_id)
        playlist.songs.remove(song)
        print("req for delete")
        print(playlist)
        print(playlist.songs)
        return HttpResponse("")
    except Exception as e:
        return HttpResponse("")


@require_POST
@login_required
def toggle_like_song(request):
    song_id = request.POST.get("song_id")
    song = Song.objects.get(id=song_id)
    liked, created = LikedSong.objects.get_or_create(user=request.user, song=song)

    if not created:
        liked.delete()
        return HttpResponse( "🤍")
    else:
        return HttpResponse( "❤️")
