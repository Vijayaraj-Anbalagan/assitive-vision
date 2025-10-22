'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Navigation, Settings, Home, Volume2, VolumeX, Vibrate, MapPin, 
  AlertTriangle, Flashlight, Mic, AlertCircle, X, Battery, BatteryCharging,
  Wifi, WifiOff, MapPinned, User, Sun, Moon, Languages
} from 'lucide-react';

type Language = 'en' | 'ta' | 'hi';
type Theme = 'light' | 'dark';

interface SettingsState {
  voiceEnabled: boolean;
  vibrationEnabled: boolean;
  volume: 'high' | 'medium' | 'low';
  sensitivity: number;
  theme: Theme;
  language: Language;
}

interface Translations {
  [key: string]: {
    en: string;
    ta: string;
    hi: string;
  };
}

interface TutorialStep {
  title: string;
  message: string;
  target: string;
}

// Translation dictionary
const translations: Translations = {
  appTitle: { en: 'VISORA', ta: 'விசோரா', hi: 'विसोरा' },
  appSubtitle: { en: 'Beyond barriers Built for freedom', ta: 'தடைகளைத் தாண்டி சுதந்திரத்திற்காக கட்டப்பட்டது', hi: 'बाधाओं से परे। आज़ादी के लिए निर्मित।' },
  cameraMode: { en: 'Camera Mode', ta: 'கேமரா பயன்முறை', hi: 'कैमरा मोड' },
  navigation: { en: 'Navigation', ta: 'வழிசெலுத்தல்', hi: 'नेविगेशन' },
  settings: { en: 'Settings', ta: 'அமைப்புகள்', hi: 'सेटिंग्स' },
  voice: { en: 'VOICE', ta: 'குரல்', hi: 'आवाज़' },
  cam: { en: 'CAM', ta: 'கேமரா', hi: 'कैमरा' },
  sos: { en: 'SOS', ta: 'SOS', hi: 'SOS' },
  online: { en: 'Online', ta: 'ஆன்லைன்', hi: 'ऑनलाइन' },
  offline: { en: 'Offline', ta: 'ஆஃப்லைன்', hi: 'ऑफ़लाइन' },
  listening: { en: 'Listening...', ta: 'கேட்கிறது...', hi: 'सुन रहा है...' },
  tapToSpeak: { en: 'Tap to speak', ta: 'பேச தட்டவும்', hi: 'बोलने के लिए टैप करें' },
  swipeUpVoice: { en: 'Swipe up for voice', ta: 'குரலுக்கு மேலே ஸ்வைப் செய்யவும்', hi: 'आवाज़ के लिए ऊपर स्वाइप करें' },
  startCamera: { en: 'Start Camera', ta: 'கேமராவைத் தொடங்கு', hi: 'कैमरा शुरू करें' },
  startDetection: { en: 'Start Detection', ta: 'கண்டறிதலைத் தொடங்கு', hi: 'पता लगाना शुरू करें' },
  stopDetection: { en: 'Stop Detection', ta: 'கண்டறிதலை நிறுத்து', hi: 'पता लगाना बंद करें' },
  destination: { en: 'Destination', ta: 'இலக்கு', hi: 'गंतव्य' },
  enterDestination: { en: 'Enter address or place', ta: 'முகவரி அல்லது இடத்தை உள்ளிடவும்', hi: 'पता या स्थान दर्ज करें' },
  startNavigation: { en: 'Start Navigation', ta: 'வழிசெலுத்தலைத் தொடங்கு', hi: 'नेविगेशन शुरू करें' },
  stopNavigation: { en: 'Stop Navigation', ta: 'வழிசெலுத்தலை நிறுத்து', hi: 'नेविगेशन बंद करें' },
  voiceFeedback: { en: 'Voice Feedback', ta: 'குரல் பின்னூட்டம்', hi: 'आवाज़ प्रतिक्रिया' },
  vibration: { en: 'Vibration', ta: 'அதிர்வு', hi: 'कंपन' },
  volumeLevel: { en: 'Volume Level', ta: 'ஒலி அளவு', hi: 'वॉल्यूम स्तर' },
  detectionSensitivity: { en: 'Detection Sensitivity', ta: 'கண்டறிதல் உணர்திறன்', hi: 'पता लगाने की संवेदनशीलता' },
  high: { en: 'High', ta: 'அதிக', hi: 'उच्च' },
  medium: { en: 'Medium', ta: 'நடுத்தர', hi: 'मध्यम' },
  low: { en: 'Low', ta: 'குறைவான', hi: 'कम' },
  testAlerts: { en: 'Test Alerts', ta: 'எச்சரிக்கைகளைச் சோதிக்கவும்', hi: 'अलर्ट का परीक्षण करें' },
  darkMode: { en: 'Dark Mode', ta: 'இருள் பயன்முறை', hi: 'डार्क मोड' },
  lightMode: { en: 'Light Mode', ta: 'ஒளி பயன்முறை', hi: 'लाइट मोड' },
  language: { en: 'Language', ta: 'மொழி', hi: 'भाषा' },
  obstacleDetected: { en: 'Obstacle detected ahead', ta: 'முன்னால் தடை கண்டறியப்பட்டது', hi: 'आगे बाधा का पता चला' },
  emergencySOS: { en: 'Emergency SOS', ta: 'அவசர SOS', hi: 'आपातकालीन SOS' },
  profile: { en: 'Profile', ta: 'சுயவிவரம்', hi: 'प्रोफ़ाइल' },
};

