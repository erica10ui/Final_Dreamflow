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
import { useTheme } from '../../contexts/ThemeContext';

export default function Relax() {
  const { colors, isDarkMode } = useTheme();
  const [currentScreen, setCurrentScreen] = useState('main');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentBook, setCurrentBook] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState({});
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [shuffledPlaylist, setShuffledPlaylist] = useState([]);
  const [progress, setProgress] = useState(0.33); // 33% progress as shown in image
  
  // Mood tracker state
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState({});
  
  // Video states
  const [breathingVideoStatus, setBreathingVideoStatus] = useState({});
  const [yogaVideoStatus, setYogaVideoStatus] = useState({});
  const [isBreathingPlaying, setIsBreathingPlaying] = useState(false);
  const [isYogaPlaying, setIsYogaPlaying] = useState(false);
  
  // Real-time breathing states
  const [breathingPhase, setBreathingPhase] = useState('inhale'); // inhale, hold, exhale, pause
  const [breathingCount, setBreathingCount] = useState(0);
  const [breathingTimer, setBreathingTimer] = useState(0);
  const [selectedBreathingPattern, setSelectedBreathingPattern] = useState({
    inhale: 4,
    hold: 4,
    exhale: 4,
    pause: 4
  });
  const [selectedBreathingCategory, setSelectedBreathingCategory] = useState(null);
  const [breathingSessionStats, setBreathingSessionStats] = useState({
    totalTime: 0,
    totalCycles: 0,
    averageCycleTime: 0,
    startTime: null,
    endTime: null,
    phaseTimes: {
      inhale: 0,
      hold: 0,
      exhale: 0,
      pause: 0
    }
  });
  const breathingIntervalRef = useRef(null);
  
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

  // Mood selection functionality
  const handleMoodSelection = (mood) => {
    const today = new Date().toDateString();
    setSelectedMood(mood);
    setMoodHistory(prev => ({
      ...prev,
      [today]: mood
    }));
    
    // Show feedback
    Alert.alert(
      "Mood Recorded!",
      `You're feeling ${mood} today. This helps us personalize your relaxation experience.`,
      [{ text: "OK" }]
    );
  };

  // Get today's mood
  const getTodayMood = () => {
    const today = new Date().toDateString();
    return moodHistory[today] || null;
  };

  // Audio cleanup - ensure sound is stopped when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.stopAsync().catch(console.error);
        sound.unloadAsync().catch(console.error);
      }
    };
  }, [sound]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      // Force stop all audio when component unmounts
      stopSound().catch(console.error);
    };
  }, []);

  // Initialize audio settings when component mounts (without auto-play)
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
        
        // Don't auto-play - let user choose when to play
        console.log('Audio initialized - ready to play when user chooses');
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

  const loadTrack = async (track) => {
    try {
      console.log('Loading track:', track.title);
      
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

      // Check if audio file exists and is valid
      if (!track.audioFile) {
        console.log('No audio file specified for track:', track.title);
        Alert.alert(
          'Audio Not Available', 
          `Audio file for "${track.title}" is not available. This is a demo track.`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Load sound without auto-play - user must manually start
      const { sound: newSound } = await Audio.Sound.createAsync(
        track.audioFile,
        { 
          shouldPlay: false, 
          isLooping: isRepeating,
          volume: 1.0,
          rate: 1.0
        }
      );
      
      setSound(newSound);
      setCurrentTrack({
        ...track,
        currentTime: 0,
        duration: track.duration || 225
      });
      setIsPlaying(false); // Don't auto-play - user must manually start
      setProgress(0);

      // Set up status update listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status) {
          setPlaybackStatus(status);
          if (status.didJustFinish) {
            // Stop playing when track finishes - no auto-play
            setIsPlaying(false);
          }
        }
      });

      console.log('Track loaded successfully - ready to play when user chooses');

    } catch (error) {
      console.error('Error loading track:', error);
      
      // More specific error handling
      let errorMessage = 'Failed to load track. Please try again.';
      if (error.message?.includes('null') || error.message?.includes('Cannot load')) {
        errorMessage = `Audio file for "${track.title}" is not available. This is a demo track without actual audio.`;
      } else if (error.message?.includes('format')) {
        errorMessage = `Audio file for "${track.title}" is in an unsupported format.`;
      }
      
      Alert.alert('Audio Error', errorMessage, [{ text: 'OK' }]);
      setSound(null);
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  };

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

      // Check if audio file exists and is valid
      if (!track.audioFile) {
        console.log('No audio file specified for track:', track.title);
        Alert.alert(
          'Audio Not Available', 
          `Audio file for "${track.title}" is not available. This is a demo track.`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Load sound without auto-play - user must manually start
      const { sound: newSound } = await Audio.Sound.createAsync(
        track.audioFile,
        { 
          shouldPlay: false, 
          isLooping: isRepeating,
          volume: 1.0,
          rate: 1.0
        }
      );
      
      setSound(newSound);
      setCurrentTrack({
        ...track,
        currentTime: 0,
        duration: track.duration || 225
      });
      
      // Start playing immediately since this is playSound function
      try {
        await newSound.playAsync();
      setIsPlaying(true);
      setProgress(0);
      } catch (error) {
        console.error('Error playing sound:', error);
        setIsPlaying(false);
      }

      // Set up status update listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status) {
        setPlaybackStatus(status);
          if (status.didJustFinish) {
            // Stop playing when track finishes - no auto-play
            setIsPlaying(false);
          }
        }
      });

      console.log('Sound loaded and playing successfully');

    } catch (error) {
      console.error('Error playing sound:', error);
      setIsPlaying(false);
      setSound(null);
      
      // More user-friendly error message
      const errorMessage = error.message?.includes('null') || error.message?.includes('Cannot load')
        ? `Audio file for "${track.title}" is not available. This is a demo track without actual audio.`
        : `Could not play "${track.title}". The audio file may be corrupted or in an unsupported format.`;
        
      Alert.alert(
        'Audio Not Available', 
        errorMessage,
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }
  };

  const pauseSound = async () => {
    if (sound) {
      try {
        const loaded = await isSoundLoaded(sound);
        if (loaded) {
          try {
          await sound.pauseAsync();
          setIsPlaying(false);
            console.log('Sound paused successfully');
          } catch (error) {
            console.error('Error pausing sound:', error);
          }
        }
      } catch (error) {
        console.error('Error pausing sound:', error);
        // Force stop if pause fails
        await stopSound();
      }
    }
  };

  const resumeSound = async () => {
    if (sound) {
      try {
        const loaded = await isSoundLoaded(sound);
        if (loaded) {
          try {
          await sound.playAsync();
          setIsPlaying(true);
            console.log('Sound resumed successfully');
          } catch (error) {
            console.error('Error resuming sound:', error);
          }
        } else {
          console.log('Sound not loaded, cannot resume');
          Alert.alert('Error', 'Sound is not loaded. Please select a track first.');
        }
      } catch (error) {
        console.error('Error resuming sound:', error);
        Alert.alert('Error', 'Failed to play sound. Please try again.');
      }
    } else {
      Alert.alert('No Track Selected', 'Please select a music track first.');
    }
  };

  const stopSound = async () => {
    if (sound) {
      try {
        const loaded = await isSoundLoaded(sound);
        if (loaded) {
          try {
          await sound.stopAsync();
          await sound.unloadAsync();
          } catch (error) {
            console.error('Error stopping sound:', error);
          }
        }
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
    
    // Always reset state, even if sound is null
      setSound(null);
      setCurrentTrack(null);
      setIsPlaying(false);
      setPlaybackStatus({});
      setProgress(0);
    console.log('Sound stopped and state reset');
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

  // Helper function to safely check if sound is loaded
  const isSoundLoaded = async (soundObject) => {
    if (!soundObject) return false;
    try {
      const status = await soundObject.getStatusAsync();
      return status.isLoaded;
    } catch (error) {
      console.error('Error checking sound status:', error);
      return false;
    }
  };

  const playNextTrack = () => {
    const playlist = getCurrentPlaylist();
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIndex);
    // Load next track but don't auto-play - user must manually start
    loadTrack(playlist[nextIndex]);
  };

  const playPreviousTrack = () => {
    const playlist = getCurrentPlaylist();
    const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    // Load previous track but don't auto-play - user must manually start
    loadTrack(playlist[prevIndex]);
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

  // Force stop all audio - emergency stop function
  const forceStopAllAudio = async () => {
    try {
      // Stop all expo-av sounds
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
      
      // Reset all state
      setSound(null);
      setCurrentTrack(null);
      setIsPlaying(false);
      setPlaybackStatus({});
      setProgress(0);
      
      console.log('All audio force stopped');
    } catch (error) {
      console.error('Error force stopping audio:', error);
    }
  };


  const relaxationTools = [
    {
      id: 'workout',
      title: 'Workout',
      icon: 'yoga',
      color: '#9B70D8',
      onPress: () => setCurrentScreen('workout')
    },
    {
      id: 'playlist',
      title: 'Playlist',
      icon: 'music',
      color: '#9B70D8',
      onPress: () => setCurrentScreen('playlist')
    },
    {
      id: 'games',
      title: 'Games',
      icon: 'puzzle',
      color: '#9B70D8',
      onPress: () => setCurrentScreen('games')
    },
    {
      id: 'ebooks',
      title: 'E- Books',
      icon: 'book-open',
      color: '#9B70D8',
      onPress: () => setCurrentScreen('ebooks')
    },
    {
      id: 'breathing',
      title: 'Breathing',
      icon: 'weather-windy',
      color: '#9B70D8',
      onPress: () => setCurrentScreen('breathing')
    },
    {
      id: 'meditation',
      title: 'Meditation',
      icon: 'meditation',
      color: '#9B70D8',
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
        },
        {
          id: 'calm-ocean-breeze',
          title: 'Ocean Breeze',
          image: require('../../assets/ocean.png'),
          description: 'Gentle ocean breeze sounds',
          trackTitle: 'Calm Ocean Breeze',
          albumArt: require('../../assets/ocean.png'),
          audioFile: require('../../assets/sounds/calm-ocean-breeze-325556.mp3')
        },
        {
          id: 'chimes',
          title: 'Healing Chimes',
          image: require('../../assets/breath.png'),
          description: 'Peaceful chime sounds for meditation',
          trackTitle: 'Healing Chimes',
          albumArt: require('../../assets/breath.png'),
          audioFile: require('../../assets/sounds/chimes.mp3')
        },
        {
          id: 'peaceful-sleep',
          title: 'Peaceful Sleep',
          image: require('../../assets/rainy.png'),
          description: 'Deep sleep and relaxation sounds',
          trackTitle: 'Peaceful Sleep',
          albumArt: require('../../assets/rainy.png'),
          audioFile: require('../../assets/sounds/peaceful-sleep-188311.mp3')
        },
        {
          id: 'relaxing-rain',
          title: 'Relaxing Rain',
          image: require('../../assets/rainy.png'),
          description: 'Soft ambient rain with music',
          trackTitle: 'Relaxing Rain Music',
          albumArt: require('../../assets/rainy.png'),
          audioFile: require('../../assets/sounds/relaxing-sleep-music-with-soft-ambient-rain-369762.mp3')
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
    },
    {
      id: 'moonlight-meditation',
      title: 'Moonlight Meditation',
      image: require('../../assets/meditation.png'),
      description: 'Guided meditation for deep sleep',
      content: {
        title: 'Moonlight Meditation: A Journey to Serenity',
        chapter: 'Chapter 1: The Silver Path',
        story: `Beneath the gentle glow of a full moon, where shadows dance in harmony with starlight, there exists a sacred space where the mind finds its natural rhythm and the soul discovers its deepest peace. This is the story of the Moonlight Meditation, a timeless practice that has guided countless souls to the shores of restful slumber.

In a small cottage nestled at the edge of an ancient forest, lived an old woman named Luna, whose silver hair caught the moonlight like threads of starlight. She had spent decades perfecting the art of moonlit meditation, learning to harness the gentle energy of the night sky to bring peace to troubled minds.

Every evening, as the sun dipped below the horizon and the first stars began to twinkle, Luna would sit by her window, her eyes closed, her breathing slow and steady. She would imagine herself walking along a silver path that led deep into the heart of the forest, where the trees whispered ancient secrets and the air hummed with the energy of a thousand peaceful dreams.

"Follow the silver path," she would whisper to those who came seeking her wisdom. "Let the moonlight guide you to a place where worries dissolve like morning mist, and where your mind can finally rest in the embrace of the night."

The path would lead to a clearing where a crystal-clear pond reflected the moon's face, creating ripples of light that seemed to carry away all the day's troubles. Here, in this sacred space, the mind would find its natural rhythm, breathing in harmony with the gentle pulse of the universe.

As the meditation deepened, the practitioner would feel their body growing lighter, their thoughts becoming clearer, and their spirit finding the peace that had eluded them throughout the day. The moonlight would wrap around them like a soft blanket, carrying them gently into the realm of dreams.

This is the power of the Moonlight Meditation—a practice that transforms the simple act of breathing into a sacred journey, leading the soul to the peaceful shores of restful sleep.`
      }
    },
    {
      id: 'dream-garden',
      title: 'The Dream Garden',
      image: require('../../assets/ocean.png'),
      description: 'A peaceful garden of dreams',
      content: {
        title: 'The Dream Garden: Where Sleep Blossoms',
        chapter: 'Chapter 1: The Seeds of Sleep',
        story: `In a hidden valley where time moves as gently as a summer breeze, there grows a garden unlike any other—a garden where dreams are planted like seeds and sleep blooms like the most beautiful flowers. This is the Dream Garden, a place where weary souls come to find the rest they so desperately need.

The garden is tended by a gentle gardener named Flora, whose hands have never known the harshness of the waking world. She moves through the rows of dream flowers with the grace of a dancer, her touch so light that even the most delicate blossoms remain undisturbed.

Each flower in the Dream Garden represents a different type of peaceful sleep. There are the lavender fields that bring gentle dreams, the jasmine vines that weave stories of faraway lands, and the chamomile patches that soothe the most restless minds. But the most precious of all are the moonflowers, which bloom only at night and carry the essence of deep, restorative sleep.

"Every dream begins with a single seed," Flora would tell visitors to her garden. "Plant your worries in the earth, water them with your breath, and watch as they transform into the most beautiful flowers of peace."

As visitors walk through the garden, they begin to feel their tension melting away like morning dew. The sweet fragrance of the flowers fills their senses, and the gentle rustling of leaves in the evening breeze creates a natural lullaby that soothes their racing thoughts.

In the center of the garden stands an ancient oak tree, its branches reaching toward the stars like fingers pointing to the realm of dreams. Beneath its canopy, visitors find a soft bed of moss where they can lie down and let the garden work its magic.

As they close their eyes, they can feel the garden's energy flowing through them, carrying away their stress and replacing it with a deep sense of calm. The flowers seem to whisper gentle words of encouragement, and the tree's branches sway in a rhythm that matches the natural pulse of sleep.

This is the magic of the Dream Garden—a place where sleep is not forced but invited, where rest comes naturally like the blooming of a flower, and where every visitor leaves carrying the seeds of peaceful dreams that will bloom in their own hearts.`
      }
    }
  ];

  // Stars Background Component (shinning stars with crescent emoji)
  const renderStars = () => {
    if (!isDarkMode) return null;
    
    return (
      <View style={styles.nightSkyContainer}>
        {/* Crescent Emoji */}
        <View style={styles.crescentContainer}>
          <Text style={styles.crescentEmoji}>🌙</Text>
        </View>
        
        {/* Shinning Stars */}
        {[...Array(20)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.star,
              {
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                opacity: Math.random() * 0.8 + 0.2,
              }
            ]}
          />
        ))}
      </View>
    );
  };

  const renderMainScreen = () => (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {renderStars()}
      {/* Header Card */}
      <View style={[styles.headerCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <View style={styles.headerCardContent}>
          <View style={[styles.headerCardIcon, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="leaf" size={32} color={colors.primary} />
      </View>
          <View style={styles.headerCardText}>
            <Text style={[styles.headerCardTitle, { color: colors.text }]}>Ready to Relax?</Text>
            <Text style={[styles.headerCardSubtitle, { color: colors.textSecondary }]}>Choose from 6 proven relaxation techniques designed to help you unwind and sleep better.</Text>
            </View>
        </View>
          </View>

      {/* Relaxation Techniques Grid */}
      <View style={styles.relaxationTechniquesGrid}>
        {/* Music Therapy */}
        <TouchableOpacity style={[styles.techniqueCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]} onPress={() => setCurrentScreen('playlist')}>
          <View style={styles.techniqueImageContainer}>
            <Image source={require('../../assets/ocean.png')} style={styles.techniqueImage} />
                </View>
          <View style={styles.techniqueContent}>
            <Text style={[styles.techniqueTitle, { color: colors.text }]}>Music Therapy</Text>
            <Text style={[styles.techniqueSubtitle, { color: colors.textSecondary }]}>Sleep & Relaxation</Text>
            <Text style={[styles.techniqueDescription, { color: colors.textSecondary }]}>6 curated tracks</Text>
            <Text style={styles.techniqueDuration}>8-35 min sessions</Text>
          </View>
                  </TouchableOpacity>
                  
        {/* Meditation */}
        <TouchableOpacity style={[styles.techniqueCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]} onPress={() => setCurrentScreen('meditation')}>
          <View style={styles.techniqueImageContainer}>
            <Image source={require('../../assets/meditation.png')} style={styles.techniqueImage} />
          </View>
          <View style={styles.techniqueContent}>
            <Text style={[styles.techniqueTitle, { color: colors.text }]}>Meditation</Text>
            <Text style={[styles.techniqueSubtitle, { color: colors.textSecondary }]}>Mindfulness Practice</Text>
            <Text style={[styles.techniqueDescription, { color: colors.textSecondary }]}>8 guided sessions</Text>
            <Text style={styles.techniqueDuration}>5-20 min each</Text>
          </View>
                    </TouchableOpacity>

        {/* Breathing */}
        <TouchableOpacity style={[styles.techniqueCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]} onPress={() => setCurrentScreen('breathing')}>
          <View style={styles.techniqueImageContainer}>
            <Image source={require('../../assets/breath.png')} style={styles.techniqueImage} />
          </View>
          <View style={styles.techniqueContent}>
            <Text style={[styles.techniqueTitle, { color: colors.text }]}>Breathing</Text>
            <Text style={[styles.techniqueSubtitle, { color: colors.textSecondary }]}>4-7-8 Technique</Text>
            <Text style={[styles.techniqueDescription, { color: colors.textSecondary }]}>Instant calm</Text>
            <Text style={styles.techniqueDuration}>2-5 min sessions</Text>
          </View>
                  </TouchableOpacity>

        {/* Yoga */}
        <TouchableOpacity style={[styles.techniqueCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]} onPress={() => setCurrentScreen('workout')}>
          <View style={styles.techniqueImageContainer}>
            <Image source={require('../../assets/yoga.png')} style={styles.techniqueImage} />
                </View>
          <View style={styles.techniqueContent}>
            <Text style={[styles.techniqueTitle, { color: colors.text }]}>Yoga</Text>
            <Text style={[styles.techniqueSubtitle, { color: colors.textSecondary }]}>Gentle Stretches</Text>
            <Text style={[styles.techniqueDescription, { color: colors.textSecondary }]}>5 poses</Text>
            <Text style={styles.techniqueDuration}>10-15 min flow</Text>
              </View>
        </TouchableOpacity>

        {/* Games */}
        <TouchableOpacity style={[styles.techniqueCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => setCurrentScreen('games')}>
          <View style={styles.techniqueImageContainer}>
            <Image source={require('../../assets/egames.png')} style={styles.techniqueImage} />
              </View>
          <View style={styles.techniqueContent}>
            <Text style={[styles.techniqueTitle, { color: colors.text }]}>Games</Text>
            <Text style={[styles.techniqueSubtitle, { color: colors.textSecondary }]}>Brain Training</Text>
            <Text style={[styles.techniqueDescription, { color: colors.textSecondary }]}>4 puzzle games</Text>
            <Text style={[styles.techniqueDuration, { color: colors.textMuted }]}>5-10 min each</Text>
            </View>
        </TouchableOpacity>

        {/* E-Books */}
        <TouchableOpacity style={[styles.techniqueCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => setCurrentScreen('ebooks')}>
          <View style={styles.techniqueImageContainer}>
            <Image source={require('../../assets/ebooks.png')} style={styles.techniqueImage} />
            </View>
          <View style={styles.techniqueContent}>
            <Text style={[styles.techniqueTitle, { color: colors.text }]}>E-Books</Text>
            <Text style={[styles.techniqueSubtitle, { color: colors.textSecondary }]}>Sleep Stories</Text>
            <Text style={[styles.techniqueDescription, { color: colors.textSecondary }]}>4 bedtime stories</Text>
            <Text style={[styles.techniqueDuration, { color: colors.textMuted }]}>10-20 min read</Text>
          </View>
          </TouchableOpacity>
      </View>


      {/* Mood Tracker Section */}
      <View style={styles.moodTrackerSection}>
        <View style={[styles.moodTrackerCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.moodTrackerTitle, { color: colors.text }]}>How are you feeling today?</Text>
        <View style={styles.moodOptions}>
            {[
              { emoji: '😊', label: 'Happy', value: 'happy' },
              { emoji: '😌', label: 'Calm', value: 'calm' },
              { emoji: '😴', label: 'Sleepy', value: 'sleepy' },
              { emoji: '😰', label: 'Anxious', value: 'anxious' },
              { emoji: '😤', label: 'Stressed', value: 'stressed' }
            ].map((mood, index) => (
              <TouchableOpacity 
                key={`mood-${mood.value}-${index}`} 
                style={[
                  styles.moodButton,
                  { backgroundColor: colors.primaryLight },
                  getTodayMood() === mood.value && { backgroundColor: colors.primary }
                ]}
                onPress={() => handleMoodSelection(mood.value)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            </TouchableOpacity>
          ))}
          </View>
          {getTodayMood() && (
            <Text style={styles.moodStatus}>
              Today's mood: {getTodayMood().charAt(0).toUpperCase() + getTodayMood().slice(1)}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderPlaylistScreen = () => (
    <ScrollView 
      style={[styles.playlistContainer, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.playlistScrollContent}
    >
      {renderStars()}
      {/* Header with Back Button */}
      <View style={styles.videoHeader}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setCurrentScreen('main')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.videoTitle, { color: colors.text }]}>Music Therapy</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Playlist Header Card */}
      <View style={[styles.playlistHeaderCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <View style={[styles.playlistHeaderIcon, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
          <MaterialCommunityIcons name="music-circle" size={36} color={colors.primary} />
        </View>
        <View style={styles.playlistHeaderText}>
          <Text style={[styles.playlistTitle, { color: colors.text }]}>Music Therapy</Text>
          <Text style={[styles.playlistSubtitle, { color: colors.textSecondary }]}>Healing sounds for your mind and soul</Text>
        </View>
      </View>

      {/* Music Categories Section */}
      <Text style={[styles.newReleasesTitle, { color: colors.text }]}>Therapeutic Sounds</Text>

      {/* Music Categories - Grid Layout (All Categories) */}
      <View style={[styles.musicGridContainer, { backgroundColor: colors.primaryLight }]}>
        {musicCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.musicGridCard, { backgroundColor: colors.surface, shadowColor: colors.shadow, borderColor: colors.border }]}
            onPress={() => {
              loadTrack(category);
              setCurrentScreen('nowplaying');
            }}
          >
            <View style={styles.musicGridImageContainer}>
            <Image source={category.image} style={styles.musicGridImage} resizeMode="cover" />
              <View style={[styles.musicGridOverlay, { backgroundColor: `rgba(155, 112, 216, 0.4)` }]}>
                <View style={styles.playIconContainer}>
                  <MaterialCommunityIcons name="play" size={24} color="#FFFFFF" />
                </View>
              </View>
            </View>
            <View style={styles.musicGridContent}>
            <Text style={[styles.musicGridTitle, { color: colors.text }]}>{category.title}</Text>
              <Text style={[styles.musicGridDescription, { color: colors.textSecondary }]}>{category.description}</Text>
              <View style={[styles.musicGridPlayButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <MaterialCommunityIcons name="play" size={16} color={colors.primary} />
                <Text style={[styles.musicGridPlayText, { color: colors.primary }]}>Play</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderGamesScreen = () => (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {renderStars()}
      {/* Header */}
      <View style={styles.videoHeader}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setCurrentScreen('main')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.videoTitle, { color: colors.text }]}>Relaxing Games</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Games Header Card */}
      <View style={[styles.gamesHeaderCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <Text style={[styles.gamesHeaderCardTitle, { color: colors.text }]}>Choose to Play</Text>
        <Text style={[styles.gamesHeaderCardSubtitle, { color: colors.textSecondary }]}>Engage your mind with relaxing puzzles and games</Text>
      </View>

      {/* Games - Grid Layout */}
      <View style={styles.gamesGridContainer}>
        {gameOptions.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[styles.gameGridCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={game.onPress}
          >
            <View style={[styles.gameGridIcon, { backgroundColor: game.color }]}>
              <MaterialCommunityIcons 
                name={game.icon} 
                size={32} 
                color="#fff" 
              />
            </View>
            <Text style={[styles.gameGridTitle, { color: colors.text }]}>{game.title}</Text>
            <Text style={[styles.gameGridDescription, { color: colors.textSecondary }]}>
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
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.videoHeader}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setCurrentScreen('main')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.videoTitle, { color: colors.text }]}>Workout Activities</Text>
        <View style={styles.headerButton} />
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
      <ScrollView style={[styles.nowPlayingContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.nowPlayingHeader}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCurrentScreen('main')}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#9B70D8" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.nowPlayingTitle}>Now Playing</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCurrentScreen('playlist')}
          >
            <MaterialCommunityIcons name="playlist-music" size={24} color="#9B70D8" />
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
              color={isShuffled ? "#9B70D8" : "#6B7280"} 
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
              size={44} 
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
              color={isRepeating ? "#9B70D8" : "#6B7280"} 
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
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {renderStars()}
      {/* Header with Back Button */}
      <View style={styles.videoHeader}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setCurrentScreen('main')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.videoTitle, { color: colors.text }]}>E-Books</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Spacing */}
      <View style={{ height: 20 }} />

      {/* E-Books Header Card - Journal Style */}
      <View style={[styles.ebooksHeaderCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <View style={styles.ebooksHeaderContent}>
          <View style={[styles.ebooksHeaderIcon, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="book-open-variant" size={32} color={colors.primary} />
          </View>
          <View style={styles.ebooksHeaderText}>
            <Text style={[styles.ebooksHeaderCardTitle, { color: colors.text }]}>Sleep Stories</Text>
            <Text style={[styles.ebooksHeaderCardSubtitle, { color: colors.textSecondary }]}>Listen and read to help you relax and fall asleep</Text>
          </View>
        </View>
      </View>

      {/* New Releases Section */}
      <Text style={[styles.ebooksNewReleasesTitle, { color: colors.text }]}>New releases</Text>

      {/* Books - Grid Layout */}
      <View style={styles.ebooksGridContainer}>
        {ebooks.map((book) => (
          <TouchableOpacity
            key={book.id}
            style={[styles.ebooksGridCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => {
              setCurrentBook(book);
              setCurrentScreen('ebookreader');
            }}
          >
            <Image source={book.image} style={styles.ebooksGridImage} resizeMode="cover" />
            <Text style={[styles.ebooksGridTitle, { color: colors.text }]}>{book.title}</Text>
            <Text style={[styles.ebooksGridDescription, { color: colors.textSecondary }]}>{book.description}</Text>
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
            <MaterialCommunityIcons name="arrow-left" size={24} color="#9B70D8" />
          </TouchableOpacity>
          <Text style={styles.readerTitle}>{book.title}</Text>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialCommunityIcons name="menu" size={24} color="#9B70D8" />
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

  // Real-time breathing functions
  const startBreathingExercise = (pattern, category = null) => {
    // Stop any existing breathing exercise first
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
      breathingIntervalRef.current = null;
    }
    
    // Reset all breathing states
    setBreathingPhase('inhale');
    setBreathingCount(0);
    setBreathingTimer(0);
    setIsBreathingPlaying(false);
    
    // Set the new pattern and category
    setSelectedBreathingPattern(pattern);
    setSelectedBreathingCategory(category);
    
    // Initialize session stats
    const startTime = new Date();
    setBreathingSessionStats({
      totalTime: 0,
      totalCycles: 0,
      averageCycleTime: 0,
      startTime: startTime,
      endTime: null,
      phaseTimes: {
        inhale: 0,
        hold: 0,
        exhale: 0,
        pause: 0
      }
    });
    
    // Start the breathing cycle
    setIsBreathingPlaying(true);
    breathingIntervalRef.current = setInterval(() => {
      setBreathingTimer(prev => {
        const newTimer = prev + 1;
        const { inhale, hold, exhale, pause } = pattern;
        
        // Update session stats
        setBreathingSessionStats(prevStats => ({
          ...prevStats,
          totalTime: prevStats.totalTime + 1,
          phaseTimes: {
            ...prevStats.phaseTimes,
            [breathingPhase]: prevStats.phaseTimes[breathingPhase] + 1
          }
        }));
        
        if (newTimer <= inhale) {
          setBreathingPhase('inhale');
        } else if (newTimer <= inhale + hold) {
          setBreathingPhase('hold');
        } else if (newTimer <= inhale + hold + exhale) {
          setBreathingPhase('exhale');
        } else if (newTimer <= inhale + hold + exhale + pause) {
          setBreathingPhase('pause');
        } else {
          // Complete cycle, start over
          setBreathingCount(prev => {
            const newCount = prev + 1;
            const cycleTime = inhale + hold + exhale + pause;
            
            // Update cycle statistics
            setBreathingSessionStats(prevStats => ({
              ...prevStats,
              totalCycles: newCount,
              averageCycleTime: (prevStats.totalTime / newCount).toFixed(1)
            }));
            
            return newCount;
          });
          return 0;
        }
        
        return newTimer;
      });
    }, 1000); // Update every second
  };

  const stopBreathingExercise = () => {
    setIsBreathingPlaying(false);
    setBreathingPhase('inhale');
    setBreathingCount(0);
    setBreathingTimer(0);
    
    // Finalize session stats
    setBreathingSessionStats(prevStats => ({
      ...prevStats,
      endTime: new Date()
    }));
    
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
      breathingIntervalRef.current = null;
    }
  };

  const resetBreathingState = () => {
    // Stop any running breathing exercise
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
      breathingIntervalRef.current = null;
    }
    
    // Reset all breathing states
    setIsBreathingPlaying(false);
    setBreathingPhase('inhale');
    setBreathingCount(0);
    setBreathingTimer(0);
    
    // Reset session stats
    setBreathingSessionStats({
      totalTime: 0,
      totalCycles: 0,
      averageCycleTime: 0,
      startTime: null,
      endTime: null,
      phaseTimes: {
        inhale: 0,
        hold: 0,
        exhale: 0,
        pause: 0
      }
    });
  };

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      case 'pause':
        return 'Rest';
      default:
        return 'Ready';
    }
  };

  const getBreathingSubInstruction = () => {
    const { inhale, hold, exhale, pause } = selectedBreathingPattern;
    const remaining = getRemainingTime();
    
    switch (breathingPhase) {
      case 'inhale':
        return `Inhale for ${remaining} more seconds`;
      case 'hold':
        return `Hold for ${remaining} more seconds`;
      case 'exhale':
        return `Exhale for ${remaining} more seconds`;
      case 'pause':
        return `Rest for ${remaining} more seconds`;
      default:
        return 'Tap to start breathing';
    }
  };

  const getRemainingTime = () => {
    const { inhale, hold, exhale, pause } = selectedBreathingPattern;
    const totalCycleTime = inhale + hold + exhale + pause;
    const currentPhaseTime = breathingTimer % totalCycleTime;
    
    switch (breathingPhase) {
      case 'inhale':
        return inhale - currentPhaseTime;
      case 'hold':
        return inhale + hold - currentPhaseTime;
      case 'exhale':
        return inhale + hold + exhale - currentPhaseTime;
      case 'pause':
        return totalCycleTime - currentPhaseTime;
      default:
        return 0;
    }
  };

  const getBreathingScale = () => {
    const { inhale, hold, exhale, pause } = selectedBreathingPattern;
    const totalCycleTime = inhale + hold + exhale + pause;
    const currentPhaseTime = breathingTimer % totalCycleTime;
    
    switch (breathingPhase) {
      case 'inhale':
        return 0.7 + (0.6 * (currentPhaseTime / inhale));
      case 'hold':
        return 1.3;
      case 'exhale':
        return 1.3 - (0.6 * ((currentPhaseTime - inhale - hold) / exhale));
      case 'pause':
        return 0.7;
      default:
        return 0.7;
    }
  };

  const getBreathingPhaseColor = () => {
    switch (breathingPhase) {
      case 'inhale':
        return '#10B981'; // Green for inhale
      case 'hold':
        return '#F59E0B'; // Orange for hold
      case 'exhale':
        return '#EF4444'; // Red for exhale
      case 'pause':
        return '#6B7280'; // Gray for pause
      default:
        return '#9B70D8'; // Purple default
    }
  };

  // Cleanup breathing interval and audio on unmount
  useEffect(() => {
    return () => {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
      }
      resetBreathingState();
      
      // Cleanup audio
      if (sound) {
        sound.unloadAsync().catch(console.error);
      }
    };
  }, []);

  // Reset breathing state and stop audio when switching screens
  useEffect(() => {
    if (currentScreen !== 'breathing-exercise') {
      resetBreathingState();
    }
    
    // Stop audio when leaving music screens
    if (currentScreen !== 'nowplaying' && currentScreen !== 'playlist') {
      if (sound) {
        stopSound();
      }
    }
  }, [currentScreen]);

  // Dedicated Breathing Exercise Screen with Detailed Statistics
  const renderBreathingExerciseScreen = () => {
    if (!selectedBreathingCategory) {
      return renderBreathingScreen();
    }

    // Initialize the breathing pattern from the selected category
    const currentPattern = selectedBreathingCategory.pattern || selectedBreathingPattern;

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getSessionDuration = () => {
      if (!breathingSessionStats.startTime) return '0:00';
      const endTime = breathingSessionStats.endTime || new Date();
      const duration = Math.floor((endTime - breathingSessionStats.startTime) / 1000);
      return formatTime(duration);
    };

    return (
      <ScrollView 
        style={styles.breathingExerciseContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.breathingScrollContent}
      >
        {/* Header with Back Button */}
        <View style={styles.breathingHeader}>
          <TouchableOpacity 
            style={styles.breathingBackButton}
            onPress={() => {
              resetBreathingState();
              setCurrentScreen('breathing');
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#9B70D8" />
            <Text style={styles.breathingBackButtonText}>Back to Breathing</Text>
          </TouchableOpacity>
        </View>

        {/* Category Header */}
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIconContainer, { backgroundColor: selectedBreathingCategory.color }]}>
            <MaterialCommunityIcons name={selectedBreathingCategory.icon} size={40} color="#FFFFFF" />
          </View>
          <View style={styles.categoryHeaderText}>
            <Text style={styles.categoryTitle}>{selectedBreathingCategory.title}</Text>
            <Text style={styles.categoryDescription}>{selectedBreathingCategory.description}</Text>
            <View style={styles.categoryInfoRow}>
              <View style={styles.categoryInfoBadge}>
                <Text style={styles.categoryInfoText}>{selectedBreathingCategory.difficulty}</Text>
              </View>
              <View style={styles.categoryInfoBadge}>
                <Text style={styles.categoryInfoText}>{selectedBreathingCategory.duration}</Text>
              </View>
              <View style={[styles.categoryInfoBadge, { backgroundColor: selectedBreathingCategory.color }]}>
                <Text style={[styles.categoryInfoText, { color: '#FFFFFF' }]}>{selectedBreathingCategory.specialFeature}</Text>
              </View>
            </View>
            <Text style={styles.categoryPattern}>
              Pattern: {currentPattern.inhale}-{currentPattern.hold}-{currentPattern.exhale}
              {currentPattern.pause > 0 ? `-${currentPattern.pause}` : ''}
            </Text>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Benefits</Text>
          <View style={styles.benefitsList}>
            {selectedBreathingCategory.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color={selectedBreathingCategory.color} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
          </View>

        {/* Breathing Visualization */}
        <View style={styles.exerciseBreathingVisualization}>
          {/* Background Circles */}
          <View style={[styles.exerciseBgCircle1, { 
            transform: [{ scale: getBreathingScale() * 0.8 }],
            opacity: isBreathingPlaying ? 0.15 : 0.05
          }]} />
          <View style={[styles.exerciseBgCircle2, { 
            transform: [{ scale: getBreathingScale() * 1.1 }],
            opacity: isBreathingPlaying ? 0.1 : 0.03
          }]} />
          
          {/* Main Breathing Orb */}
          <View style={[styles.exerciseBreathingOrb, { 
            transform: [{ scale: getBreathingScale() }],
            backgroundColor: isBreathingPlaying ? getBreathingPhaseColor() : '#E8F4FD'
          }]}>
            <View style={[styles.exerciseOrbGlow, { 
              backgroundColor: isBreathingPlaying ? getBreathingPhaseColor() : '#E8F4FD',
              opacity: 0.3
            }]} />
            
            <View style={styles.exerciseOrbContent}>
              <MaterialCommunityIcons 
                name={
                  breathingPhase === 'inhale' ? "arrow-up-bold" :
                  breathingPhase === 'hold' ? "pause-circle" :
                  breathingPhase === 'exhale' ? "arrow-down-bold" :
                  breathingPhase === 'pause' ? "circle-outline" : "play-circle"
                } 
                size={isBreathingPlaying ? 56 : 40} 
                color={isBreathingPlaying ? "#FFFFFF" : "#9B70D8"} 
              />
            </View>
          </View>
          </View>

        {/* Instructions */}
        <View style={styles.exerciseInstructionsContainer}>
          <Text style={styles.exerciseInstructionText}>
            {getBreathingInstruction()}
          </Text>
          <Text style={styles.exerciseSubInstructionText}>
            {getBreathingSubInstruction()}
          </Text>
          </View>

        {/* Control Button */}
        <View style={styles.exerciseControlsContainer}>
          <TouchableOpacity
            style={[styles.exerciseControlButton, { 
              backgroundColor: isBreathingPlaying ? '#FF6B6B' : selectedBreathingCategory.color,
              shadowColor: isBreathingPlaying ? '#FF6B6B' : selectedBreathingCategory.color
            }]}
            onPress={() => {
              if (isBreathingPlaying) {
                stopBreathingExercise();
              } else {
                startBreathingExercise(currentPattern, selectedBreathingCategory);
              }
            }}
          >
            <View style={styles.exerciseButtonContent}>
              <MaterialCommunityIcons 
                name={isBreathingPlaying ? "stop-circle" : "play-circle"} 
                size={32} 
                color="#FFFFFF" 
              />
              <Text style={styles.exerciseButtonText}>
                {isBreathingPlaying ? 'End Session' : 'Start Exercise'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Session Statistics */}
        <View style={styles.detailedStatsContainer}>
          <Text style={styles.statsTitle}>Session Statistics</Text>
          
          <View style={styles.statsGrid}>
            {/* Current Cycle */}
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="refresh" size={24} color="#9B70D8" />
              <Text style={styles.statNumber}>{breathingCount + 1}</Text>
              <Text style={styles.statLabel}>Current Cycle</Text>
          </View>
          
            {/* Session Duration */}
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="timer" size={24} color="#9B70D8" />
              <Text style={styles.statNumber}>{getSessionDuration()}</Text>
              <Text style={styles.statLabel}>Session Time</Text>
            </View>

            {/* Total Cycles */}
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="counter" size={24} color="#9B70D8" />
              <Text style={styles.statNumber}>{breathingSessionStats.totalCycles}</Text>
              <Text style={styles.statLabel}>Total Cycles</Text>
            </View>

            {/* Average Cycle Time */}
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#9B70D8" />
              <Text style={styles.statNumber}>{breathingSessionStats.averageCycleTime}s</Text>
              <Text style={styles.statLabel}>Avg Cycle</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  // Enhanced Breathing Exercise Screen with Categories
  const renderBreathingScreen = () => {
    const breathingCategories = [
      {
        id: 'box-breathing',
        title: 'Box Breathing',
        description: 'Military technique for stress relief and focus',
        icon: 'square-outline',
        color: '#10B981',
        pattern: { inhale: 4, hold: 4, exhale: 4, pause: 4 },
        benefits: ['Reduces stress', 'Improves focus', 'Enhances concentration'],
        instructions: 'Perfect for high-pressure situations and anxiety relief',
        difficulty: 'Beginner',
        duration: '5-10 minutes',
        specialFeature: 'Focus Mode'
      },
      {
        id: '478-breathing',
        title: '4-7-8 Breathing',
        description: 'Dr. Weil\'s technique for deep relaxation',
        icon: 'heart-pulse',
        color: '#EF4444',
        pattern: { inhale: 4, hold: 7, exhale: 8, pause: 0 },
        benefits: ['Promotes sleep', 'Reduces anxiety', 'Calms nervous system'],
        instructions: 'Ideal for bedtime and panic attack relief',
        difficulty: 'Intermediate',
        duration: '3-5 minutes',
        specialFeature: 'Sleep Mode'
      },
      {
        id: 'triangle-breathing',
        title: 'Triangle Breathing',
        description: 'Simple pattern for quick mindfulness',
        icon: 'triangle-outline',
        color: '#F59E0B',
        pattern: { inhale: 3, hold: 3, exhale: 3, pause: 0 },
        benefits: ['Quick relaxation', 'Mindfulness', 'Energy boost'],
        instructions: 'Great for quick stress relief and energy restoration',
        difficulty: 'Beginner',
        duration: '2-3 minutes',
        specialFeature: 'Energy Mode'
      },
      {
        id: 'deep-breathing',
        title: 'Deep Breathing',
        description: 'Slow and steady relaxation technique',
        icon: 'weather-windy',
        color: '#3B82F6',
        pattern: { inhale: 6, hold: 2, exhale: 8, pause: 1 },
        benefits: ['Deep relaxation', 'Emotional balance', 'Mental clarity'],
        instructions: 'Perfect for deep meditation and emotional regulation',
        difficulty: 'Advanced',
        duration: '8-12 minutes',
        specialFeature: 'Meditation Mode'
      }
    ];

    return (
      <ScrollView 
        style={styles.breathingExerciseContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.breathingScrollContent}
      >
        {/* Header with Back Button */}
        <View style={styles.videoHeader}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCurrentScreen('main')}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.videoTitle, { color: colors.text }]}>Breathing Exercises</Text>
          <View style={styles.headerButton} />
      </View>

        {/* Breathing Categories Grid */}
        <View style={styles.breathingCategoriesGrid}>
          {breathingCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.breathingCategoryCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
              onPress={() => {
                resetBreathingState();
                setSelectedBreathingCategory(category);
                setCurrentScreen('breathing-exercise');
              }}
            >
              <View style={[styles.breathingCategoryIcon, { backgroundColor: category.color }]}>
                <MaterialCommunityIcons name={category.icon} size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.breathingCategoryTitle}>{category.title}</Text>
              <Text style={styles.breathingCategoryDescription}>{category.description}</Text>
              <View style={styles.breathingPatternInfo}>
                <Text style={styles.breathingPatternText}>
                  {category.pattern.inhale}-{category.pattern.hold}-{category.pattern.exhale}
                  {category.pattern.pause > 0 ? `-${category.pattern.pause}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>


        {/* Breathing Tips */}
        <View style={styles.breathingTipsSection}>
          <Text style={styles.breathingTipsTitle}>Breathing Tips</Text>
          <View style={styles.breathingTipsList}>
            <View style={styles.breathingTipItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.breathingTipText}>Find a comfortable position</Text>
            </View>
            <View style={styles.breathingTipItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.breathingTipText}>Breathe through your nose</Text>
            </View>
            <View style={styles.breathingTipItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.breathingTipText}>Focus on the rhythm</Text>
            </View>
            <View style={styles.breathingTipItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.breathingTipText}>Practice daily for best results</Text>
            </View>
          </View>
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
            <MaterialCommunityIcons name="arrow-left" size={24} color="#9B70D8" />
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
              <MaterialCommunityIcons name="arrow-left" size={24} color="#9B70D8" />
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
            <MaterialCommunityIcons name="arrow-left" size={24} color="#9B70D8" />
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
            <MaterialCommunityIcons name="arrow-left" size={24} color="#9B70D8" />
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
            <MaterialCommunityIcons name="arrow-left" size={24} color="#9B70D8" />
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
      case 'breathing-exercise':
        return renderBreathingExerciseScreen();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
  },
  // Now Playing Screen Styles - Exact match to image
  nowPlayingContainer: {
    flex: 1,
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
    shadowColor: '#9B70D8',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  albumArtImage: {
    width: '100%',
    height: '100%',
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
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
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  playButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#9B70D8', // Match journal primary color
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9B70D8', // Match journal primary color
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    marginHorizontal: 8,
  },
  controlButtonActive: {
    backgroundColor: '#F0E6FA', // Match journal background color
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#9B70D8', // Match journal primary color
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0E6FA', // Match journal background color
  },
  headerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0E6FA', // Already matches journal background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerCardText: {
    flex: 1,
  },
  headerCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6A3E9E',
    marginBottom: 8,
  },
  headerCardSubtitle: {
    fontSize: 14,
    color: '#9B70D8',
    lineHeight: 20,
    fontWeight: '400',
  },
  // Relaxation Techniques Grid Styles
  relaxationTechniquesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  techniqueCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  techniqueImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  techniqueImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  techniquePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  techniqueContent: {
    alignItems: 'center',
  },
  techniqueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6A3E9E',
    marginBottom: 4,
    textAlign: 'center',
  },
  techniqueSubtitle: {
    fontSize: 12,
    color: '#9B70D8',
    marginBottom: 8,
    textAlign: 'center',
  },
  techniqueDescription: {
    fontSize: 11,
    color: '#9B70D8',
    marginBottom: 2,
    textAlign: 'center',
  },
  techniqueDuration: {
    fontSize: 11,
    color: '#9B70D8',
    textAlign: 'center',
  },
  // Mood Tracker Styles
  moodTrackerSection: {
    marginBottom: 24,
  },
  moodTrackerCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  moodTrackerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A3E9E',
    marginBottom: 16,
    textAlign: 'center',
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0E6FA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  moodButtonSelected: {
    backgroundColor: '#9B70D8',
    shadowColor: '#9B70D8',
    shadowOpacity: 0.3,
    transform: [{ scale: 1.1 }],
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodStatus: {
    fontSize: 14,
    color: '#9B70D8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // E-Books Section Styles
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  ebooksHeaderCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 24,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  ebooksHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ebooksHeaderIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ebooksHeaderText: {
    flex: 1,
  },
  ebooksHeaderCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  ebooksHeaderCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '400',
  },
  ebooksNewReleasesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  ebooksGridContainer: {
    flexDirection: 'column',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  ebooksGridCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  ebooksGridImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  ebooksGridTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  ebooksGridDescription: {
    fontSize: 14,
    color: '#9B70D8',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Breathing Section Styles
  breathingHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 24,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  breathingHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breathingHeaderIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0E6FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  breathingHeaderText: {
    flex: 1,
  },
  breathingHeaderCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  breathingHeaderCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '400',
  },
  breathingInstructionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  breathingInstructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  breathingStepsList: {
    gap: 12,
  },
  breathingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breathingStepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#9B70D8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  breathingStepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  breathingStepText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  breathingBenefitsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  breathingBenefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  breathingBenefitsList: {
    gap: 12,
  },
  breathingBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breathingBenefitText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    lineHeight: 20,
  },
  // Real-time Breathing Animation Styles
  breathingAnimationContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F0E6FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  breathingInnerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  breathingControls: {
    marginBottom: 20,
  },
  breathingPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9B70D8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  breathingTimer: {
    alignItems: 'center',
  },
  breathingTimerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9B70D8',
    textAlign: 'center',
  },
  playlistHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#F0E6FA',
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistHeaderIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0E6FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#9B70D8',
  },
  playlistHeaderText: {
    flex: 1,
  },
  playlistTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9B70D8',
    marginBottom: 4,
  },
  playlistSubtitle: {
    fontSize: 14,
    color: '#9B70D8',
    fontWeight: '500',
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
    color: '#2D3748',
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
  // Modern Playlist Screen Styles
  playlistContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  playlistScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  modernPlaylistHeaderCard: {
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
    overflow: 'hidden',
  },
  modernHeaderGradient: {
    backgroundColor: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    padding: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernPlaylistHeaderIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modernPlaylistHeaderText: {
    flex: 1,
  },
  modernPlaylistTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modernPlaylistSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    lineHeight: 24,
  },
  newReleasesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9B70D8',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  modernMusicGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 8,
    marginBottom: 20,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0E6FA',
  },
  modernMusicGridCard: {
    width: '48%',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F0E6FA',
    overflow: 'hidden',
    minHeight: 220,
    backgroundColor: '#FFFFFF',
  },
  modernMusicGridImageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
  },
  modernMusicGridImage: {
    width: '100%',
    height: '100%',
  },
  modernMusicGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'linear-gradient(135deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.6) 100%)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  modernPlayIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modernMusicGridGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)',
    zIndex: -1,
  },
  modernMusicGridContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  modernMusicGridTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 22,
  },
  modernMusicGridDescription: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 14,
    fontWeight: '500',
    opacity: 0.9,
    lineHeight: 18,
    flex: 1,
  },
  modernMusicGridPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modernMusicGridPlayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
    letterSpacing: 0.3,
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
    backgroundColor: '#F0E6FA',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  ebooksHeaderCardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6A3E9E',
    marginBottom: 8,
  },
  ebooksHeaderCardSubtitle: {
    fontSize: 16,
    color: '#9B70D8',
    fontWeight: '400',
  },
  ebooksNewReleasesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6A3E9E',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
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
    color: '#6A3E9E',
    textAlign: 'center',
  },
  // Video Screen Styles
  videoContainer: {
    flex: 1,
    backgroundColor: '#F0E6FA',
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
    color: '#6A3E9E',
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
    backgroundColor: 'rgba(155, 112, 216, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B70D8',
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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6A3E9E',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#9B70D8',
    lineHeight: 20,
  },
  // Word Search Game Styles
  wordSearchContainer: {
    flex: 1,
    backgroundColor: '#F0E6FA',
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
    color: '#6A3E9E',
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
    color: '#6A3E9E',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  wordListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
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
    backgroundColor: '#F0E6FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  wordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A3E9E',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
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
    color: '#6A3E9E',
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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  winTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6A3E9E',
    marginTop: 16,
    marginBottom: 8,
  },
  winMessage: {
    fontSize: 16,
    color: '#9B70D8',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  gameInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
    marginBottom: 12,
  },
  gameInstructionsText: {
    fontSize: 14,
    color: '#9B70D8',
    lineHeight: 20,
  },

  // Sudoku Game Styles
  sudokuContainer: {
    flex: 1,
    backgroundColor: '#F0E6FA',
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
    color: '#6A3E9E',
  },
  sudokuStatusContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sudokuStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
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
    color: '#6A3E9E',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  numberInputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  sudokuWinTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6A3E9E',
    marginTop: 16,
    marginBottom: 8,
  },
  sudokuWinMessage: {
    fontSize: 16,
    color: '#9B70D8',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  sudokuInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
    marginBottom: 12,
  },
  sudokuInstructionsText: {
    fontSize: 14,
    color: '#9B70D8',
    lineHeight: 20,
  },

  // Word Scramble Game Styles
  scrambleContainer: {
    flex: 1,
    backgroundColor: '#F0E6FA',
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
    color: '#6A3E9E',
  },
  scrambleStatusContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  scrambleStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
    textAlign: 'center',
  },
  scrambleProgressText: {
    fontSize: 14,
    color: '#9B70D8',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  scrambledWordLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
    marginBottom: 12,
  },
  scrambledWordBox: {
    backgroundColor: '#F0E6FA',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  scrambleInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
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
    borderColor: '#F3E8FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F0E6FA',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  scrambleWinTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6A3E9E',
    marginTop: 16,
    marginBottom: 8,
  },
  scrambleWinMessage: {
    fontSize: 16,
    color: '#9B70D8',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  scrambleInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
    marginBottom: 12,
  },
  scrambleInstructionsText: {
    fontSize: 14,
    color: '#9B70D8',
    lineHeight: 20,
  },

  // Hidden Object Game Styles
  hiddenObjectContainer: {
    flex: 1,
    backgroundColor: '#F0E6FA',
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
    color: '#6A3E9E',
  },
  hiddenObjectStatusContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  hiddenObjectStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  objectsToFindTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
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
    backgroundColor: '#F0E6FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  objectToFindText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A3E9E',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  hiddenObjectWinTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6A3E9E',
    marginTop: 16,
    marginBottom: 8,
  },
  hiddenObjectWinMessage: {
    fontSize: 16,
    color: '#9B70D8',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  hiddenObjectInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
    marginBottom: 12,
  },
  hiddenObjectInstructionsText: {
    fontSize: 14,
    color: '#9B70D8',
    lineHeight: 20,
  },

  // Improved Games Screen Styles
  gamesHeaderCard: {
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  gamesHeaderCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A3E9E',
    marginBottom: 8,
  },
  gamesHeaderCardSubtitle: {
    fontSize: 14,
    color: '#9B70D8',
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
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
    color: '#6A3E9E',
    marginBottom: 8,
    textAlign: 'center',
  },
  gameGridDescription: {
    fontSize: 12,
    color: '#9B70D8',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  gameGridPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0E6FA',
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
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  gameFeaturesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
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
    color: '#9B70D8',
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

  // Real-time Breathing Exercise Styles
  breathingExerciseContainer: {
    flex: 1,
    backgroundColor: '#F0E6FA',
    paddingTop: 60,
  },
  breathingHeader: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  breathingBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  breathingBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9B70D8',
    marginLeft: 8,
  },
  breathingScreenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6A3E9E',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  breathingScreenSubtitle: {
    fontSize: 16,
    color: '#9B70D8',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  breathingScrollContent: {
    paddingBottom: 100,
  },
  breathingCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 32,
    gap: 12,
  },
  breathingCategoryCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0E6FA',
    minHeight: 140,
  },
  breathingCategoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  breathingCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
    textAlign: 'center',
    marginBottom: 8,
  },
  breathingCategoryDescription: {
    fontSize: 12,
    color: '#9B70D8',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  breathingPatternInfo: {
    backgroundColor: '#F0E6FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  breathingPatternText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A3E9E',
  },
  realtimeBreathingSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  realtimeBreathingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6A3E9E',
    marginBottom: 8,
  },
  realtimeBreathingSubtitle: {
    fontSize: 14,
    color: '#9B70D8',
    marginBottom: 20,
  },
  realtimeBreathingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0E6FA',
  },
  breathingAnimationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  breathingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  breathingStatusText: {
    fontSize: 16,
    color: '#6A3E9E',
    textAlign: 'center',
    fontWeight: '500',
  },
  breathingStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  breathingStartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  breathingInstructionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6A3E9E',
    textAlign: 'center',
    marginBottom: 8,
  },
  breathingSubInstructionText: {
    fontSize: 16,
    color: '#9B70D8',
    textAlign: 'center',
    marginBottom: 8,
  },
  breathingCycleText: {
    fontSize: 14,
    color: '#6A3E9E',
    textAlign: 'center',
    fontWeight: '600',
  },
  breathingControls: {
    width: '100%',
    alignItems: 'center',
  },
  breathingPatternSelector: {
    marginTop: 20,
    width: '100%',
  },
  patternSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A3E9E',
    textAlign: 'center',
    marginBottom: 12,
  },
  patternButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  patternButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  patternButtonActive: {
    backgroundColor: '#9B70D8',
    borderColor: '#9B70D8',
  },
  patternButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: '#9B70D8',
  },
  patternButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  patternButtonTextActive: {
    color: '#FFFFFF',
  },
  patternButtonTextInactive: {
    color: '#9B70D8',
  },
  // Enhanced Breathing Design Styles
  breathingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  breathingIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0E6FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  breathingHeaderText: {
    flex: 1,
  },
  enhancedBreathingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0E6FA',
  },
  breathingOuterRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#9B70D8',
    top: -40,
    left: -40,
  },
  enhancedBreathingCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  breathingCircleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingProgressRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: '#E5E7EB',
    top: -10,
    left: -10,
  },
  breathingProgressFill: {
    height: '100%',
    backgroundColor: '#9B70D8',
    borderRadius: 90,
  },
  breathingInstructionsContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  breathingStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0E6FA',
  },
  breathingStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  breathingStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A3E9E',
    marginBottom: 4,
  },
  breathingStatLabel: {
    fontSize: 11,
    color: '#9B70D8',
    fontWeight: '500',
    textAlign: 'center',
  },
  enhancedBreathingControls: {
    width: '100%',
    alignItems: 'center',
  },
  enhancedBreathingButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  breathingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedBreathingButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  enhancedPatternSelector: {
    width: '100%',
  },
  enhancedPatternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  enhancedPatternCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 100,
  },
  enhancedPatternCardActive: {
    backgroundColor: '#F0E6FA',
    borderColor: '#9B70D8',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedPatternCardInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E5E7EB',
  },
  patternIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A3E9E',
    textAlign: 'center',
    marginBottom: 8,
  },
  patternCardPattern: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9B70D8',
    textAlign: 'center',
  },
  // Premium Breathing Design Styles
  premiumBreathingSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  premiumBreathingHeader: {
    backgroundColor: 'linear-gradient(135deg, #9B70D8 0%, #6A3E9E 100%)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  premiumHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  premiumHeaderText: {
    flex: 1,
  },
  premiumBreathingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  premiumBreathingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  premiumBreathingInterface: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#F0E6FA',
  },
  premiumBreathingVisualization: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
    position: 'relative',
    marginBottom: 32,
  },
  breathingBackgroundCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#9B70D8',
  },
  breathingBgCircle1: {
    width: 200,
    height: 200,
    top: 40,
    left: 40,
  },
  breathingBgCircle2: {
    width: 160,
    height: 160,
    top: 60,
    left: 60,
  },
  premiumBreathingOrb: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
    position: 'relative',
  },
  breathingOrbGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -10,
    left: -10,
  },
  breathingOrbContent: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  breathingParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9B70D8',
  },
  particle1: {
    top: 60,
    left: 80,
  },
  particle2: {
    top: 120,
    right: 60,
  },
  particle3: {
    bottom: 80,
    left: 100,
  },
  premiumInstructionsContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  premiumInstructionText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  premiumSubInstructionText: {
    fontSize: 18,
    color: '#9B70D8',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 20,
  },
  premiumProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  premiumProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  premiumProgressFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumProgressText: {
    fontSize: 14,
    color: '#6A3E9E',
    fontWeight: '600',
  },
  premiumControlsContainer: {
    width: '100%',
  },
  premiumControlButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 24,
  },
  premiumButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  premiumPatternSection: {
    width: '100%',
  },
  premiumPatternTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  premiumPatternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  premiumPatternCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 160,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumPatternCardActive: {
    backgroundColor: '#F0E6FA',
    borderColor: '#9B70D8',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  premiumPatternCardInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  premiumPatternIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumPatternDescription: {
    fontSize: 12,
    color: '#9B70D8',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  premiumPatternBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  premiumPatternBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6A3E9E',
  },
  // Dedicated Breathing Exercise Screen Styles
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0E6FA',
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryHeaderText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#9B70D8',
    marginBottom: 8,
  },
  categoryPattern: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A3E9E',
    backgroundColor: '#F0E6FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  exerciseBreathingVisualization: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
    position: 'relative',
    marginBottom: 24,
  },
  exerciseBgCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#9B70D8',
    top: 30,
    left: 30,
  },
  exerciseBgCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#9B70D8',
    top: 50,
    left: 50,
  },
  exerciseBreathingOrb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    position: 'relative',
  },
  exerciseOrbGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -10,
    left: -10,
  },
  exerciseOrbContent: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInstructionsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  exerciseInstructionText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 8,
  },
  exerciseSubInstructionText: {
    fontSize: 16,
    color: '#9B70D8',
    textAlign: 'center',
    fontWeight: '500',
  },
  detailedStatsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0E6FA',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D3748',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9B70D8',
    fontWeight: '600',
    textAlign: 'center',
  },
  phaseBreakdownContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 20,
  },
  phaseBreakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  phaseBreakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  phaseCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phaseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  phaseTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9B70D8',
  },
  exerciseControlsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  exerciseControlButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  exerciseButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  // Enhanced Category Styles
  categoryInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  categoryInfoBadge: {
    backgroundColor: '#F0E6FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B70D8',
  },
  benefitsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0E6FA',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  breathingTipsSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  breathingTipsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6A3E9E',
    marginBottom: 16,
  },
  breathingTipsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0E6FA',
  },
  breathingTipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breathingTipText: {
    fontSize: 14,
    color: '#6A3E9E',
    marginLeft: 12,
    flex: 1,
  },
  autoStartingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  autoStartingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  autoStartingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  completionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9B70D8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completionNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6A3E9E',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#9B70D8',
    fontWeight: '500',
  },
  breathingMainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  breathingCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#9B70D8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#9B70D8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  breathingInstruction: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  breathingSubInstruction: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
    opacity: 0.9,
  },
  progressIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9B70D8',
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: '#9B70D8',
  },
  // Stars and Crescent Styles
  nightSkyContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  crescentContainer: {
    position: 'absolute',
    top: 80,
    right: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crescentEmoji: {
    fontSize: 40,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
});
