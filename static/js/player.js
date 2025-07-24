$(document).ready(function () {
  // Enhanced Music Player Class
  class MusicPlayer {
    constructor() {
      this.songs = [];
      this.currentIndex = 0;
      this.isShuffled = false;
      this.isRepeating = false; // off, all, one
      this.repeatMode = "off"; // 'off', 'all', 'one'
      this.shuffledIndices = [];
      this.currentShuffleIndex = 0;
      this.isPlaying = false;
      this.volume = 0.7;

      this.initializeElements();
      this.bindEvents();
      this.initializeAudio();
    }

    initializeElements() {
      this.$audio = $("#audio-player")[0];
      this.$player = $("#player");
      this.$playPauseBtn = $("#play-pause-btn");
      this.$prevBtn = $("#prev-btn");
      this.$nextBtn = $("#next-btn");
      this.$shuffleBtn = $("#shuffle-btn");
      this.$repeatBtn = $("#repeat-btn");
      this.$likeBtn = $("#like-btn");
      this.$volumeBtn = $("#volume-btn");
      this.$volumeSlider = $("#volume-slider");
      this.$progressBar = $("#progress-bar");
      this.$currentTime = $("#current-time");
      this.$totalTime = $("#total-time");
      this.$playerTitle = $("#player-title");
      this.$playerArtist = $("#player-artist");
      this.$playerCover = $("#player-cover");
      this.$loadingSpinner = $(".loading-spinner");
    }

    initializeAudio() {
      this.$audio.volume = this.volume;
      this.$volumeSlider.val(this.volume * 100);
    }

    bindEvents() {
      // Audio events
      $(this.$audio).on("loadstart", () => this.showLoading());
      $(this.$audio).on("canplay", () => this.hideLoading());
      $(this.$audio).on("play", () => this.onPlay());
      $(this.$audio).on("pause", () => this.onPause());
      $(this.$audio).on("ended", () => this.onEnded());
      $(this.$audio).on("timeupdate", () => this.updateProgress());
      $(this.$audio).on("loadedmetadata", () => this.updateDuration());
      $(this.$audio).on("error", (e) => this.onError(e));

      // Control events
      this.$playPauseBtn.on("click", () => this.togglePlayPause());
      this.$prevBtn.on("click", () => this.playPrevious());
      this.$nextBtn.on("click", () => this.playNext());
      this.$shuffleBtn.on("click", () => this.toggleShuffle());
      this.$repeatBtn.on("click", () => this.toggleRepeat());
      this.$volumeSlider.on("input", (e) =>
        this.setVolume(e.target.value / 100)
      );
      this.$volumeBtn.on("click", () => this.toggleMute());

      // Progress bar click
      this.$progressBar.parent().on("click", (e) => this.seekTo(e));

      // Keyboard shortcuts
      $(document).on("keydown", (e) => this.handleKeyboard(e));
    }

    loadSongs(songs) {
      this.songs = songs.map((song, index) => ({
        ...song,
        index: index,
      }));

      if (this.isShuffled) {
        this.generateShuffledIndices();
      }

      console.log(`Loaded ${this.songs.length} songs`);
    }

    generateShuffledIndices() {
      this.shuffledIndices = [...Array(this.songs.length).keys()];
      // Fisher-Yates shuffle
      for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.shuffledIndices[i], this.shuffledIndices[j]] = [
          this.shuffledIndices[j],
          this.shuffledIndices[i],
        ];
      }
    }

    getCurrentSong() {
      if (this.songs.length === 0) return null;

      if (this.isShuffled) {
        return this.songs[this.shuffledIndices[this.currentShuffleIndex]];
      }
      return this.songs[this.currentIndex];
    }

    playPlaylist() {
      this.currentIndex = 0;
      this.playSong(this.getCurrentSong());
    }

    playSuffledPlaylist() {
      this.toggleShuffle();
      this.generateShuffledIndices();
      this.currentIndex = 0;
      this.playSong(this.getCurrentSong());
    }

    playSongById(songId) {
      const songIndex = this.songs.findIndex((song) => song.id === songId);
      if (songIndex === -1) return;

      this.currentIndex = songIndex;

      if (this.isShuffled) {
        this.currentShuffleIndex = this.shuffledIndices.indexOf(songIndex);
      }

      this.playSong(this.getCurrentSong());
    }

    playSong(song) {
      if (!song || !song.url) {
        console.error("Invalid song data:", song);
        return;
      }

      console.log("Playing:", song.title);

      this.updateUI(song);
      this.updateSongVisualState(song);

      this.$player.show();
      this.$audio.src = song.url;
      this.$audio.load();

      // Auto-play with error handling
      const playPromise = this.$audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Playback failed:", error);
          this.onError(error);
        });
      }
    }

    updateUI(song) {
      this.$playerTitle.text(song.title || "Unknown Title");
      this.$playerArtist.text(song.artists || "Unknown Artist");

      if (song.banner) {
        this.$playerCover.attr("src", song.banner);
      } else {
        this.$playerCover.attr(
          "src",
          "https://via.placeholder.com/60x60?text=♪"
        );
      }
    }

    updateSongVisualState(currentSong) {
      $(".song-item").removeClass("playing");
      $(`.playsong[data-id="${currentSong.id}"]`)
        .closest(".song-item")
        .addClass("playing");
    }

    togglePlayPause() {
      if (this.$audio.paused) {
        this.$audio.play();
      } else {
        this.$audio.pause();
      }
    }

    playPrevious() {
      if (this.songs.length === 0) return;

      if (this.isShuffled) {
        this.currentShuffleIndex =
          this.currentShuffleIndex > 0
            ? this.currentShuffleIndex - 1
            : this.shuffledIndices.length - 1;
        this.currentIndex = this.shuffledIndices[this.currentShuffleIndex];
      } else {
        this.currentIndex =
          this.currentIndex > 0 ? this.currentIndex - 1 : this.songs.length - 1;
      }

      this.playSong(this.getCurrentSong());
    }

    playNext() {
      if (this.songs.length === 0) return;

      if (this.isShuffled) {
        this.currentShuffleIndex =
          (this.currentShuffleIndex + 1) % this.shuffledIndices.length;
        this.currentIndex = this.shuffledIndices[this.currentShuffleIndex];
      } else {
        this.currentIndex = (this.currentIndex + 1) % this.songs.length;
      }

      this.playSong(this.getCurrentSong());
    }

    toggleShuffle() {
      this.isShuffled = !this.isShuffled;
      this.$shuffleBtn.toggleClass("active", this.isShuffled);

      if (this.isShuffled && this.songs.length > 0) {
        this.generateShuffledIndices();
        this.currentShuffleIndex = this.shuffledIndices.indexOf(
          this.currentIndex
        );
      }

      console.log("Shuffle:", this.isShuffled ? "ON" : "OFF");
    }

    toggleRepeat() {
      const modes = ["off", "all", "one"];
      const currentModeIndex = modes.indexOf(this.repeatMode);
      this.repeatMode = modes[(currentModeIndex + 1) % modes.length];

      this.$repeatBtn.removeClass("active");
      if (this.repeatMode !== "off") {
        this.$repeatBtn.addClass("active");
        if (this.repeatMode === "one") {
          this.$repeatBtn.text("🔂");
        } else {
          this.$repeatBtn.text("🔁");
        }
      }

      console.log("Repeat mode:", this.repeatMode);
    }

    setVolume(volume) {
      this.volume = Math.max(0, Math.min(1, volume));
      this.$audio.volume = this.volume;

      // Update volume icon
      if (this.volume === 0) {
        this.$volumeBtn.text("🔇");
      } else if (this.volume < 0.5) {
        this.$volumeBtn.text("🔉");
      } else {
        this.$volumeBtn.text("🔊");
      }
    }

    toggleMute() {
      if (this.$audio.volume > 0) {
        this.previousVolume = this.$audio.volume;
        this.setVolume(0);
        this.$volumeSlider.val(0);
      } else {
        const restoreVolume = this.previousVolume || 0.7;
        this.setVolume(restoreVolume);
        this.$volumeSlider.val(restoreVolume * 100);
      }
    }

    seekTo(event) {
      if (this.$audio.duration) {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        this.$audio.currentTime = this.$audio.duration * percentage;
      }
    }

    updateProgress() {
      if (this.$audio.duration) {
        const percentage =
          (this.$audio.currentTime / this.$audio.duration) * 100;
        this.$progressBar.css("width", percentage + "%");

        this.$currentTime.text(this.formatTime(this.$audio.currentTime));
      }
    }

    updateDuration() {
      this.$totalTime.text(this.formatTime(this.$audio.duration));
    }

    formatTime(seconds) {
      if (isNaN(seconds)) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    onPlay() {
      this.isPlaying = true;
      this.$playPauseBtn.text("⏸️");
    }

    onPause() {
      this.isPlaying = false;
      this.$playPauseBtn.text("▶️");
    }

    onEnded() {
      if (this.repeatMode === "one") {
        this.$audio.currentTime = 0;
        this.$audio.play();
      } else if (
        this.repeatMode === "all" ||
        this.currentIndex < this.songs.length - 1 ||
        this.isShuffled
      ) {
        this.playNext();
      } else {
        this.onPause();
      }
    }

    onError(error) {
      console.error("Audio error:", error);
      this.hideLoading();
      // Try to play next song on error
      setTimeout(() => this.playNext(), 1000);
    }

    showLoading() {
      this.$loadingSpinner.show();
    }

    hideLoading() {
      this.$loadingSpinner.hide();
    }

    handleKeyboard(event) {
      if (this.$player.is(":visible") && !$("input, textarea").is(":focus")) {
        switch (event.which) {
          case 32: // Spacebar
            event.preventDefault();
            this.togglePlayPause();
            break;
          case 37: // Left arrow
            event.preventDefault();
            this.playPrevious();
            break;
          case 39: // Right arrow
            event.preventDefault();
            this.playNext();
            break;
          case 38: // Up arrow - volume up
            event.preventDefault();
            this.setVolume(this.volume + 0.1);
            this.$volumeSlider.val(this.volume * 100);
            break;
          case 40: // Down arrow - volume down
            event.preventDefault();
            this.setVolume(this.volume - 0.1);
            this.$volumeSlider.val(this.volume * 100);
            break;
        }
      }
    }
  }

  // Initialize the music player
  const musicPlayer = new MusicPlayer();

  // HTMX event handling
  $(document).on("htmx:afterSwap", function (event) {
    if ($(event.target).attr("id") === "song-list") {
      console.log("Song list updated via HTMX");

      const songs = [];
      $(".playsong").each(function () {
        const song = {
          id: $(this).data("id"),
          title: $(this).data("title"),
          banner: $(this).data("banner"),
          url: $(this).data("url"),
          artists: $(this).data("artists"),
        };
        songs.push(song);
      });

      musicPlayer.loadSongs(songs);
    }
  });

  // Song click handler
  $(document).on("click", ".playsong", function () {
    const songId = $(this).data("id");
    musicPlayer.playSongById(songId);
  });

  $(document).on("click", ".playlist-play", function () {
    musicPlayer.playPlaylist();
  });

  $(document).on("click", ".playlist-play-suffle", function () {
    console.log("shuffled playlist");
    musicPlayer.playSuffledPlaylist();
  });

  // Modal form handlers
  $("#Import-Submit").click(function (e) {
    e.preventDefault();
    const $btn = $(this);
    const originalText = $btn.text();

    $btn.prop("disabled", true).text("Importing...");

    $.ajax({
      type: "POST",
      url: "/import/",
      data: $("#Import-Playlist-Form").serialize(),
      success: function (response) {
        console.log("Playlist imported successfully:", response);
        $("#ImportPlaylistModal").modal("hide");
        $("#Import-Playlist-Form")[0].reset();

        // Show success message
        showNotification("Playlist imported successfully!", "success");

        // Refresh playlist list if needed
        if (typeof refreshPlaylists === "function") {
          refreshPlaylists();
        }
      },
      error: function (xhr) {
        console.error("Import error:", xhr.responseText);
        showNotification(
          "Failed to import playlist. Please try again.",
          "error"
        );
      },
      complete: function () {
        $btn.prop("disabled", false).text(originalText);
      },
    });
  });

  $("#Add-Playlist-Submit").click(function (e) {
    e.preventDefault();
    const $btn = $(this);
    const originalText = $btn.text();

    // Validate form
    const playlistName = $("#playlist-name").val().trim();
    if (!playlistName) {
      showNotification("Please enter a playlist name.", "error");
      return;
    }

    $btn.prop("disabled", true).text("Creating...");

    const form = $("#Add-Playlist-Form")[0];
    const formData = new FormData(form);

    $.ajax({
      type: "POST",
      url: "/playlist/add/",
      data: formData,
      processData: false,
      contentType: false,
      success: function (response) {
        console.log("Playlist created successfully:", response);
        $("#AddPlaylistModal").modal("hide");
        $("#Add-Playlist-Form")[0].reset();

        showNotification("Playlist created successfully!", "success");

        // Refresh playlist list if needed
        if (typeof refreshPlaylists === "function") {
          refreshPlaylists();
        }
      },
      error: function (xhr) {
        console.error("Create playlist error:", xhr.responseText);
        showNotification(
          "Failed to create playlist. Please try again.",
          "error"
        );
      },
      complete: function () {
        $btn.prop("disabled", false).text(originalText);
      },
    });
  });

  // Utility function for notifications
  function showNotification(message, type = "info") {
    // Create notification element
    const notificationHtml = `
            <div class="alert alert-${
              type === "error"
                ? "danger"
                : type === "success"
                ? "success"
                : "info"
            } alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
              ${message}
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
          `;

    $("body").append(notificationHtml);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      $(".alert").fadeOut(500, function () {
        $(this).remove();
      });
    }, 5000);
  }

  // Enhanced error handling for audio loading
  window.addEventListener("unhandledrejection", function (event) {
    if (event.reason && event.reason.name === "NotAllowedError") {
      console.log("Audio autoplay prevented by browser policy");
      showNotification("Click play to start audio playback", "info");
    }
  });

  // Initialize volume control
  $("#volume-slider").on("input", function () {
    const volume = $(this).val() / 100;
    musicPlayer.setVolume(volume);
  });

  // Handle browser tab visibility changes
  document.addEventListener("visibilitychange", function () {
    // Pause music when tab becomes hidden (optional)
    if (document.hidden && musicPlayer.isPlaying) {
      // Uncomment the line below if you want to pause when tab is hidden
      // musicPlayer.$audio.pause();
    }
  });

  // Media Session API for better integration with OS media controls
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => {
      musicPlayer.$audio.play();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      musicPlayer.$audio.pause();
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      musicPlayer.playPrevious();
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      musicPlayer.playNext();
    });
  }

  // Update media session metadata when song changes
  $(document).on("play", "#audio-player", function () {
    const currentSong = musicPlayer.getCurrentSong();
    if ("mediaSession" in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title || "Unknown Title",
        artist: currentSong.artists || "Unknown Artist",
        artwork: currentSong.banner
          ? [{ src: currentSong.banner, sizes: "300x300", type: "image/jpeg" }]
          : [],
      });
    }
  });

  console.log("Enhanced Music Player initialized successfully");
});