const AssistiveVisionPage: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<string>('home');
  const [settings, setSettings] = useState<SettingsState>({
    voiceEnabled: true,
    vibrationEnabled: true,
    volume: 'high',
    sensitivity: 50,
    theme: 'dark',
    language: 'en',
  });
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [destination, setDestination] = useState<string>('');
  const [detectionActive, setDetectionActive] = useState<boolean>(false);
  const [lastAlert, setLastAlert] = useState<string>('');
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognizedCommand, setRecognizedCommand] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const emergencyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioAnimationRef = useRef<number | null>(null);

  const tutorialSteps: TutorialStep[] = [
    {
      title: 'Welcome to VISORA! 👋',
      message: 'This app helps you navigate safely using your camera and voice guidance. Let\'s take a quick tour!',
      target: 'home',
    },
    {
      title: 'Camera Mode 🎥',
      message: 'Detects obstacles and sharp edges in real-time. Tap the blue button to activate camera detection.',
      target: 'camera',
    },
    {
      title: 'Navigation Mode 🗺️',
      message: 'Get voice-guided directions to your destination. Tap the green button to start navigating.',
      target: 'navigation',
    },
    {
      title: 'Emergency SOS 🚨',
      message: 'Tap this button in any emergency. It will flash the screen and sound an alarm.',
      target: 'sos',
    },
    {
      title: 'Settings ⚙️',
      message: 'Customize voice, vibration, and sensitivity. You\'re all set to go!',
      target: 'settings',
    },
  ];

  const voiceCommands = ['navigate', 'camera', 'settings', 'stop'];

  // Translation helper
  const t = (key: string): string => {
    return translations[key]?.[settings.language] || translations[key]?.en || key;
  };

  // Theme initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = window.localStorage.getItem('theme') as Theme;
      const savedLanguage = window.localStorage.getItem('language') as Language;
      
      if (savedTheme) {
        setSettings(prev => ({ ...prev, theme: savedTheme }));
      }
      if (savedLanguage) {
        setSettings(prev => ({ ...prev, language: savedLanguage }));
      }
      
      // Apply theme to document
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  }, []);

  // Update theme when settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', settings.theme);
      window.localStorage.setItem('language', settings.language);
      
      if (settings.theme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  }, [settings.theme, settings.language]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tutorialShown = window.localStorage.getItem('tutorialShown');
      if (!tutorialShown) {
        setShowTutorial(true);
      }
    }
    // network
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const onOnline = () => setIsOnline(true);
      const onOffline = () => setIsOnline(false);
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);

      // battery
      if ((navigator as any).getBattery) {
        (navigator as any).getBattery().then((bat: any) => {
          setBatteryLevel(Math.round(bat.level * 100));
          bat.addEventListener('levelchange', () => setBatteryLevel(Math.round(bat.level * 100)));
        });
      }

      return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    }
  }, []);

  const speak = (text: string): void => {
    if (!settings.voiceEnabled || typeof window === 'undefined') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = settings.volume === 'high' ? 1 : settings.volume === 'medium' ? 0.6 : 0.3;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const vibrate = (pattern: number[] = [200]): void => {
    if (!settings.vibrationEnabled || typeof window === 'undefined') return;
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const startCamera = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        speak('Camera mode activated');
      }
    } catch (err) {
      alert('Camera access denied. Please enable camera permissions.');
      console.error(err);
    }
  };

  const stopCamera = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setDetectionActive(false);
    setIsFlashlightOn(false);
  };

  const toggleFlashlight = async (): Promise<void> => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;

    if (!capabilities.torch) {
      alert('Flashlight not supported on this device');
      return;
    }

    try {
      await track.applyConstraints({
        advanced: [{ torch: !isFlashlightOn } as any],
      });
      setIsFlashlightOn(!isFlashlightOn);
      speak(isFlashlightOn ? 'Flashlight off' : 'Flashlight on');
    } catch (err) {
      console.error('Flashlight error:', err);
    }
  };

  const detectEdges = (): void => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame first so we can see what we're detecting
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const threshold = 100 - settings.sensitivity;
    const edgeMap: boolean[][] = [];
    
    // Initialize edge map
    for (let y = 0; y < canvas.height; y++) {
      edgeMap[y] = [];
      for (let x = 0; x < canvas.width; x++) {
        edgeMap[y][x] = false;
      }
    }

    // Detect edges
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width - 1; x++) {
        const i = (y * canvas.width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const nextBrightness = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
        const diff = Math.abs(brightness - nextBrightness);

        if (diff > threshold) {
          edgeMap[y][x] = true;
        }
      }
    }

    // Find connected regions and draw rectangles
    const visited: boolean[][] = edgeMap.map(row => row.map(() => false));
    const regions: { minX: number; minY: number; maxX: number; maxY: number; centerX: number }[] = [];

    const floodFill = (startX: number, startY: number) => {
      const stack: [number, number][] = [[startX, startY]];
      let minX = startX, maxX = startX, minY = startY, maxY = startY;
      let pixelCount = 0;

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
        if (visited[y][x] || !edgeMap[y][x]) continue;

        visited[y][x] = true;
        pixelCount++;

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);

        // Check 8 neighbors
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        stack.push([x + 1, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1]);
      }

      return { minX, minY, maxX, maxY, pixelCount, centerX: (minX + maxX) / 2 };
    };

    // Find all regions
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (edgeMap[y][x] && !visited[y][x]) {
          const region = floodFill(x, y);
          
          // Only consider significant regions (filter out noise)
          if (region.pixelCount > 100) {
            const width = region.maxX - region.minX;
            const height = region.maxY - region.minY;
            
            // Filter out very small or very thin regions
            if (width > 20 && height > 20) {
              regions.push(region);
            }
          }
        }
      }
    }

    // Draw rectangles around detected regions
    ctx.strokeStyle = '#ff0000ff';
    ctx.lineWidth = 3;
    
    regions.forEach(region => {
      const padding = 10;
      ctx.strokeRect(
        region.minX - padding,
        region.minY - padding,
        (region.maxX - region.minX) + padding * 2,
        (region.maxY - region.minY) + padding * 2
      );
    });

    // Determine direction and provide feedback
    if (regions.length > 0) {
      const centerX = canvas.width / 2;
      let leftCount = 0;
      let rightCount = 0;

      regions.forEach(region => {
        if (region.centerX < centerX) {
          leftCount++;
        } else {
          rightCount++;
        }
      });

      // Provide directional feedback
      if (rightCount > leftCount) {
        const alertMsg = "Don't go right";
        setLastAlert(alertMsg);
        speak(alertMsg);
        vibrate([200]); // Vibrate once for right
      } else if (leftCount > rightCount) {
        const alertMsg = "Don't go left";
        setLastAlert(alertMsg);
        speak(alertMsg);
        vibrate([200, 100, 200]); // Vibrate twice for left
      } else {
        // Objects on both sides or centered
        const alertMsg = 'Obstacle detected ahead';
        setLastAlert(alertMsg);
        speak(alertMsg);
        vibrate([100, 50, 100]);
      }
    }
  };
  const startDetection = (): void => {
    setDetectionActive(true);
    speak('Edge detection started');

    detectionIntervalRef.current = setInterval(() => {
      detectEdges();
    }, 1000);
  };

  const stopDetection = (): void => {
    setDetectionActive(false);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
  };

  const startListening = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      source.connect(analyserRef.current);
      
      setIsListening(true);
      speak('Listening for commands: navigate, camera, settings, or stop');
      
      const updateAudioLevel = () => {
        if (!analyserRef.current || !isListening) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        
        audioAnimationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
      
      setTimeout(() => {
        const randomCommand = voiceCommands[Math.floor(Math.random() * voiceCommands.length)];
        setRecognizedCommand(randomCommand);
        speak(`Command recognized: ${randomCommand}`);
        
        setTimeout(() => {
          stopListening();
          handleVoiceCommand(randomCommand);
        }, 1000);
      }, 2000);
      
    } catch (err) {
      alert('Microphone access denied');
      console.error(err);
    }
  };

  const stopListening = (): void => {
    setIsListening(false);
    setAudioLevel(0);
    setRecognizedCommand('');
    
    if (audioAnimationRef.current) {
      cancelAnimationFrame(audioAnimationRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const handleVoiceCommand = (command: string): void => {
    switch (command) {
      case 'navigate':
        switchMode('navigation');
        break;
      case 'camera':
        switchMode('camera');
        break;
      case 'settings':
        switchMode('settings');
        break;
      case 'stop':
        stopCamera();
        stopNavigation();
        speak('All activities stopped');
        break;
      default:
        break;
    }
  };

  const triggerEmergency = (): void => {
    setIsEmergencyActive(true);
    speak('Emergency SOS activated!');
    vibrate([200, 100, 200, 100, 200]);

    let flickerCount = 0;
    emergencyIntervalRef.current = setInterval(() => {
      flickerCount++;
      if (flickerCount > 20) {
        clearInterval(emergencyIntervalRef.current!);
      }
    }, 200);
  };

  const stopEmergency = (): void => {
    setIsEmergencyActive(false);
    if (emergencyIntervalRef.current) {
      clearInterval(emergencyIntervalRef.current);
    }
    speak('Emergency cancelled');
  };

  const startNavigation = (): void => {
    if (!destination) {
      alert('Please enter a destination');
      return;
    }

    setIsNavigating(true);
    speak(`Navigation started to ${destination}`);
    vibrate([200]);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          speak('Location acquired. Calculating route.');
        },
        () => {
          alert('Location access denied. Please enable location services.');
        }
      );
    }
  };

  const stopNavigation = (): void => {
    setIsNavigating(false);
    speak('Navigation stopped');
  };

  const switchMode = (mode: string): void => {
    stopCamera();
    stopDetection();
    stopNavigation();
    setCurrentMode(mode);

    if (mode === 'camera') {
      speak('Switching to camera mode');
    } else if (mode === 'navigation') {
      speak('Switching to navigation mode');
    } else if (mode === 'settings') {
      speak('Opening settings');
    } else {
      speak('Returning to home');
    }
  };

  const nextTutorialStep = (): void => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
      speak(tutorialSteps[tutorialStep + 1].message);
    } else {
      closeTutorial();
    }
  };

  const closeTutorial = (): void => {
    setShowTutorial(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('tutorialShown', 'true');
    }
    speak('Tutorial completed. Welcome!');
  };

  useEffect(() => {
    return () => {
      stopCamera();
      stopDetection();
      stopListening();
      stopEmergency();
    };
  }, []);

  const EmergencyOverlay: React.FC = () => {
    if (!isEmergencyActive) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 animate-flicker"
          style={{
            animation: 'flicker 0.2s infinite',
            backgroundColor: 'white',
          }}
        />
        <button
          onClick={stopEmergency}
          className="relative z-10 bg-red-600 text-white px-12 py-8 rounded-full text-3xl font-bold shadow-2xl hover:bg-red-700"
          aria-label="Stop emergency"
        >
          STOP SOS
        </button>
        <style jsx>{`
          @keyframes flicker {
            0%, 100% { background-color: white; }
            50% { background-color: black; }
          }
        `}</style>
      </div>
    );
  };

  const TutorialTooltip: React.FC = () => {
    if (!showTutorial) return null;

    const step = tutorialSteps[tutorialStep];

    return (
      <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4 sm:p-6">
        <div className={`rounded-2xl p-6 sm:p-8 max-w-md shadow-2xl ${
          settings.theme === 'light' 
            ? 'bg-white text-gray-900' 
            : 'bg-gray-800 text-white'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl sm:text-2xl font-bold">{step.title}</h3>
            <button
              onClick={closeTutorial}
              className={`transition-colors ${
                settings.theme === 'light'
                  ? 'text-gray-500 hover:text-gray-700'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              aria-label="Close tutorial"
            >
              <X size={24} />
            </button>
          </div>
          <p className={`text-base sm:text-lg mb-6 leading-relaxed ${
            settings.theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>{step.message}</p>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              settings.theme === 'light' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {tutorialStep + 1} / {tutorialSteps.length}
            </span>
            <button
              onClick={nextTutorialStep}
              className="bg-blue-600 text-white px-5 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all hover:scale-105 shadow-lg"
              aria-label={tutorialStep === tutorialSteps.length - 1 ? 'Finish tutorial' : 'Next step'}
            >
              {tutorialStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AudioVisualizer: React.FC = () => {
    if (!isListening) return null;

    const barCount = 12;
    const bars = Array.from({ length: barCount }, (_, i) => {
      const heightMultiplier = Math.sin((i / barCount) * Math.PI) + 0.5;
      const baseHeight = 12;
      const dynamicHeight = audioLevel * heightMultiplier * 0.8;
      return Math.max(baseHeight, Math.min(80, baseHeight + dynamicHeight));
    });

    return (
      <div className="flex items-center justify-center gap-1.5 my-6 h-24">
        {bars.map((height, i) => (
          <div
            key={i}
            className="bg-linear-to-t from-blue-500 via-blue-400 to-blue-300 dark:from-blue-600 dark:via-blue-500 dark:to-blue-400 w-1.5 rounded-full transition-all duration-100 ease-out shadow-lg"
            style={{
              height: `${height}px`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    );
  };

  if (currentMode === 'home') {
    return (
      <>
        <EmergencyOverlay />
        <TutorialTooltip />
        <div className={`min-h-screen transition-colors duration-300 ${
          settings.theme === 'light' 
            ? 'bg-linear-to-b from-gray-50 to-gray-100 text-gray-900' 
            : 'bg-linear-to-b from-gray-900 to-gray-800 text-white'
        } p-4 sm:p-6`}>
          <div className="max-w-md mx-auto min-h-screen flex flex-col relative pb-32">
            {/* Top status row */}
            <div className="flex justify-between items-center mt-4 sm:mt-6 mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`flex items-center gap-1.5 text-xs sm:text-sm ${
                  settings.theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  {batteryLevel !== null && batteryLevel > 20 ? (
                    <BatteryCharging size={18} className="text-green-500" />
                  ) : (
                    <Battery size={18} className={batteryLevel !== null && batteryLevel < 20 ? 'text-red-500' : 'text-gray-500'} />
                  )}
                  <span className="font-medium">{batteryLevel !== null ? `${batteryLevel}%` : '—'}</span>
                </div>

                <div className={`flex items-center gap-1.5 text-xs sm:text-sm ${
                  settings.theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  {isOnline ? (
                    <Wifi size={18} className="text-green-500" />
                  ) : (
                    <WifiOff size={18} className="text-red-500" />
                  )}
                  <span className="font-medium">{t('online')}</span>
                </div>

                <MapPinned size={18} className={settings.theme === 'light' ? 'text-blue-600' : 'text-blue-400'} />
              </div>
            </div>

            {/* App Title */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className={`text-3xl sm:text-4xl font-bold mb-1 ${
                settings.theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>{t('appTitle')}</h1>
              <p className={`text-sm sm:text-base ${
                settings.theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>{t('appSubtitle')}</p>
            </div>

            {/* Three small oval buttons */}
            <div className="flex items-center justify-between gap-2 mb-8 sm:mb-12">
              <button
                onClick={() => { switchMode('camera'); startCamera(); }}
                className={`flex-1 py-3 sm:py-4 px-2 rounded-full text-sm sm:text-lg font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 ${
                  settings.theme === 'light'
                    ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                    : 'bg-gray-800/80 text-white hover:bg-gray-700/80'
                }`}
                aria-label={t('cam')}
              >
                <Camera className="mx-auto mb-1" size={20} />
                <span className="block">{t('cam')}</span>
              </button>

              <button
                onClick={() => switchMode('navigation')}
                className={`flex-1 py-3 sm:py-4 px-2 rounded-full text-sm sm:text-lg font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 ${
                  settings.theme === 'light'
                    ? 'bg-green-100 text-green-900 hover:bg-green-200'
                    : 'bg-gray-800/80 text-white hover:bg-gray-700/80'
                }`}
                aria-label={t('navigation')}
              >
                <Navigation className="mx-auto mb-1" size={20} />
                <span className="block text-xs sm:text-sm">NAVI</span>
              </button>

              <button
                onClick={triggerEmergency}
                className="flex-1 py-3 sm:py-4 px-2 rounded-full text-sm sm:text-lg font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 bg-red-600 text-white hover:bg-red-700"
                aria-label={t('sos')}
              >
                <AlertCircle className="mx-auto mb-1" size={20} />
                <span className="block">{t('sos')}</span>
              </button>
            </div>

            {/* Large central voice button */}
            <div className="flex flex-col items-center justify-center flex-1 my-4">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 relative ${
                  isListening 
                    ? 'scale-95 bg-red-600 animate-pulse' 
                    : settings.theme === 'light'
                      ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                      : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                }`}
                aria-label={t('voice')}
              >
                <Mic size={48} className="mb-2" />
                <span className="text-2xl sm:text-3xl font-bold text-white">{t('voice')}</span>
                <span className="text-xs sm:text-sm mt-2 text-white/90">
                  {isListening ? t('listening') : t('tapToSpeak')}
                </span>
                {isListening && (
                  <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
                )}
              </button>
              
              {isListening && <AudioVisualizer />}
              
              {recognizedCommand && (
                <div className="mt-4 px-6 py-2 bg-green-500/20 border border-green-500 rounded-full">
                  <span className="text-green-400 font-semibold">Command: {recognizedCommand}</span>
                </div>
              )}
            </div>

            {/* Swipe hint and bottom controls */}
            <div className="absolute left-4 right-4 bottom-6 flex items-center justify-between">
              <button
                onClick={() => switchMode('settings')}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 ${
                  settings.theme === 'light'
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-gray-800/80 text-white hover:bg-gray-700/80'
                }`}
                aria-label={t('profile')}
              >
                <User size={24} />
              </button>

              <div className="text-center">
                <div className={`text-xs sm:text-sm font-semibold ${
                  settings.theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>{t('swipeUpVoice')}</div>
              </div>

              <button
                onClick={() => switchMode('settings')}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 ${
                  settings.theme === 'light'
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-gray-800/80 text-white hover:bg-gray-700/80'
                }`}
                aria-label={t('settings')}
              >
                <Settings size={24} />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentMode === 'camera') {
    return (
      <>
        <EmergencyOverlay />
        <div className="min-h-screen bg-black text-white">
          <div className="relative w-full h-screen">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              aria-label="Camera feed for obstacle detection"
            />

            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full opacity-50" />

            <div className="absolute top-0 left-0 right-0 p-4 bg-linear-to-b from-black/80 to-transparent">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => switchMode('home')}
                  className="bg-gray-800/90 text-white p-3 sm:p-4 rounded-full hover:bg-gray-700/90 transition-all hover:scale-110 shadow-lg"
                  aria-label="Return to home"
                >
                  <Home size={28} />
                </button>
                <h2 className="text-xl sm:text-2xl font-bold">{t('cameraMode')}</h2>
                {isCameraActive && (
                  <button
                    onClick={toggleFlashlight}
                    className={`p-3 sm:p-4 rounded-full transition-all hover:scale-110 shadow-lg ${
                      isFlashlightOn ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-800/90 hover:bg-gray-700/90'
                    }`}
                    aria-label={isFlashlightOn ? 'Turn off flashlight' : 'Turn on flashlight'}
                  >
                    <Flashlight size={28} />
                  </button>
                )}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-linear-to-t from-black/90 to-transparent">
              {lastAlert && (
                <div className="bg-red-600 text-white p-4 rounded-xl mb-4 flex items-center gap-3 animate-pulse shadow-lg">
                  <AlertTriangle size={32} className="shrink-0" />
                  <span className="text-lg sm:text-xl font-bold">{t('obstacleDetected')}</span>
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                {!isCameraActive && (
                  <button
                    onClick={startCamera}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 sm:py-6 rounded-xl text-xl sm:text-2xl font-bold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                    aria-label={t('startCamera')}
                  >
                    <Camera size={28} />
                    {t('startCamera')}
                  </button>
                )}

                {isCameraActive && !detectionActive && (
                  <button
                    onClick={startDetection}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 sm:py-6 rounded-xl text-xl sm:text-2xl font-bold transition-all hover:scale-105 shadow-lg"
                    aria-label={t('startDetection')}
                  >
                    {t('startDetection')}
                  </button>
                )}

                {detectionActive && (
                  <button
                    onClick={stopDetection}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 sm:py-6 rounded-xl text-xl sm:text-2xl font-bold transition-all hover:scale-105 shadow-lg"
                    aria-label={t('stopDetection')}
                  >
                    {t('stopDetection')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentMode === 'navigation') {
    return (
      <>
        <EmergencyOverlay />
        <div className={`min-h-screen transition-colors duration-300 ${
          settings.theme === 'light' 
            ? 'bg-linear-to-b from-gray-50 to-gray-100 text-gray-900' 
            : 'bg-linear-to-b from-gray-900 to-gray-800 text-white'
        }`}>
          <div className="max-w-md mx-auto p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <button
                onClick={() => switchMode('home')}
                className={`p-3 rounded-full transition-all hover:scale-110 shadow-lg ${
                  settings.theme === 'light'
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
                aria-label="Return to home"
              >
                <Home size={28} />
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold">{t('navigation')}</h2>
              <div className="w-14" />
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-lg sm:text-xl mb-3 font-semibold">{t('destination')}</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={t('enterDestination')}
                  className={`w-full p-4 sm:p-5 rounded-xl text-lg sm:text-xl border-2 focus:outline-none transition-colors ${
                    settings.theme === 'light'
                      ? 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
                      : 'bg-gray-800 text-white border-gray-700 focus:border-blue-500'
                  }`}
                  aria-label={t('enterDestination')}
                />
              </div>

              {!isNavigating ? (
                <button
                  onClick={startNavigation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-5 sm:py-6 rounded-xl text-xl sm:text-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg"
                  aria-label={t('startNavigation')}
                >
                  <MapPin size={28} />
                  <span>{t('startNavigation')}</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-600 p-6 rounded-xl shadow-lg">
                    <p className="text-xl sm:text-2xl font-bold mb-2">Navigating to:</p>
                    <p className="text-lg sm:text-xl">{destination}</p>
                    <p className="text-base sm:text-lg mt-4 text-blue-200">Follow voice instructions</p>
                  </div>

                  <button
                    onClick={stopNavigation}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-5 sm:py-6 rounded-xl text-xl sm:text-2xl font-bold transition-all hover:scale-105 shadow-lg"
                    aria-label={t('stopNavigation')}
                  >
                    {t('stopNavigation')}
                  </button>
                </div>
              )}

              <div className={`rounded-xl p-8 text-center border-2 ${
                settings.theme === 'light'
                  ? 'bg-white border-gray-300'
                  : 'bg-gray-800 border-gray-700'
              }`}>
                <Navigation size={64} className={`mx-auto mb-4 ${
                  settings.theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <p className={settings.theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Map view</p>
                <p className={`text-sm mt-2 ${
                  settings.theme === 'light' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Integrate Google Maps API for full functionality
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentMode === 'settings') {
    return (
      <>
        <EmergencyOverlay />
        <div className={`min-h-screen transition-colors duration-300 ${
          settings.theme === 'light' 
            ? 'bg-linear-to-b from-gray-50 to-gray-100 text-gray-900' 
            : 'bg-linear-to-b from-gray-900 to-gray-800 text-white'
        }`}>
          <div className="max-w-md mx-auto p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <button
                onClick={() => switchMode('home')}
                className={`p-3 rounded-full transition-all hover:scale-110 shadow-lg ${
                  settings.theme === 'light'
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
                aria-label="Return to home"
              >
                <Home size={28} />
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold">{t('settings')}</h2>
              <div className="w-14" />
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Theme Toggle */}
              <div className={`p-5 sm:p-6 rounded-xl shadow-lg ${
                settings.theme === 'light' ? 'bg-white' : 'bg-gray-800'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {settings.theme === 'light' ? <Sun size={28} /> : <Moon size={28} />}
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{settings.theme === 'light' ? t('lightMode') : t('darkMode')}</p>
                      <p className={`text-sm ${settings.theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        Theme preference
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newTheme = settings.theme === 'light' ? 'dark' : 'light';
                      setSettings((prev) => ({ ...prev, theme: newTheme }));
                      speak(`${newTheme === 'light' ? 'Light' : 'Dark'} mode enabled`);
                    }}
                    className={`w-16 sm:w-20 h-9 sm:h-10 rounded-full transition relative ${
                      settings.theme === 'light' ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                    aria-label={`Switch to ${settings.theme === 'light' ? 'dark' : 'light'} mode`}
                  >
                    <div
                      className={`w-7 sm:w-8 h-7 sm:h-8 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                        settings.theme === 'light' ? 'left-8 sm:left-11' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <div className={`p-5 sm:p-6 rounded-xl shadow-lg ${
                settings.theme === 'light' ? 'bg-white' : 'bg-gray-800'
              }`}>
                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                  <Languages size={28} />
                  <p className="text-xl sm:text-2xl font-bold">{t('language')}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { code: 'en' as Language, label: 'English' },
                    { code: 'ta' as Language, label: 'தமிழ்' },
                    { code: 'hi' as Language, label: 'हिंदी' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSettings((prev) => ({ ...prev, language: lang.code }));
                        speak(`Language changed to ${lang.label}`);
                      }}
                      className={`p-3 sm:p-4 rounded-lg text-base sm:text-lg font-semibold transition-all hover:scale-105 ${
                        settings.language === lang.code
                          ? 'bg-blue-600 text-white shadow-lg'
                          : settings.theme === 'light'
                            ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      aria-label={`Set language to ${lang.label}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Feedback */}
              <div className={`p-5 sm:p-6 rounded-xl shadow-lg ${
                settings.theme === 'light' ? 'bg-white' : 'bg-gray-800'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {settings.voiceEnabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{t('voiceFeedback')}</p>
                      <p className={`text-sm ${settings.theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        Audio alerts and instructions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSettings((prev) => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
                      speak(`Voice feedback ${!settings.voiceEnabled ? 'enabled' : 'disabled'}`);
                    }}
                    className={`w-16 sm:w-20 h-9 sm:h-10 rounded-full transition relative ${
                      settings.voiceEnabled ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                    aria-label={`Voice feedback ${settings.voiceEnabled ? 'enabled' : 'disabled'}`}
                  >
                    <div
                      className={`w-7 sm:w-8 h-7 sm:h-8 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                        settings.voiceEnabled ? 'left-8 sm:left-11' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Vibration */}
              <div className={`p-5 sm:p-6 rounded-xl shadow-lg ${
                settings.theme === 'light' ? 'bg-white' : 'bg-gray-800'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Vibrate size={28} />
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{t('vibration')}</p>
                      <p className={`text-sm ${settings.theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        Haptic feedback alerts
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSettings((prev) => ({
                        ...prev,
                        vibrationEnabled: !prev.vibrationEnabled,
                      }));
                      speak(`Vibration ${!settings.vibrationEnabled ? 'enabled' : 'disabled'}`);
                    }}
                    className={`w-16 sm:w-20 h-9 sm:h-10 rounded-full transition relative ${
                      settings.vibrationEnabled ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                    aria-label={`Vibration ${settings.vibrationEnabled ? 'enabled' : 'disabled'}`}
                  >
                    <div
                      className={`w-7 sm:w-8 h-7 sm:h-8 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                        settings.vibrationEnabled ? 'left-8 sm:left-11' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Volume Level */}
              <div className={`p-5 sm:p-6 rounded-xl shadow-lg ${
                settings.theme === 'light' ? 'bg-white' : 'bg-gray-800'
              }`}>
                <p className="text-xl sm:text-2xl font-bold mb-4">{t('volumeLevel')}</p>
                <div className="space-y-3">
                  {(['high', 'medium', 'low'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setSettings((prev) => ({ ...prev, volume: level }));
                        speak(`Volume set to ${level}`);
                      }}
                      className={`w-full p-3 sm:p-4 rounded-lg text-lg sm:text-xl font-semibold transition-all hover:scale-105 ${
                        settings.volume === level
                          ? 'bg-blue-600 text-white shadow-lg'
                          : settings.theme === 'light'
                            ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      aria-label={`Set volume to ${level}`}
                    >
                      {t(level)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detection Sensitivity */}
              <div className={`p-5 sm:p-6 rounded-xl shadow-lg ${
                settings.theme === 'light' ? 'bg-white' : 'bg-gray-800'
              }`}>
                <p className="text-xl sm:text-2xl font-bold mb-4">{t('detectionSensitivity')}</p>
                <p className={`text-sm mb-4 ${settings.theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  Adjust edge detection threshold
                </p>
                <div className="space-y-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.sensitivity}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      setSettings((prev) => ({ ...prev, sensitivity: newValue }));
                    }}
                    onMouseUp={() => speak(`Sensitivity set to ${settings.sensitivity} percent`)}
                    onTouchEnd={() => speak(`Sensitivity set to ${settings.sensitivity} percent`)}
                    className={`w-full h-3 rounded-lg appearance-none cursor-pointer accent-blue-600 ${
                      settings.theme === 'light' ? 'bg-gray-300' : 'bg-gray-700'
                    }`}
                    aria-label="Adjust detection sensitivity"
                  />
                  <div className={`flex justify-between text-sm ${
                    settings.theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    <span>{t('low')}</span>
                    <span className="text-blue-500 font-bold text-base sm:text-lg">{settings.sensitivity}%</span>
                    <span>{t('high')}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  speak('Testing voice and vibration');
                  vibrate([200, 100, 200]);
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 sm:py-5 rounded-xl text-lg sm:text-xl font-bold transition-all hover:scale-105 shadow-lg"
                aria-label={t('testAlerts')}
              >
                {t('testAlerts')}
              </button>

              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.localStorage.removeItem('tutorialShown');
                  }
                  setShowTutorial(true);
                  setTutorialStep(0);
                  speak('Tutorial restarted');
                }}
                className={`w-full py-4 rounded-xl text-base sm:text-lg font-semibold transition-all hover:scale-105 shadow-lg ${
                  settings.theme === 'light'
                    ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
                aria-label="Show tutorial again"
              >
                Show Tutorial Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default AssistiveVisionPage;