from youtube_search import YoutubeSearch
import json
import os
from pytubefix import YouTube
from pytubefix.cli import on_progress

def search_youtube(query):
    try:
        results = YoutubeSearch(query, max_results=1).to_json()
        results = json.loads(results)
        return results["videos"][0]['id']
    except Exception as e:
        print(f"Search error: {e}")
        return None

def DownloadSong(song_title, download_folder="media/songs"):
    try:
        video_id = search_youtube(query=song_title)
        if video_id:
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            print("Song Found")
            
            # Create the download folder if it doesn't exist
            if not os.path.exists(download_folder):
                os.makedirs(download_folder)
            
            yt = YouTube(video_url, on_progress_callback=on_progress)
            audio = yt.streams.get_audio_only()
            print("Downloading Song")
            
            # Download to the specified folder
            # song_title_clean = song_title.strip().replace(" ", "")
            downloaded_file = audio.download(output_path=download_folder)
            downloaded_file = downloaded_file.split("media\\").pop()
            print(f"Download Completed - saved to: {downloaded_file}")
            return downloaded_file  # Return the actual file path
        else:
            print("Song Not Found")
            return None  # Return None instead of False
    except Exception as e:
        print(f"Error occurred while downloading song: {e}")
        return None  # Return None instead of False