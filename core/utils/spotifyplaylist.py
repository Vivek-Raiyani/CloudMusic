import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import os
from spotipy.oauth2 import SpotifyClientCredentials
from .ytdownload import DownloadSong
from dotenv import load_dotenv

load_dotenv()
# Replace with your actual credentials
client_id = os.getenv("client_id")
client_secret = os.getenv("client_secret")

client_credentials_manager = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)

sp = spotipy.Spotify(auth_manager=client_credentials_manager)


def DownloadPLaylist(playlist_id):
    boster_playlist = sp.playlist(playlist_id=playlist_id)
    return boster_playlist
