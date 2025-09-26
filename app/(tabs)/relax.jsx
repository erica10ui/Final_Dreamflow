import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Dimensions,
  TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Audio, Video } from 'expo-av';

export default function Relax() {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [currentTrack, setCurrentTrack] = useState({
    id: 'ocean-waves',
    title: 'Ocean Waves',
    artist: 'Nature Sounds',
    albumArt: require('../../assets/ocean.png'),
    audioFile: require('../../assets/sounds/silent-waves-instrumental-333295.mp3'),
    duration: 225, // 3:45 in seconds
    currentTime: 0
  });
  const [currentBook, setCurrentBook] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [sound, setSound] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState({});
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [shuffledPlaylist, setShuffledPlaylist] = useState([]);
  const [progress, setProgress] = useState(0.33); // 33% progress as shown in image
  
  // Video states
  const [breathingVideoStatus, setBreathingVideoStatus] = useState({});
  const [yogaVideoStatus, setYogaVideoStatus] = useState({});
  const [isBreathingPlaying, setIsBreathingPlaying] = useState(false);
  const [isYogaPlaying, setIsYogaPlaying] = useState(false);
  
  // Word Search Game states
  const [wordSearchGrid, setWordSearchGrid] = useState([]);
  const [wordSearchWords, setWordSearchWords] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const lastClickTime = useRef(0);

  // Sudoku Game states
  const [sudokuGrid, setSudokuGrid] = useState([]);
  const [sudokuSolution, setSudokuSolution] = useState([]);
  const [selectedSudokuCell, setSelectedSudokuCell] = useState(null);
  const [sudokuWon, setSudokuWon] = useState(false);
  const [showSudokuValidation, setShowSudokuValidation] = useState(false);

  // Word Scramble Game states
  const [scrambleWords, setScrambleWords] = useState([]);
  const [currentScrambleIndex, setCurrentScrambleIndex] = useState(0);
  const [scrambleInput, setScrambleInput] = useState('');
  const [scrambleScore, setScrambleScore] = useState(0);
  const [scrambleFeedback, setScrambleFeedback] = useState('');
  const [scrambleWon, setScrambleWon] = useState(false);

  // Hidden Object Game states
  const [hiddenObjects, setHiddenObjects] = useState([]);
  const [foundObjects, setFoundObjects] = useState([]);
  const [hiddenObjectWon, setHiddenObjectWon] = useState(false);
  const [selectedHiddenObject, setSelectedHiddenObject] = useState(null);

  // Double-click handler to go to main screen
  const handleDoubleClick = () => {
    const now = Date.now();
    if (now - lastClickTime.current < 500) { // 500ms double-click window
      setCurrentScreen('main');
    }
    lastClickTime.current = now;
  };

  // Audio functions
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Auto-start playing the default track when component mounts
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        
        // Auto-play the default track
        if (currentTrack && !sound) {
          await playSound(currentTrack);
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initializeAudio();
  }, []);

  // Initialize word search game when component mounts
  useEffect(() => {
    if (wordSearchGrid.length === 0) {
      initializeWordSearch();
    }
  }, []);

  // Initialize sudoku game when component mounts
  useEffect(() => {
    if (sudokuGrid.length === 0) {
      generateSudokuPuzzle();
    }
  }, []);

  // Initialize scramble game when component mounts
  useEffect(() => {
    if (scrambleWords.length === 0) {
      initializeScrambleGame();
    }
  }, []);

  // Initialize hidden object game when component mounts
  useEffect(() => {
    if (hiddenObjects.length === 0) {
      initializeHiddenObjectGame();
    }
  }, []);

  // Real-time progress tracking
  useEffect(() => {
    let interval;
    if (isPlaying && sound) {
      interval = setInterval(async () => {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.positionMillis !== null && status.durationMillis !== null) {
            const currentTime = status.positionMillis / 1000;
            const duration = status.durationMillis / 1000;
            const progressValue = duration > 0 ? currentTime / duration : 0;
            setProgress(progressValue);
            setCurrentTrack(prev => ({
              ...prev,
              currentTime: Math.floor(currentTime),
              duration: Math.floor(duration)
            }));
          }
        } catch (error) {
          console.error('Error getting audio status:', error);
        }
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, sound]);

  const playSound = async (track) => {
    try {
      console.log('Attempting to play sound:', track.title);
      
      // Stop current sound if playing
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.stopAsync();
            await sound.unloadAsync();
          }
        } catch (error) {
          console.error('Error stopping previous sound:', error);
        }
        setSound(null);
      }

      // Find track index in current playlist
      const playlist = getCurrentPlaylist();
      const trackIndex = playlist.findIndex(t => t.id === track.id);
      if (trackIndex !== -1) {
        setCurrentTrackIndex(trackIndex);
      }

      // Load and play new sound with volume control
      const { sound: newSound } = await Audio.Sound.createAsync(
        track.audioFile,
        { 
          shouldPlay: true, 
          isLooping: isRepeating
        }
      );
      
      setSound(newSound);
      setCurrentTrack({
        ...track,
        currentTime: 0,
        duration: track.duration || 225
      });
      setIsPlaying(true);
      setProgress(0);

      // Set up status update listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        setPlaybackStatus(status);
        if (status.didJustFinish && !isRepeating) {
          // Auto-play next track if not repeating
          playNextTrack();
        }
      });

      console.log('Sound loaded and playing successfully');

    } catch (error) {
      console.error('Error playing sound:', error);
      setIsPlaying(false);
      setSound(null);
      Alert.alert(
        'Audio Error', 
        `Could not play "${track.title}". The audio file may be corrupted or in an unsupported format.`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }
  };

  const pauseSound = async () => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.pauseAsync();
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Error pausing sound:', error);
      }
    }
  };

  const resumeSound = async () => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error resuming sound:', error);
      }
    }
  };

  const stopSound = async () => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
      setSound(null);
      setCurrentTrack(null);
      setIsPlaying(false);
      setPlaybackStatus({});
      setProgress(0);
    }
  };


  // Shuffle and mix functions
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const toggleShuffle = () => {
    if (isShuffled) {
      // Turn off shuffle - reset to original order
      setShuffledPlaylist([]);
      setIsShuffled(false);
    } else {
      // Turn on shuffle - create shuffled playlist
      const shuffled = shuffleArray(musicCategories);
      setShuffledPlaylist(shuffled);
      setIsShuffled(true);
    }
  };

  const toggleRepeat = () => {
    setIsRepeating(!isRepeating);
  };

  const getCurrentPlaylist = () => {
    return isShuffled ? shuffledPlaylist : musicCategories;
  };

  const playNextTrack = () => {
    const playlist = getCurrentPlaylist();
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIndex);
    playSound(playlist[nextIndex]);
  };

  const playPreviousTrack = () => {
    const playlist = getCurrentPlaylist();
    const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    playSound(playlist[prevIndex]);
  };

  const togglePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await pauseSound();
      } else {
        await resumeSound();
      }
    }
  };


  const relaxationTools = [
    {
      id: 'workout',
      title: 'Workout',
      icon: 'yoga',
      color: '#8B5CF6',
      onPress: () => setCurrentScreen('workout')
    },
    {
      id: 'playlist',
      title: 'Playlist',
      icon: 'music',
      color: '#8B5CF6',
      onPress: () => setCurrentScreen('playlist')
    },
    {
      id: 'games',
      title: 'Games',
      icon: 'puzzle',
      color: '#8B5CF6',
      onPress: () => setCurrentScreen('games')
    },
    {
      id: 'ebooks',
      title: 'E- Books',
      icon: 'book-open',
      color: '#8B5CF6',
      onPress: () => setCurrentScreen('ebooks')
    },
    {
      id: 'breathing',
      title: 'Breathing',
      icon: 'weather-windy',
      color: '#8B5CF6',
      onPress: () => setCurrentScreen('breathing')
    },
    {
      id: 'meditation',
      title: 'Meditation',
      icon: 'meditation',
      color: '#8B5CF6',
      onPress: () => setCurrentScreen('meditation')
    }
  ];

      const musicCategories = [
        {
          id: 'rainy',
          title: 'Rainy',
          image: require('../../assets/rainy.png'),
          description: 'Gentle rain sounds for relaxation',
          trackTitle: 'Rainy',
          albumArt: require('../../assets/rainy.png'),
          audioFile: require('../../assets/sounds/sleepy-rain-116521.mp3')
        },
        {
          id: 'ocean',
          title: 'Ocean Waves',
          image: require('../../assets/ocean.png'),
          description: 'Calming instrumental waves',
          trackTitle: 'Ocean Waves',
          albumArt: require('../../assets/ocean.png'),
          audioFile: require('../../assets/sounds/silent-waves-instrumental-333295.mp3')
        },
        {
          id: 'piano',
          title: 'Piano',
          image: require('../../assets/piano.png'),
          description: 'Inspirational piano melodies',
          trackTitle: 'Piano',
          albumArt: require('../../assets/piano.png'),
          audioFile: require('../../assets/sounds/soft-piano-inspiration-405221.mp3')
        },
        {
          id: 'waterfall',
          title: 'Water Falls',
          image: require('../../assets/waterflows.png'),
          description: 'Peaceful water sounds for deep meditation',
          trackTitle: 'Water Falls',
          albumArt: require('../../assets/waterflows.png'),
          audioFile: require('../../assets/sounds/calm-water-sound-meditation-402559.mp3')
        },
        {
          id: 'birds',
          title: 'Forest Birds',
          image: require('../../assets/ocean.png'),
          description: 'Peaceful forest bird sounds',
          trackTitle: 'Forest Birds',
          albumArt: require('../../assets/ocean.png'),
          audioFile: require('../../assets/sounds/birds39-forest-20772.mp3')
        },
        {
          id: 'yoga',
          title: 'Yoga',
          image: require('../../assets/piano.png'),
          description: 'Ambient pad with thunderstorm for deep meditation',
          trackTitle: 'Yoga Meditation',
          albumArt: require('../../assets/piano.png'),
          audioFile: require('../../assets/sounds/yoga-meditation-background-ambient-pad-amp-thunderstorm-361115.mp3')
        },
        {
          id: 'leaves',
          title: 'Leaves',
          image: require('../../assets/ocean.png'),
          description: 'Gentle wind through leaves for peaceful relaxation',
          trackTitle: 'Leaves Blowing',
          albumArt: require('../../assets/ocean.png'),
          audioFile: require('../../assets/sounds/leaves-blowing-190131.mp3')
        },
        {
          id: 'sleeptome',
          title: 'Deep Sleep',
          image: require('../../assets/piano.png'),
          description: 'Binaural beats for deep sleep and relaxation',
          trackTitle: 'Deep Sleep Frequencies',
          albumArt: require('../../assets/piano.png'),
          audioFile: require('../../assets/sounds/sleeptome-deep-sleep-frequencies-367362.mp3')
        }
      ];

  const gameOptions = [
    {
      id: 'wordsearch',
      title: 'Word Search',
      icon: 'magnify',
      color: '#3B82F6',
      onPress: () => {
        initializeWordSearch();
        setCurrentScreen('wordsearch');
      }
    },
    {
      id: 'sudoku',
      title: 'Sudoku',
      icon: 'grid',
      color: '#EF4444',
      onPress: () => {
        generateSudokuPuzzle();
        setCurrentScreen('sudoku');
      }
    },
    {
      id: 'scramble',
      title: 'Scramble words',
      icon: 'format-letter-case',
      color: '#10B981',
      onPress: () => {
        initializeScrambleGame();
        setCurrentScreen('scramble');
      }
    },
    {
      id: 'findthings',
      title: 'Find Things',
      icon: 'magnify-scan',
      color: '#F59E0B',
      onPress: () => {
        initializeHiddenObjectGame();
        setCurrentScreen('findthings');
      }
    }
  ];

  const workoutActivities = [
    {
      id: 'yoga',
      title: 'Yoga',
      image: '🧘‍♀️',
      description: 'Gentle yoga poses for relaxation',
      onPress: () => Alert.alert('Yoga', 'Yoga session starting soon!')
    },
    {
      id: 'workout',
      title: 'Workout',
      image: '💪',
      description: 'Light exercises to reduce stress',
      onPress: () => Alert.alert('Workout', 'Workout session starting soon!')
    }
  ];

  const ebooks = [
    {
      id: 'restful-nights-1',
      title: 'Restful Nights: Book 1',
      image: require('../../assets/restfulnights.png'),
      description: 'A guide to peaceful sleep',
      content: {
        title: 'The Dreamer\'s Guide to Restful Nights: Book 1',
        chapter: 'Chapter 1: Whispering Woods',
        story: `In the heart of the Whispering Woods, where ancient trees stood as silent guardians of forgotten dreams, a weary wanderer named Elara sought refuge from the chaos of the waking world. The forest welcomed her with open arms, its gentle rustling leaves creating a symphony of peace that seemed to echo through her very soul.

As twilight painted the sky in hues of lavender and gold, Elara found herself drawn deeper into the woods, following a path that seemed to appear only for those who truly needed rest. The air was thick with the scent of pine and the promise of tranquility, and with each step, the weight of the day began to lift from her shoulders.

It was then that she encountered the Lumphin, a mystical creature of light and shadow that dwelled in the spaces between wakefulness and sleep. With eyes that held the wisdom of countless dreams and a presence that radiated calm, the Lumphin became her guide through the realm of restful slumber.

"Come, weary traveler," the Lumphin whispered in a voice like wind through leaves. "Let me show you the secret paths to peaceful nights, where dreams become your allies and sleep becomes your sanctuary."

And so began Elara's journey into the art of restful sleep, guided by the gentle wisdom of the forest and the magical teachings of her newfound companion. In the Whispering Woods, she would discover that true rest was not merely the absence of wakefulness, but a sacred space where the soul could heal and the mind could find its natural rhythm.`
      }
    },
    {
      id: 'tale-of-insomnia',
      title: 'The Night Chronicles',
      image: require('../../assets/thenightschronicles.png'),
      description: 'Stories for bedtime',
      content: {
        title: 'The Night Chronicles: A Tale of Insomnia',
        chapter: 'Chapter 1: Midnight Whispers',
        story: `Nora lay in her bed at midnight, staring at the ceiling as the world around her slept peacefully. The silence of the night was broken only by the soft ticking of her bedside clock and the distant hum of the city below. She had been counting sheep, reciting poetry, and even trying the breathing exercises her therapist had taught her, but sleep remained elusive.

"Why can't I just sleep like everyone else?" she whispered into the darkness, her voice barely audible above the sound of her own restless thoughts. The weight of exhaustion pressed down on her like a heavy blanket, yet her mind refused to quiet.

As the hours passed, Nora found herself caught in the familiar cycle of frustration and anxiety that had become her nightly companion. She tossed and turned, her mind racing with thoughts of the day that had passed and the challenges that lay ahead. The more she tried to force sleep, the further it seemed to drift away.

It was in this moment of quiet desperation that she heard it—a faint, gentle voice that seemed to come from nowhere and everywhere at once. "You're not alone in this," it whispered, carrying with it a sense of comfort and understanding that Nora had never experienced before.

The voice was soft, like the rustling of leaves in a gentle breeze, and it filled her with a strange sense of peace. For the first time in what felt like forever, Nora felt a glimmer of hope that perhaps, just perhaps, she might find the rest she so desperately needed.`
      }
    },
    {
      id: 'ripple-effect',
      title: 'The Ripple Effect',
      image: require('../../assets/theriffle.png'),
      description: 'Mindfulness and meditation',
      content: {
        title: 'The Ripple Effect',
        chapter: 'Chapter 1: The Pebble and the Pond',
        story: `In a small village nestled between rolling hills and a crystal-clear river, there lived a young boy named Arin. Every morning, before the sun had fully risen, Arin would make his way to the riverbank with a small collection of smooth pebbles he had gathered from the shore.

He would stand at the water's edge, carefully selecting each pebble, feeling its weight and texture in his palm before tossing it into the flowing water. As each pebble broke the surface, it created a series of ripples that spread outward in perfect circles, growing larger and larger until they touched the opposite bank.

Arin's grandfather, a wise old man with kind eyes and weathered hands, would often join him at the riverbank. "Do you see how each pebble creates ripples that reach far beyond where it first touched the water?" he would ask, his voice carrying the wisdom of many years.

"Yes, Grandfather," Arin would reply, watching as the ripples continued to spread across the water's surface.

"That is how life works, my child," his grandfather would say with a gentle smile. "Every action we take, no matter how small, creates ripples that touch the lives of others in ways we may never fully understand. A kind word, a helping hand, or even a simple smile can create ripples of joy and hope that spread far beyond what we can see."

As Arin grew older, he began to understand the truth in his grandfather's words. He noticed how a simple act of kindness could brighten someone's day, and how that person might then pass that kindness on to others, creating an endless chain of positive ripples throughout the village.

One day, Arin met a young girl named Mira who had just moved to the village. She was shy and uncertain, standing alone in the schoolyard while other children played together. Remembering his grandfather's lesson about ripples, Arin approached her with a warm smile and offered to show her around the village.

That simple act of kindness created ripples that would change both their lives forever.`
      }
    },
    {
      id: 'restful-nights-2',
      title: 'Restful Nights: Book 2',
      image: require('../../assets/restfulnights.png'),
      description: 'Advanced sleep techniques',
      content: {
        title: 'The Dreamer\'s Guide to Restful Nights: Book 2',
        chapter: 'Chapter 1: The Art of Letting Go',
        story: `In the quiet hours before dawn, when the world exists in that liminal space between night and day, there exists a sacred practice known only to those who have learned to embrace the art of letting go. This is the story of how one woman discovered the power of surrender in the face of sleeplessness.

Sarah had spent years fighting against her insomnia, treating it like an enemy to be conquered rather than a teacher to be understood. She had tried every technique, every remedy, every piece of advice that well-meaning friends and family had offered. Yet sleep remained as elusive as a shadow in the moonlight.

It was during a particularly difficult night, when frustration had reached its peak and exhaustion had become her constant companion, that Sarah had a profound realization. She was trying so hard to control something that was, by its very nature, beyond her control. Sleep was not something she could force or demand—it was a gift that came when she was ready to receive it.

With this understanding, Sarah began to practice the art of letting go. Instead of fighting against her wakefulness, she began to embrace it. She would lie in bed and simply be present with whatever thoughts or feelings arose, without judgment or resistance. She learned to breathe into the discomfort, to welcome the restlessness as a part of her human experience.

Slowly, almost imperceptibly, something began to shift. The more Sarah practiced acceptance, the more peaceful her nights became. She discovered that by letting go of the need to control her sleep, she had actually created the perfect conditions for rest to naturally arise.

This is the story of how one woman learned that sometimes the greatest strength lies not in fighting against what is, but in learning to flow with the natural rhythms of life.`
      }
    }
  ];

  const renderMainScreen = () => (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <Text style={styles.headerCardTitle}>Feeling Restless?</Text>
        <Text style={styles.headerCardSubtitle}>Select a tool to help you relax.</Text>
      </View>

          {/* Quick Relaxation Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipText}>• Take 3 deep breaths when feeling stressed</Text>
              <Text style={styles.tipText}>• Listen to calming music for 5 minutes</Text>
              <Text style={styles.tipText}>• Practice gentle stretching</Text>
              <Text style={styles.tipText}>• Try progressive muscle relaxation</Text>
              <Text style={styles.tipText}>• Use aromatherapy for calming effects</Text>
            </View>
            
          </View>

          {/* Now Playing Status */}
          {currentTrack && (
            <View style={styles.nowPlayingStatus}>
              <Text style={styles.nowPlayingStatusTitle}>🎵 Now Playing</Text>
              <View style={styles.nowPlayingTrackInfo}>
                <View style={styles.nowPlayingTrackDetails}>
                  <Text style={styles.nowPlayingTrackName}>{currentTrack.title}</Text>
                  <Text style={styles.nowPlayingTrackDescription}>{currentTrack.description}</Text>
                </View>
                <View style={styles.nowPlayingControls}>
                  <TouchableOpacity 
                    style={styles.nowPlayingPlayButton}
                    onPress={togglePlayPause}
                  >
                    <MaterialCommunityIcons 
                      name={isPlaying ? "pause" : "play"} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                  
                  {isPlaying && (
                    <TouchableOpacity 
                      style={styles.nowPlayingPauseButton}
                      onPress={pauseSound}
                    >
                      <MaterialCommunityIcons name="pause" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.nowPlayingStopButton}
                    onPress={stopSound}
                  >
                    <MaterialCommunityIcons name="stop" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.nowPlayingStatusFooter}>
                <Text style={styles.nowPlayingStatusText}>
                  {isShuffled && "🔀 Shuffle"} {isRepeating && "🔁 Repeat"}
                </Text>
              </View>
            </View>
          )}


      {/* Relaxation Tools - Grid Layout */}
      <View style={styles.relaxationGridContainer}>
        {relaxationTools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={styles.relaxationGridCard}
            onPress={tool.onPress}
          >
            <View style={[styles.relaxationGridIcon, { backgroundColor: tool.color }]}>
              <MaterialCommunityIcons 
                name={tool.icon} 
                size={28} 
                color="#fff" 
              />
            </View>
            <Text style={styles.relaxationGridTitle}>{tool.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today's Mood */}
      <View style={styles.moodContainer}>
        <Text style={styles.moodTitle}>How are you feeling today?</Text>
        <View style={styles.moodOptions}>
          {['😊', '😌', '😴', '😰', '😤'].map((mood, index) => (
            <TouchableOpacity key={`mood-${mood}-${index}`} style={styles.moodButton}>
              <Text style={styles.moodEmoji}>{mood}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderPlaylistScreen = () => (
    <ScrollView 
      style={styles.playlistContainer} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.playlistScrollContent}
    >
      {/* Header with Back Button */}
      <View style={styles.playlistHeader}>
        <TouchableOpacity 
          style={styles.playlistBackButton}
          onPress={() => setCurrentScreen('main')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#8B5CF6" />
          <Text style={styles.playlistBackButtonText}>Back to Relax</Text>
        </TouchableOpacity>
      </View>

      {/* Playlist Header Card */}
      <View style={styles.playlistHeaderCard}>
        <Text style={styles.playlistTitle}>Playlist</Text>
        <Text style={styles.playlistSubtitle}>listen music to help you relax</Text>
      </View>

      {/* New Releases Section */}
      <Text style={styles.newReleasesTitle}>New releases</Text>

      {/* Music Categories - Grid Layout (All Categories) */}
      <View style={styles.musicGridContainer}>
        {musicCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.musicGridCard}
            onPress={() => {
              playSound(category);
              setCurrentScreen('nowplaying');
            }}
          >
            <Image source={category.image} style={styles.musicGridImage} resizeMode="cover" />
            <Text style={styles.musicGridTitle}>{category.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderGamesScreen = () => (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.gamesHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentScreen('main')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Relaxing Games</Text>
          <Text style={styles.headerSubtitle}>Select a game to help you relax and focus</Text>
        </View>
      </View>

      {/* Games Header Card */}
      <View style={styles.gamesHeaderCard}>
        <Text style={styles.gamesHeaderCardTitle}>Choose to Play</Text>
        <Text style={styles.gamesHeaderCardSubtitle}>Engage your mind with relaxing puzzles and games</Text>
      </View>

      {/* Games - Grid Layout */}
      <View style={styles.gamesGridContainer}>
        {gameOptions.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={styles.gameGridCard}
            onPress={game.onPress}
          >
            <View style={[styles.gameGridIcon, { backgroundColor: game.color }]}>
              <MaterialCommunityIcons 
                name={game.icon} 
                size={32} 
                color="#fff" 
              />
            </View>
            <Text style={styles.gameGridTitle}>{game.title}</Text>
            <Text style={styles.gameGridDescription}>
              {game.id === 'wordsearch' && 'Find hidden words in a grid'}
              {game.id === 'sudoku' && 'Number puzzle for mental focus'}
              {game.id === 'scramble' && 'Unscramble words to relax'}
              {game.id === 'findthings' && 'Find hidden objects'}
            </Text>
            <View style={styles.gameGridPlayButton}>
              <MaterialCommunityIcons name="play" size={16} color="#8B5CF6" />
              <Text style={styles.gameGridPlayText}>Play</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Game Features */}
      <View style={styles.gameFeaturesContainer}>
        <Text style={styles.gameFeaturesTitle}>Game Features</Text>
        <View style={styles.gameFeaturesList}>
          <View style={styles.gameFeatureItem}>
            <MaterialCommunityIcons name="brain" size={20} color="#8B5CF6" />
            <Text style={styles.gameFeatureText}>Mental Focus</Text>
          </View>
          <View style={styles.gameFeatureItem}>
            <MaterialCommunityIcons name="timer" size={20} color="#8B5CF6" />
            <Text style={styles.gameFeatureText}>Relaxing Pace</Text>
          </View>
          <View style={styles.gameFeatureItem}>
            <MaterialCommunityIcons name="trophy" size={20} color="#8B5CF6" />
            <Text style={styles.gameFeatureText}>Achievement System</Text>
          </View>
          <View style={styles.gameFeatureItem}>
            <MaterialCommunityIcons name="refresh" size={20} color="#8B5CF6" />
            <Text style={styles.gameFeatureText}>Unlimited Replays</Text>
          </View>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderWorkoutScreen = () => (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.workoutHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentScreen('main')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Workout Activities</Text>
          <Text style={styles.headerSubtitle}>Gentle exercises to help you relax</Text>
        </View>
      </View>

      {/* Workout Activities - Vertical Layout */}
      <View style={styles.workoutVerticalContainer}>
        {workoutActivities.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={styles.workoutVerticalCard}
            onPress={activity.onPress}
          >
            <View style={styles.workoutVerticalImage}>
              <Text style={styles.workoutEmoji}>{activity.image}</Text>
            </View>
            <View style={styles.workoutVerticalContent}>
              <Text style={styles.workoutVerticalTitle}>{activity.title}</Text>
              <Text style={styles.workoutVerticalDescription}>{activity.description}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderNowPlayingScreen = () => {
    const track = currentTrack || {
      id: 'ocean-waves',
      title: 'Ocean Waves',
      artist: 'Nature Sounds',
      albumArt: require('../../assets/ocean.png'),
      duration: 225,
      currentTime: 0
    };
    
    // Format time helper function
    const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds)) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <ScrollView style={styles.nowPlayingContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.nowPlayingHeader}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCurrentScreen('main')}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.nowPlayingTitle}>Now Playing</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCurrentScreen('playlist')}
          >
            <MaterialCommunityIcons name="playlist-music" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Album Art */}
        <View style={styles.albumArtContainer}>
          <View style={styles.albumArt}>
            <Image source={track.image || track.albumArt} style={styles.albumArtImage} resizeMode="cover" />
          </View>
        </View>

        {/* Track Title */}
        <Text style={styles.trackTitle}>{track.title}</Text>

        {/* Like and Share */}
        <View style={styles.likeShareContainer}>
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => setIsLiked(!isLiked)}
          >
            <MaterialCommunityIcons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={isLiked ? "#EF4444" : "#6B7280"} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <MaterialCommunityIcons name="share" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(Math.max(progress * 100, 0), 100)}%` }]} />
            <View style={[styles.progressHandle, { left: `${Math.min(Math.max(progress * 100, 0), 100)}%` }]} />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(track.currentTime || 0)}</Text>
            <Text style={styles.timeText}>{formatTime(track.duration || 225)}</Text>
          </View>
        </View>

        {/* Player Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity 
            style={[styles.controlButton, isShuffled && styles.controlButtonActive]} 
            onPress={() => setIsShuffled(!isShuffled)}
          >
            <MaterialCommunityIcons 
              name="shuffle" 
              size={28} 
              color={isShuffled ? "#8B5CF6" : "#6B7280"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={playPreviousTrack}
          >
            <MaterialCommunityIcons name="skip-previous" size={36} color="#1F2937" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playButton}
            onPress={togglePlayPause}
          >
            <MaterialCommunityIcons 
              name={isPlaying ? "pause" : "play"} 
              size={40} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={playNextTrack}
          >
            <MaterialCommunityIcons name="skip-next" size={36} color="#1F2937" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, isRepeating && styles.controlButtonActive]} 
            onPress={() => setIsRepeating(!isRepeating)}
          >
            <MaterialCommunityIcons 
              name="repeat" 
              size={28} 
              color={isRepeating ? "#8B5CF6" : "#6B7280"} 
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  const renderEBooksScreen = () => (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header with Back Button */}
      <View style={styles.ebooksHeader}>
        <TouchableOpacity 
          style={styles.ebooksBackButton}
          onPress={() => setCurrentScreen('main')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* E-Books Header Card */}
      <View style={styles.ebooksHeaderCard}>
        <Text style={styles.ebooksHeaderCardTitle}>E-Books</Text>
        <Text style={styles.ebooksHeaderCardSubtitle}>listen and read to help you relax</Text>
      </View>

      {/* New Releases Section */}
      <Text style={styles.ebooksNewReleasesTitle}>New releases</Text>

      {/* Books - Grid Layout */}
      <View style={styles.ebooksGridContainer}>
        {ebooks.map((book) => (
          <TouchableOpacity
            key={book.id}
            style={styles.ebooksGridCard}
            onPress={() => {
              setCurrentBook(book);
              setCurrentScreen('ebookreader');
            }}
          >
            <Image source={book.image} style={styles.ebooksGridImage} resizeMode="cover" />
            <Text style={styles.ebooksGridTitle}>{book.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderEBookReaderScreen = () => {
    const book = currentBook || ebooks[0]; // Default to first book if none selected
    
    return (
      <View style={styles.readerContainer}>
        {/* Header */}
        <View style={styles.readerHeader}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCurrentScreen('ebooks')}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.readerTitle}>{book.title}</Text>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialCommunityIcons name="menu" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.readerContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.bookMainTitle}>{book.content.title}</Text>
          
          <Text style={styles.chapterTitle}>{book.content.chapter}</Text>
          
          {book.content.story.split('\n\n').map((paragraph, index) => (
            <Text key={`${book.id}-paragraph-${index}`} style={styles.storyText}>
              {paragraph}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  };



  // Video functions
  const onBreathingVideoStatusUpdate = (status) => {
    setBreathingVideoStatus(status);
    if (status.didJustFinish) {
      setIsBreathingPlaying(false);
    }
  };

  const onYogaVideoStatusUpdate = (status) => {
    setYogaVideoStatus(status);
    if (status.didJustFinish) {
      setIsYogaPlaying(false);
    }
  };

  const toggleBreathingVideo = async () => {
    if (isBreathingPlaying) {
      setIsBreathingPlaying(false);
    } else {
      setIsBreathingPlaying(true);
    }
  };

  const toggleYogaVideo = async () => {
    if (isYogaPlaying) {
      setIsYogaPlaying(false);
    } else {
      setIsYogaPlaying(true);
    }
  };

  // Word Search Game Functions
  const generateRandomLetter = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[Math.floor(Math.random() * letters.length)];
  };

  const initializeWordSearch = () => {
    const words = ['SLEEP', 'DREAM', 'RELAX', 'PEACE', 'CALM'];
    const gridSize = 12;
    const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    
    // Place words in the grid
    const wordPositions = [];
    
    words.forEach(word => {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        const direction = Math.floor(Math.random() * 8); // 8 directions
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * gridSize);
        
        if (canPlaceWord(grid, word, row, col, direction, gridSize)) {
          placeWord(grid, word, row, col, direction);
          wordPositions.push({
            word,
            positions: getWordPositions(word, row, col, direction),
            found: false
          });
          placed = true;
        }
        attempts++;
      }
    });
    
    // Fill empty cells with random letters
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (grid[i][j] === '') {
          grid[i][j] = generateRandomLetter();
        }
      }
    }
    
    setWordSearchGrid(grid);
    setWordSearchWords(wordPositions);
    setFoundWords([]);
    setSelectedCells([]);
    setGameWon(false);
  };

  const canPlaceWord = (grid, word, row, col, direction, gridSize) => {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    ];
    
    const [dr, dc] = directions[direction];
    const newRow = row + (word.length - 1) * dr;
    const newCol = col + (word.length - 1) * dc;
    
    if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
      return false;
    }
    
    for (let i = 0; i < word.length; i++) {
      const r = row + i * dr;
      const c = col + i * dc;
      if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
        return false;
      }
    }
    
    return true;
  };

  const placeWord = (grid, word, row, col, direction) => {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    ];
    
    const [dr, dc] = directions[direction];
    
    for (let i = 0; i < word.length; i++) {
      const r = row + i * dr;
      const c = col + i * dc;
      grid[r][c] = word[i];
    }
  };

  const getWordPositions = (word, row, col, direction) => {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    ];
    
    const [dr, dc] = directions[direction];
    const positions = [];
    
    for (let i = 0; i < word.length; i++) {
      positions.push({
        row: row + i * dr,
        col: col + i * dc
      });
    }
    
    return positions;
  };

  const checkWordFound = (selectedCells) => {
    if (selectedCells.length < 3) return null;
    
    const selectedWord = selectedCells.map(cell => 
      wordSearchGrid[cell.row][cell.col]
    ).join('');
    
    const reversedWord = selectedWord.split('').reverse().join('');
    
    // Check against the current wordSearchWords state
    for (let wordData of wordSearchWords) {
      if (!wordData.found && 
          (wordData.word === selectedWord || wordData.word === reversedWord)) {
        return wordData;
      }
    }
    
    return null;
  };

  const handleCellPress = (row, col) => {
    if (gameWon) return;
    
    const cellKey = `${row}-${col}`;
    
    if (isSelecting) {
      if (selectedCells.length === 0) {
        setSelectedCells([{ row, col }]);
      } else {
        const lastCell = selectedCells[selectedCells.length - 1];
        const isAdjacent = Math.abs(row - lastCell.row) <= 1 && 
                          Math.abs(col - lastCell.col) <= 1 &&
                          !(row === lastCell.row && col === lastCell.col);
        
        if (isAdjacent) {
          const newSelectedCells = [...selectedCells, { row, col }];
          setSelectedCells(newSelectedCells);
          
          const foundWord = checkWordFound(newSelectedCells);
          if (foundWord) {
            setFoundWords(prev => [...prev, foundWord.word]);
            setWordSearchWords(prev => 
              prev.map(w => w.word === foundWord.word ? { ...w, found: true } : w)
            );
            setSelectedCells([]);
            setIsSelecting(false);
            
            // Check if all words are found after state update
            setTimeout(() => {
              setWordSearchWords(currentWords => {
                const allFound = currentWords.every(w => w.found);
                if (allFound) {
                  setGameWon(true);
                }
                return currentWords;
              });
            }, 100);
          }
        }
      }
    } else {
      setSelectedCells([{ row, col }]);
      setIsSelecting(true);
    }
  };

  const resetSelection = () => {
    setSelectedCells([]);
    setIsSelecting(false);
  };

  const resetGame = () => {
    initializeWordSearch();
  };

  // Sudoku Game Functions
  const generateSudokuPuzzle = () => {
    // Create a solved Sudoku grid
    const solvedGrid = Array(9).fill().map(() => Array(9).fill(0));
    
    // Fill the grid using backtracking
    const solveSudoku = (grid) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0) {
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            // Shuffle numbers for randomness
            for (let i = numbers.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
            }
            
            for (let num of numbers) {
              if (isValidSudokuMove(grid, row, col, num)) {
                grid[row][col] = num;
                if (solveSudoku(grid)) {
                  return true;
                }
                grid[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };
    
    solveSudoku(solvedGrid);
    setSudokuSolution(solvedGrid.map(row => [...row]));
    
    // Create puzzle by removing some numbers
    const puzzleGrid = solvedGrid.map(row => 
      row.map(cell => Math.random() < 0.4 ? cell : 0) // 40% chance to keep number
    );
    
    setSudokuGrid(puzzleGrid);
    setSudokuWon(false);
    setShowSudokuValidation(false);
  };

  const isValidSudokuMove = (grid, row, col, num) => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }
    
    // Check column
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }
    
    // Check 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[startRow + i][startCol + j] === num) return false;
      }
    }
    
    return true;
  };

  const handleSudokuCellPress = (row, col) => {
    if (sudokuWon) return;
    setSelectedSudokuCell({ row, col });
  };

  const handleSudokuNumberInput = (num) => {
    if (!selectedSudokuCell || sudokuWon) return;
    
    const { row, col } = selectedSudokuCell;
    const newGrid = sudokuGrid.map(row => [...row]);
    newGrid[row][col] = num;
    setSudokuGrid(newGrid);
    setSelectedSudokuCell(null);
  };

  const checkSudokuSolution = () => {
    setShowSudokuValidation(true);
    
    // Check if all cells are filled
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (sudokuGrid[row][col] === 0) {
          Alert.alert('Incomplete', 'Please fill in all empty cells first!');
          return;
        }
      }
    }
    
    // Check if solution is correct
    const isCorrect = sudokuGrid.every((row, rowIndex) => 
      row.every((cell, colIndex) => cell === sudokuSolution[rowIndex][colIndex])
    );
    
    if (isCorrect) {
      setSudokuWon(true);
      Alert.alert('Congratulations!', 'You solved the Sudoku puzzle!');
    } else {
      Alert.alert('Incorrect', 'Some numbers are wrong. Keep trying!');
    }
  };

  const resetSudokuGame = () => {
    generateSudokuPuzzle();
  };

  // Word Scramble Game Functions
  const initializeScrambleGame = () => {
    const words = [
      'SLEEP', 'DREAM', 'RELAX', 'PEACE', 'CALM', 'REST', 'QUIET', 'SERENE',
      'MEDITATE', 'BREATHE', 'FOCUS', 'MINDFUL', 'TRANQUIL', 'HARMONY', 'BALANCE'
    ];
    
    // Shuffle the words array
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    setScrambleWords(shuffledWords);
    setCurrentScrambleIndex(0);
    setScrambleInput('');
    setScrambleScore(0);
    setScrambleFeedback('');
    setScrambleWon(false);
  };

  const scrambleWord = (word) => {
    return word.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleScrambleSubmit = () => {
    if (!scrambleInput.trim()) return;
    
    const currentWord = scrambleWords[currentScrambleIndex];
    const isCorrect = scrambleInput.toUpperCase() === currentWord;
    
    if (isCorrect) {
      setScrambleScore(prev => prev + 1);
      setScrambleFeedback('Correct! 🎉');
      
      // Auto-advance to next word after 1.5 seconds
      setTimeout(() => {
        if (currentScrambleIndex + 1 < scrambleWords.length) {
          setCurrentScrambleIndex(prev => prev + 1);
          setScrambleInput('');
          setScrambleFeedback('');
        } else {
          setScrambleWon(true);
        }
      }, 1500);
    } else {
      setScrambleFeedback('Try again! ❌');
      setTimeout(() => setScrambleFeedback(''), 2000);
    }
  };

  const resetScrambleGame = () => {
    initializeScrambleGame();
  };

  // Hidden Object Game Functions
  const initializeHiddenObjectGame = () => {
    const objects = [
      { id: 1, name: 'star', icon: 'star', x: 20, y: 15, width: 40, height: 40, found: false },
      { id: 2, name: 'Heart', icon: 'heart', x: 60, y: 30, width: 35, height: 35, found: false },
      { id: 3, name: 'Moon', icon: 'weather-night', x: 80, y: 10, width: 30, height: 30, found: false },
      { id: 4, name: 'Sun', icon: 'weather-sunny', x: 10, y: 60, width: 45, height: 45, found: false },
      { id: 5, name: 'Tree', icon: 'tree', x: 70, y: 70, width: 50, height: 50, found: false },
      { id: 6, name: 'Flower', icon: 'flower', x: 30, y: 80, width: 25, height: 25, found: false },
    ];
    
    // Select 3 random objects to find
    const shuffled = [...objects].sort(() => Math.random() - 0.5);
    const objectsToFind = shuffled.slice(0, 3);
    
    setHiddenObjects(objects);
    setFoundObjects([]);
    setHiddenObjectWon(false);
    setSelectedHiddenObject(objectsToFind);
  };

  const handleObjectTap = (objectId) => {
    if (hiddenObjectWon) return;
    
    const object = hiddenObjects.find(obj => obj.id === objectId);
    if (!object) return;
    
    // Check if this object is one of the objects to find
    const isTargetObject = selectedHiddenObject?.some(target => target.id === objectId);
    
    if (isTargetObject && !object.found) {
      // Mark as found
      const updatedObjects = hiddenObjects.map(obj => 
        obj.id === objectId ? { ...obj, found: true } : obj
      );
      setHiddenObjects(updatedObjects);
      
      const newFoundObjects = [...foundObjects, object];
      setFoundObjects(newFoundObjects);
      
      // Check if all objects are found
      if (newFoundObjects.length === selectedHiddenObject.length) {
        setHiddenObjectWon(true);
      }
    }
  };

  const resetHiddenObjectGame = () => {
    initializeHiddenObjectGame();
  };

  // Breathing Screen with Video
  const renderBreathingScreen = () => {
    return (
      <ScrollView style={styles.videoContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.videoHeader}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCurrentScreen('main')}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.videoTitle}>Breathing Exercise</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Video Player */}
        <View style={styles.videoPlayerContainer}>
          <Video
            source={require('../../breathing/6189263-hd_1080_1920_25fps.mp4')}
            style={styles.videoPlayer}
            useNativeControls={false}
            resizeMode="contain"
            shouldPlay={isBreathingPlaying}
            isLooping={true}
            onPlaybackStatusUpdate={onBreathingVideoStatusUpdate}
          />
          
          {/* Video Overlay Controls */}
          <View style={styles.videoOverlay}>
            <TouchableOpacity 
              style={styles.playPauseButton}
              onPress={toggleBreathingVideo}
            >
              <MaterialCommunityIcons 
                name={isBreathingPlaying ? "pause" : "play"} 
                size={40} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Breathing Exercise</Text>
          <Text style={styles.instructionsText}>
            Follow the video guide to practice deep breathing exercises. 
            This will help you relax and reduce stress.
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  // Meditation Screen with Video (Yoga)
  const renderMeditationScreen = () => {
    return (
      <ScrollView style={styles.videoContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.videoHeader}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCurrentScreen('main')}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.videoTitle}>Yoga Meditation</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Video Player */}
        <View style={styles.videoPlayerContainer}>
          <Video
            source={require('../../yoga/41724-430090688_tiny.mp4')}
            style={styles.videoPlayer}
            useNativeControls={false}
            resizeMode="contain"
            shouldPlay={isYogaPlaying}
            isLooping={true}
            onPlaybackStatusUpdate={onYogaVideoStatusUpdate}
          />
          
          {/* Video Overlay Controls */}
          <View style={styles.videoOverlay}>
            <TouchableOpacity 
              style={styles.playPauseButton}
              onPress={toggleYogaVideo}
            >
              <MaterialCommunityIcons 
                name={isYogaPlaying ? "pause" : "play"} 
                size={40} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Yoga Meditation</Text>
          <Text style={styles.instructionsText}>
            Follow the yoga video to practice meditation and gentle movements. 
            This will help improve your flexibility and mindfulness.
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  // Word Search Game Screen
  const renderWordSearchScreen = () => {
    return (
      <ScrollView style={styles.wordSearchContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.wordSearchHeader}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setCurrentScreen('games')}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.wordSearchTitle}>Word Search</Text>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={resetGame}
            >
              <MaterialCommunityIcons name="refresh" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Game Status */}
          <View style={styles.gameStatusContainer}>
            <Text style={styles.gameStatusText}>
              Found: {foundWords.length} / {wordSearchWords.length} words
            </Text>
            {isSelecting && (
              <TouchableOpacity 
                style={styles.resetSelectionButton}
                onPress={resetSelection}
              >
                <Text style={styles.resetSelectionText}>Reset Selection</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Word List */}
          <View style={styles.wordListContainer}>
            <Text style={styles.wordListTitle}>Find these words:</Text>
            <View style={styles.wordList}>
              {wordSearchWords.map((wordData, index) => (
                <View key={index} style={styles.wordItem}>
                  <Text style={[
                    styles.wordText,
                    wordData.found && styles.foundWordText
                  ]}>
                    {wordData.word}
                  </Text>
                  {wordData.found && (
                    <MaterialCommunityIcons 
                      name="check-circle" 
                      size={20} 
                      color="#10B981" 
                    />
                  )}
                </View>
              ))}
            </View>
          </View>

      {/* Game Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.gridWrapper}>
          {wordSearchGrid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow}>
              {row.map((letter, colIndex) => {
                const isSelected = selectedCells.some(
                  cell => cell.row === rowIndex && cell.col === colIndex
                );
                const isFound = wordSearchWords.some(wordData => 
                  wordData.found && wordData.positions.some(
                    pos => pos.row === rowIndex && pos.col === colIndex
                  )
                );
                
                return (
                  <TouchableOpacity
                    key={`${rowIndex}-${colIndex}`}
                    style={[
                      styles.gridCell,
                      isSelected && styles.selectedCell,
                      isFound && styles.foundCell
                    ]}
                    onPress={() => handleCellPress(rowIndex, colIndex)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.cellText,
                      isSelected && styles.selectedCellText,
                      isFound && styles.foundCellText
                    ]}>
                      {letter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

          {/* Win Message */}
          {gameWon && (
            <View style={styles.winContainer}>
              <MaterialCommunityIcons 
                name="trophy" 
                size={60} 
                color="#F59E0B" 
              />
              <Text style={styles.winTitle}>Congratulations!</Text>
              <Text style={styles.winMessage}>You found all the words!</Text>
              <TouchableOpacity 
                style={styles.playAgainButton}
                onPress={resetGame}
              >
                <Text style={styles.playAgainText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.gameInstructionsContainer}>
            <Text style={styles.gameInstructionsTitle}>How to Play:</Text>
            <Text style={styles.gameInstructionsText}>
              • Tap letters to select them{'\n'}
              • Select adjacent letters to form words{'\n'}
              • Find all 5 words to win!{'\n'}
              • Words can be horizontal, vertical, or diagonal
            </Text>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
    );
  };

  // Sudoku Game Screen
  const renderSudokuScreen = () => {
    return (
      <ScrollView style={styles.sudokuContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.sudokuHeader}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCurrentScreen('games')}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.sudokuTitle}>Sudoku</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={resetSudokuGame}
          >
            <MaterialCommunityIcons name="refresh" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Game Status */}
        <View style={styles.sudokuStatusContainer}>
          <Text style={styles.sudokuStatusText}>
            {sudokuWon ? '🎉 Puzzle Solved!' : 'Fill in the numbers 1-9'}
          </Text>
        </View>

            {/* Sudoku Grid */}
            <View style={styles.sudokuGridContainer}>
              <View style={styles.sudokuGridWrapper}>
                <View style={styles.sudokuGrid}>
                  {sudokuGrid.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.sudokuRow}>
                      {row.map((cell, colIndex) => {
                        const isSelected = selectedSudokuCell?.row === rowIndex && 
                                         selectedSudokuCell?.col === colIndex;
                        const isPrefilled = sudokuSolution[rowIndex][colIndex] !== 0 && 
                                          sudokuGrid[rowIndex][colIndex] === sudokuSolution[rowIndex][colIndex];
                        const isCorrect = showSudokuValidation && 
                                        sudokuGrid[rowIndex][colIndex] === sudokuSolution[rowIndex][colIndex];
                        const isIncorrect = showSudokuValidation && 
                                          sudokuGrid[rowIndex][colIndex] !== 0 && 
                                          sudokuGrid[rowIndex][colIndex] !== sudokuSolution[rowIndex][colIndex];
                        
                        return (
                          <TouchableOpacity
                            key={`${rowIndex}-${colIndex}`}
                            style={[
                              styles.sudokuCell,
                              isSelected && styles.selectedSudokuCell,
                              isPrefilled && styles.prefilledSudokuCell,
                              isCorrect && styles.correctSudokuCell,
                              isIncorrect && styles.incorrectSudokuCell,
                              // Add borders for 3x3 boxes
                              rowIndex % 3 === 2 && styles.sudokuCellBottomBorder,
                              colIndex % 3 === 2 && styles.sudokuCellRightBorder,
                            ]}
                            onPress={() => handleSudokuCellPress(rowIndex, colIndex)}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.sudokuCellText,
                              isPrefilled && styles.prefilledSudokuCellText,
                              isCorrect && styles.correctSudokuCellText,
                              isIncorrect && styles.incorrectSudokuCellText,
                            ]}>
                              {cell === 0 ? '' : cell}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </View>

        {/* Number Input */}
        {selectedSudokuCell && !sudokuWon && (
          <View style={styles.numberInputContainer}>
            <Text style={styles.numberInputTitle}>Select a number:</Text>
            <View style={styles.numberInputGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <TouchableOpacity
                  key={num}
                  style={styles.numberInputButton}
                  onPress={() => handleSudokuNumberInput(num)}
                >
                  <Text style={styles.numberInputButtonText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.clearCellButton}
              onPress={() => {
                const { row, col } = selectedSudokuCell;
                const newGrid = sudokuGrid.map(row => [...row]);
                newGrid[row][col] = 0;
                setSudokuGrid(newGrid);
                setSelectedSudokuCell(null);
              }}
            >
              <Text style={styles.clearCellButtonText}>Clear Cell</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Check Solution Button */}
        <View style={styles.sudokuActionsContainer}>
          <TouchableOpacity 
            style={[styles.checkSolutionButton, sudokuWon && styles.disabledButton]}
            onPress={checkSudokuSolution}
            disabled={sudokuWon}
          >
            <MaterialCommunityIcons 
              name="check-circle" 
              size={20} 
              color={sudokuWon ? "#9CA3AF" : "#FFFFFF"} 
            />
            <Text style={[styles.checkSolutionButtonText, sudokuWon && styles.disabledButtonText]}>
              Check Solution
            </Text>
          </TouchableOpacity>
        </View>

        {/* Win Message */}
        {sudokuWon && (
          <View style={styles.sudokuWinContainer}>
            <MaterialCommunityIcons 
              name="trophy" 
              size={60} 
              color="#F59E0B" 
            />
            <Text style={styles.sudokuWinTitle}>Excellent Work!</Text>
            <Text style={styles.sudokuWinMessage}>You solved the Sudoku puzzle!</Text>
            <TouchableOpacity 
              style={styles.playAgainButton}
              onPress={resetSudokuGame}
            >
              <Text style={styles.playAgainText}>New Puzzle</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.sudokuInstructionsContainer}>
          <Text style={styles.sudokuInstructionsTitle}>How to Play:</Text>
          <Text style={styles.sudokuInstructionsText}>
            • Fill in the empty cells with numbers 1-9{'\n'}
            • Each row, column, and 3x3 box must contain all numbers 1-9{'\n'}
            • Tap a cell to select it, then choose a number{'\n'}
            • Use "Check Solution" to verify your answer
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  // Word Scramble Game Screen
  const renderScrambleScreen = () => {
    const currentWord = scrambleWords[currentScrambleIndex];
    const scrambledWord = currentWord ? scrambleWord(currentWord) : '';
    
    return (
      <ScrollView style={styles.scrambleContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.scrambleHeader}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCurrentScreen('games')}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.scrambleTitle}>Word Scramble</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={resetScrambleGame}
          >
            <MaterialCommunityIcons name="refresh" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Game Status */}
        <View style={styles.scrambleStatusContainer}>
          <Text style={styles.scrambleStatusText}>
            Score: {scrambleScore} / {scrambleWords.length}
          </Text>
          <Text style={styles.scrambleProgressText}>
            Word {currentScrambleIndex + 1} of {scrambleWords.length}
          </Text>
        </View>

        {/* Scrambled Word */}
        <View style={styles.scrambledWordContainer}>
          <Text style={styles.scrambledWordLabel}>Unscramble this word:</Text>
          <View style={styles.scrambledWordBox}>
            <Text style={styles.scrambledWordText}>{scrambledWord}</Text>
          </View>
        </View>

        {/* Input Section */}
        <View style={styles.scrambleInputContainer}>
          <Text style={styles.scrambleInputLabel}>Your answer:</Text>
          <View style={styles.scrambleInputWrapper}>
            <TextInput
              style={styles.scrambleTextInput}
              value={scrambleInput}
              onChangeText={setScrambleInput}
              placeholder="Type your answer here..."
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!scrambleWon}
            />
            <TouchableOpacity
              style={[styles.scrambleSubmitButton, !scrambleInput.trim() && styles.disabledButton]}
              onPress={handleScrambleSubmit}
              disabled={!scrambleInput.trim() || scrambleWon}
            >
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Feedback */}
        {scrambleFeedback && (
          <View style={styles.scrambleFeedbackContainer}>
            <Text style={[
              styles.scrambleFeedbackText,
              scrambleFeedback.includes('Correct') ? styles.correctFeedback : styles.incorrectFeedback
            ]}>
              {scrambleFeedback}
            </Text>
          </View>
        )}

        {/* Win Message */}
        {scrambleWon && (
          <View style={styles.scrambleWinContainer}>
            <MaterialCommunityIcons 
              name="trophy" 
              size={60} 
              color="#F59E0B" 
            />
            <Text style={styles.scrambleWinTitle}>Amazing!</Text>
            <Text style={styles.scrambleWinMessage}>
              You unscrambled all {scrambleWords.length} words!
            </Text>
            <Text style={styles.scrambleFinalScore}>
              Final Score: {scrambleScore}/{scrambleWords.length}
            </Text>
            <TouchableOpacity 
              style={styles.playAgainButton}
              onPress={resetScrambleGame}
            >
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.scrambleInstructionsContainer}>
          <Text style={styles.scrambleInstructionsTitle}>How to Play:</Text>
          <Text style={styles.scrambleInstructionsText}>
            • Unscramble the letters to form a word{'\n'}
            • Type your answer in the input field{'\n'}
            • Get it right to move to the next word{'\n'}
            • Try to solve all words for a perfect score!
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  // Hidden Object Game Screen
  const renderHiddenObjectScreen = () => {
    return (
      <ScrollView style={styles.hiddenObjectContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.hiddenObjectHeader}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCurrentScreen('games')}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.hiddenObjectTitle}>Hidden Objects</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={resetHiddenObjectGame}
          >
            <MaterialCommunityIcons name="refresh" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Game Status */}
        <View style={styles.hiddenObjectStatusContainer}>
          <Text style={styles.hiddenObjectStatusText}>
            Found: {foundObjects.length} / {selectedHiddenObject?.length || 0}
          </Text>
        </View>

        {/* Objects to Find */}
        <View style={styles.objectsToFindContainer}>
          <Text style={styles.objectsToFindTitle}>Find these objects:</Text>
          <View style={styles.objectsToFindList}>
            {selectedHiddenObject?.map((obj, index) => {
              const isFound = foundObjects.some(found => found.id === obj.id);
              return (
                <View key={obj.id} style={styles.objectToFindItem}>
                  <MaterialCommunityIcons 
                    name={isFound ? "check-circle" : "circle-outline"} 
                    size={20} 
                    color={isFound ? "#10B981" : "#6B7280"} 
                  />
                  <Text style={[
                    styles.objectToFindText,
                    isFound && styles.foundObjectText
                  ]}>
                    {obj.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Game Area */}
        <View style={styles.gameAreaContainer}>
          <View style={styles.gameAreaBackground}>
            <View style={styles.gameArea}>
              {hiddenObjects.map((obj) => (
                <TouchableOpacity
                  key={obj.id}
                  style={[
                    styles.hiddenObject,
                    {
                      left: `${obj.x}%`,
                      top: `${obj.y}%`,
                      width: obj.width,
                      height: obj.height,
                    },
                    obj.found && styles.foundHiddenObject
                  ]}
                  onPress={() => handleObjectTap(obj.id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name={obj.icon} 
                    size={obj.width * 0.6} 
                    color={obj.found ? "#10B981" : "#8B5CF6"} 
                  />
                  {obj.found && (
                    <View style={styles.foundObjectOverlay}>
                      <MaterialCommunityIcons 
                        name="check-circle" 
                        size={16} 
                        color="#10B981" 
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Win Message */}
        {hiddenObjectWon && (
          <View style={styles.hiddenObjectWinContainer}>
            <MaterialCommunityIcons 
              name="trophy" 
              size={60} 
              color="#F59E0B" 
            />
            <Text style={styles.hiddenObjectWinTitle}>Congratulations!</Text>
            <Text style={styles.hiddenObjectWinMessage}>
              You found all the hidden objects!
            </Text>
            <TouchableOpacity 
              style={styles.playAgainButton}
              onPress={resetHiddenObjectGame}
            >
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.hiddenObjectInstructionsContainer}>
          <Text style={styles.hiddenObjectInstructionsTitle}>How to Play:</Text>
          <Text style={styles.hiddenObjectInstructionsText}>
            • Look for the objects listed above{'\n'}
            • Tap on the correct objects when you find them{'\n'}
            • Found objects will be highlighted in green{'\n'}
            • Find all objects to win!
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'main':
        return renderMainScreen();
      case 'breathing':
        return renderBreathingScreen();
      case 'meditation':
        return renderMeditationScreen();
      case 'playlist':
        return renderPlaylistScreen();
      case 'games':
        return renderGamesScreen();
      case 'wordsearch':
        return renderWordSearchScreen();
      case 'sudoku':
        return renderSudokuScreen();
      case 'scramble':
        return renderScrambleScreen();
      case 'findthings':
        return renderHiddenObjectScreen();
      case 'workout':
        return renderWorkoutScreen();
      case 'nowplaying':
        return renderNowPlayingScreen();
      case 'ebooks':
        return renderEBooksScreen();
      case 'ebookreader':
        return renderEBookReaderScreen();
      default:
        return renderMainScreen();
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
      
      {/* Floating Pause Button */}
      {currentTrack && isPlaying && (
        <TouchableOpacity 
          style={styles.floatingPauseButton}
          onPress={pauseSound}
        >
          <MaterialCommunityIcons name="pause" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D5F2',
  },
  // Now Playing Screen Styles - Exact match to image
  nowPlayingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  nowPlayingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlayingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  albumArt: {
    width: 280,
    height: 280,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  albumArtImage: {
    width: '100%',
    height: '100%',
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  likeShareContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 40,
  },
  likeButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 12,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EF4444', // Pink color as shown in image
    borderRadius: 2,
  },
  progressHandle: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
    transform: [{ translateX: -8 }],
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  playerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 40,
    marginBottom: 20,
    gap: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controlButtonActive: {
    backgroundColor: '#F3E8FF',
    borderRadius: 24,
  },
  bottomSpacing: {
    height: 100,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 100,
  },
  // Header Card Styles
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  headerCardSubtitle: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },
  playlistHeaderCard: {
    backgroundColor: '#F3E8FF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  playlistTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  playlistSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  toolCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toolIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  toolsVerticalContainer: {
    marginBottom: 24,
  },
  toolVerticalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolVerticalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  toolVerticalContent: {
    flex: 1,
  },
  toolVerticalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  toolVerticalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '500',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  musicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  musicCard: {
    width: '47%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  musicImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  musicImageContent: {
    width: '100%',
    height: '100%',
  },
  musicEmoji: {
    fontSize: 32,
  },
  musicTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  searchButton: {
    padding: 8,
  },
  musicVerticalContainer: {
    marginBottom: 24,
  },
  musicVerticalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  musicVerticalImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  musicVerticalContent: {
    flex: 1,
  },
  musicVerticalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  musicVerticalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  gameCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gameIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  gamesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gamesVerticalContainer: {
    marginBottom: 24,
  },
  gameVerticalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameVerticalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  gameVerticalContent: {
    flex: 1,
  },
  gameVerticalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  gameVerticalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  workoutContainer: {
    gap: 16,
  },
  workoutCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  workoutImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  workoutEmoji: {
    fontSize: 48,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutVerticalContainer: {
    marginBottom: 24,
  },
  workoutVerticalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutVerticalImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  workoutVerticalContent: {
    flex: 1,
  },
  workoutVerticalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  workoutVerticalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  nowPlayingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  nowPlayingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlayingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  albumArt: {
    width: 280,
    height: 280,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  albumArtImage: {
    width: '100%',
    height: '100%',
  },
  albumArtEmoji: {
    fontSize: 120,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  likeShareContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 40,
  },
  likeButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '30%',
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  playerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  controlButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  bookCard: {
    width: '47%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bookCover: {
    width: 100,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  bookEmoji: {
    fontSize: 40,
  },
  bookTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 16,
  },
  ebooksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  booksVerticalContainer: {
    marginBottom: 24,
  },
  bookVerticalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookVerticalCover: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bookVerticalContent: {
    flex: 1,
  },
  bookVerticalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  bookVerticalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  readerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  readerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  readerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  readerContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  bookMainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 28,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 24,
  },
  storyText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'justify',
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4C1D95',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 20,
  },
  moodContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4C1D95',
    marginBottom: 16,
    textAlign: 'center',
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 24,
  },
  exercisesContainer: {
    gap: 16,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  exerciseDuration: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  meditationContainer: {
    gap: 16,
  },
  meditationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  meditationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  meditationContent: {
    flex: 1,
  },
  meditationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  meditationDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  meditationDuration: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 100,
  },
  breathingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  meditationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Now Playing Screen Styles
  nowPlayingContainer: {
    flex: 1,
    backgroundColor: '#E8D5F2',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  nowPlayingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  nowPlayingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerButton: {
    padding: 8,
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  albumArt: {
    width: 280,
    height: 280,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  trackInfoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  trackArtist: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 30,
  },
  additionalButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  trackDescriptionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trackDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  controlButtonActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#8B5CF6',
  },
  nowPlayingStatus: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  nowPlayingStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  nowPlayingTrackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nowPlayingTrackDetails: {
    flex: 1,
  },
  nowPlayingTrackName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  nowPlayingTrackDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  nowPlayingControls: {
    flexDirection: 'row',
    gap: 8,
  },
  nowPlayingPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nowPlayingStopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nowPlayingStatusFooter: {
    alignItems: 'center',
  },
  nowPlayingStatusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  nowPlayingPauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicControlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    gap: 12,
  },
  musicControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stopButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  musicControlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  floatingPauseButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  // Playlist Screen Styles
  playlistContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  playlistScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  playlistHeaderCard: {
    backgroundColor: '#E8D5F2',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playlistTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  playlistSubtitle: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },
  newReleasesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
  },
  musicGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  musicGridCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  musicGridImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  musicGridTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  playlistBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  playlistBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  // Relaxation Grid Styles
  relaxationGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  relaxationGridCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  relaxationGridIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  relaxationGridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  // E-Books Screen Styles
  ebooksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  ebooksBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ebooksHeaderCard: {
    backgroundColor: '#E8D5F2',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ebooksHeaderCardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  ebooksHeaderCardSubtitle: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },
  ebooksNewReleasesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  ebooksGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  ebooksGridCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  ebooksGridImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  ebooksGridTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  // Video Screen Styles
  videoContainer: {
    flex: 1,
    backgroundColor: '#E8D5F2',
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  videoPlayerContainer: {
    position: 'relative',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoPlayer: {
    width: '100%',
    height: 250,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // Word Search Game Styles
  wordSearchContainer: {
    flex: 1,
    backgroundColor: '#E8D5F2',
  },
  wordSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  wordSearchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  gameStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  gameStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  resetSelectionButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetSelectionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  wordListContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  wordListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  wordList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  wordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 6,
  },
  foundWordText: {
    textDecorationLine: 'line-through',
    color: '#10B981',
  },
  gridContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  gridCell: {
    width: 28,
    height: 28,
    margin: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCell: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
  },
  foundCell: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  cellText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedCellText: {
    color: '#FFFFFF',
  },
  foundCellText: {
    color: '#FFFFFF',
  },
  winContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  winTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  winMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  playAgainButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  playAgainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gameInstructionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gameInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  gameInstructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Sudoku Game Styles
  sudokuContainer: {
    flex: 1,
    backgroundColor: '#E8D5F2',
  },
  sudokuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  sudokuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  sudokuStatusContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sudokuStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  sudokuGridContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  sudokuGrid: {
    borderWidth: 2,
    borderColor: '#1F2937',
    borderRadius: 8,
  },
  sudokuRow: {
    flexDirection: 'row',
  },
  sudokuCell: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedSudokuCell: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
  },
  prefilledSudokuCell: {
    backgroundColor: '#F3F4F6',
  },
  correctSudokuCell: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  incorrectSudokuCell: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  sudokuCellBottomBorder: {
    borderBottomWidth: 2,
    borderBottomColor: '#1F2937',
  },
  sudokuCellRightBorder: {
    borderRightWidth: 2,
    borderRightColor: '#1F2937',
  },
  sudokuCellText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  prefilledSudokuCellText: {
    color: '#6B7280',
  },
  correctSudokuCellText: {
    color: '#FFFFFF',
  },
  incorrectSudokuCellText: {
    color: '#FFFFFF',
  },
  numberInputContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  numberInputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  numberInputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  numberInputButton: {
    width: 40,
    height: 40,
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  numberInputButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearCellButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
  },
  clearCellButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sudokuActionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  checkSolutionButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkSolutionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButtonText: {
    color: '#6B7280',
  },
  sudokuWinContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sudokuWinTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  sudokuWinMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  sudokuInstructionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sudokuInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sudokuInstructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Word Scramble Game Styles
  scrambleContainer: {
    flex: 1,
    backgroundColor: '#E8D5F2',
  },
  scrambleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  scrambleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrambleStatusContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  scrambleStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  scrambleProgressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  scrambledWordContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  scrambledWordLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  scrambledWordBox: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    minWidth: 200,
    alignItems: 'center',
  },
  scrambledWordText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 2,
  },
  scrambleInputContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scrambleInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  scrambleInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scrambleTextInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  scrambleSubmitButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scrambleFeedbackContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scrambleFeedbackText: {
    fontSize: 16,
    fontWeight: '600',
  },
  correctFeedback: {
    color: '#10B981',
  },
  incorrectFeedback: {
    color: '#EF4444',
  },
  scrambleWinContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  scrambleWinTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  scrambleWinMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  scrambleFinalScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 24,
  },
  scrambleInstructionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scrambleInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  scrambleInstructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Hidden Object Game Styles
  hiddenObjectContainer: {
    flex: 1,
    backgroundColor: '#E8D5F2',
  },
  hiddenObjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  hiddenObjectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  hiddenObjectStatusContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  hiddenObjectStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  objectsToFindContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  objectsToFindTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  objectsToFindList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  objectToFindItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  objectToFindText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
  },
  foundObjectText: {
    textDecorationLine: 'line-through',
    color: '#10B981',
  },
  gameAreaContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gameArea: {
    height: 300,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  hiddenObject: {
    position: 'absolute',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  foundHiddenObject: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  hiddenObjectWinContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  hiddenObjectWinTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  hiddenObjectWinMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  hiddenObjectInstructionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hiddenObjectInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  hiddenObjectInstructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Improved Games Screen Styles
  gamesHeaderCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  gamesHeaderCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  gamesHeaderCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  gamesGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  gameGridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  gameGridIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gameGridTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  gameGridDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  gameGridPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gameGridPlayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 4,
  },
  gameFeaturesContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gameFeaturesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  gameFeaturesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  gameFeatureText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },

  // Improved Word Search Styles
  gridWrapper: {
    alignItems: 'center',
    padding: 8,
  },
  gridCell: {
    width: 32,
    height: 32,
    margin: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCell: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  foundCell: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cellText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  selectedCellText: {
    color: '#FFFFFF',
  },
  foundCellText: {
    color: '#FFFFFF',
  },

  // Improved Sudoku Styles
  sudokuGridWrapper: {
    alignItems: 'center',
    padding: 8,
  },
  sudokuCell: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedSudokuCell: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  prefilledSudokuCell: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  correctSudokuCell: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  incorrectSudokuCell: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sudokuCellBottomBorder: {
    borderBottomWidth: 3,
    borderBottomColor: '#1F2937',
  },
  sudokuCellRightBorder: {
    borderRightWidth: 3,
    borderRightColor: '#1F2937',
  },
  sudokuCellText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  prefilledSudokuCellText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  correctSudokuCellText: {
    color: '#FFFFFF',
  },
  incorrectSudokuCellText: {
    color: '#FFFFFF',
  },

  // Improved Hidden Object Styles
  gameAreaBackground: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 2,
    borderColor: '#E0F2FE',
  },
  gameArea: {
    height: 320,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hiddenObject: {
    position: 'absolute',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  foundHiddenObject: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
  },
  foundObjectOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
