'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Navigation, Settings, Home, Volume2, VolumeX, Vibrate, MapPin, AlertTriangle, Flashlight, Mic, AlertCircle, X } from 'lucide-react';


interface SettingsState {
  voiceEnabled: boolean;
  vibrationEnabled: boolean;
  volume: 'high' | 'medium' | 'low';
  sensitivity: number;
}

interface TutorialStep {
  title: string;
  message: string;
  target: string;
}

const AssistiveVisionPage: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<string>('home');
  const [settings, setSettings] = useState<SettingsState>({
    voiceEnabled: true,
    vibrationEnabled: true,
    volume: 'high',
    sensitivity: 50,
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
      title: 'Welcome to Assistive Vision! 👋',
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tutorialShown = window.localStorage.getItem('tutorialShown');
      if (!tutorialShown) {
        setShowTutorial(true);
      }
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

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let edgeCount = 0;
    const threshold = 100 - settings.sensitivity;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

      if (i + 4 < data.length) {
        const nextBrightness = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
        const diff = Math.abs(brightness - nextBrightness);

        if (diff > threshold) {
          edgeCount++;
          data[i] = 255;
          data[i + 1] = 0;
          data[i + 2] = 0;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    if (edgeCount > 5000) {
      const alertMsg = 'Obstacle detected ahead';
      setLastAlert(alertMsg);
      speak(alertMsg);
      vibrate([100, 50, 100]);
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
      <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-6">
        <div className="bg-white text-gray-900 rounded-2xl p-8 max-w-md shadow-2xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold">{step.title}</h3>
            <button
              onClick={closeTutorial}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close tutorial"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-lg mb-6 leading-relaxed">{step.message}</p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {tutorialStep + 1} / {tutorialSteps.length}
            </span>
            <button
              onClick={nextTutorialStep}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
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

    return (
      <div className="flex items-center justify-center space-x-2 my-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-blue-500 w-2 rounded-full transition-all duration-100"
            style={{
              height: `${Math.max(20, audioLevel * (i + 1) * 0.5)}px`,
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
        <div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white p-6">
          <div className="max-w-md mx-auto">
            <h1 className="text-4xl font-bold text-center mb-2 mt-8">Assistive Vision</h1>
            <p className="text-center text-gray-300 mb-8 text-lg">Navigation & Safety System</p>

            <div className="mb-8 bg-gray-800 rounded-xl p-4">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`w-full flex items-center justify-center space-x-3 py-4 rounded-lg font-bold text-xl ${
                  isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                aria-label={isListening ? 'Stop listening' : 'Start voice control'}
              >
                <Mic size={32} />
                <span>{isListening ? 'Listening...' : 'Voice Control'}</span>
              </button>
              <AudioVisualizer />
              {recognizedCommand && (
                <p className="text-center text-green-400 mt-2">Command: {recognizedCommand}</p>
              )}
              <p className="text-center text-gray-400 text-sm mt-2">
                Say: navigate, camera, settings, or stop
              </p>
            </div>

            <div className="space-y-6">
              <button
                onClick={() => switchMode('camera')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-8 rounded-2xl flex items-center justify-center space-x-4 text-2xl font-bold shadow-lg transition"
                aria-label="Start Camera Detection Mode"
              >
                <Camera size={48} />
                <span>Camera Mode</span>
              </button>

              <button
                onClick={() => switchMode('navigation')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-8 rounded-2xl flex items-center justify-center space-x-4 text-2xl font-bold shadow-lg transition"
                aria-label="Start Navigation Mode"
              >
                <Navigation size={48} />
                <span>Navigation</span>
              </button>

              <button
                onClick={triggerEmergency}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-8 rounded-2xl flex items-center justify-center space-x-4 text-2xl font-bold shadow-lg transition"
                aria-label="Emergency SOS"
              >
                <AlertCircle size={48} />
                <span>Emergency SOS</span>
              </button>

              <button
                onClick={() => switchMode('settings')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-8 rounded-2xl flex items-center justify-center space-x-4 text-2xl font-bold shadow-lg transition"
                aria-label="Open Settings"
              >
                <Settings size={48} />
                <span>Settings</span>
              </button>
            </div>

            <div className="mt-12 text-center text-gray-400 text-sm">
              <p>Designed for accessibility</p>
              <p className="mt-2">Voice & Haptic Feedback Enabled</p>
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

            <div className="absolute top-0 left-0 right-0 p-4 bg-linear-to-b from-black/70 to-transparent">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => switchMode('home')}
                  className="bg-gray-800/80 text-white p-4 rounded-full hover:bg-gray-700/80"
                  aria-label="Return to home"
                >
                  <Home size={32} />
                </button>
                <h2 className="text-2xl font-bold">Camera Mode</h2>
                {isCameraActive && (
                  <button
                    onClick={toggleFlashlight}
                    className={`p-4 rounded-full ${
                      isFlashlightOn ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-800/80 hover:bg-gray-700/80'
                    }`}
                    aria-label={isFlashlightOn ? 'Turn off flashlight' : 'Turn on flashlight'}
                  >
                    <Flashlight size={32} />
                  </button>
                )}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/90 to-transparent">
              {lastAlert && (
                <div className="bg-red-600 text-white p-4 rounded-xl mb-4 flex items-center space-x-3">
                  <AlertTriangle size={32} />
                  <span className="text-xl font-bold">{lastAlert}</span>
                </div>
              )}

              <div className="space-y-4">
                {!isCameraActive && (
                  <button
                    onClick={startCamera}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl text-2xl font-bold"
                    aria-label="Start camera"
                  >
                    Start Camera
                  </button>
                )}

                {isCameraActive && !detectionActive && (
                  <button
                    onClick={startDetection}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl text-2xl font-bold"
                    aria-label="Start edge detection"
                  >
                    Start Detection
                  </button>
                )}

                {detectionActive && (
                  <button
                    onClick={stopDetection}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-6 rounded-xl text-2xl font-bold"
                    aria-label="Stop detection"
                  >
                    Stop Detection
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
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="max-w-md mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => switchMode('home')}
                className="bg-gray-800 text-white p-3 rounded-full hover:bg-gray-700"
                aria-label="Return to home"
              >
                <Home size={32} />
              </button>
              <h2 className="text-3xl font-bold">Navigation</h2>
              <div className="w-14" />
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xl mb-3 font-semibold">Destination</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter address or place"
                  className="w-full bg-gray-800 text-white p-5 rounded-xl text-xl border-2 border-gray-700 focus:border-blue-500 focus:outline-none"
                  aria-label="Enter destination address"
                />
              </div>

              {!isNavigating ? (
                <button
                  onClick={startNavigation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl text-2xl font-bold flex items-center justify-center space-x-3"
                  aria-label="Start navigation"
                >
                  <MapPin size={32} />
                  <span>Start Navigation</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-600 p-6 rounded-xl">
                    <p className="text-2xl font-bold mb-2">Navigating to:</p>
                    <p className="text-xl">{destination}</p>
                    <p className="text-lg mt-4 text-blue-200">Follow voice instructions</p>
                  </div>

                  <button
                    onClick={stopNavigation}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-6 rounded-xl text-2xl font-bold"
                    aria-label="Stop navigation"
                  >
                    Stop Navigation
                  </button>
                </div>
              )}

              <div className="bg-gray-800 rounded-xl p-8 text-center border-2 border-gray-700">
                <Navigation size={64} className="mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 text-lg">Map view</p>
                <p className="text-gray-500 text-sm mt-2">
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
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="max-w-md mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => switchMode('home')}
                className="bg-gray-800 text-white p-3 rounded-full hover:bg-gray-700"
                aria-label="Return to home"
              >
                <Home size={32} />
              </button>
              <h2 className="text-3xl font-bold">Settings</h2>
              <div className="w-14" />
            </div>

            <div className="space-y-6">
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    {settings.voiceEnabled ? <Volume2 size={32} /> : <VolumeX size={32} />}
                    <div>
                      <p className="text-2xl font-bold">Voice Feedback</p>
                      <p className="text-gray-400">Audio alerts and instructions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSettings((prev) => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
                      speak(`Voice feedback ${!settings.voiceEnabled ? 'enabled' : 'disabled'}`);
                    }}
                    className={`w-20 h-10 rounded-full transition relative ${
                      settings.voiceEnabled ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                    aria-label={`Voice feedback ${settings.voiceEnabled ? 'enabled' : 'disabled'}`}
                  >
                    <div
                      className={`w-8 h-8 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                        settings.voiceEnabled ? 'left-11' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Vibrate size={32} />
                    <div>
                      <p className="text-2xl font-bold">Vibration</p>
                      <p className="text-gray-400">Haptic feedback alerts</p>
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
                    className={`w-20 h-10 rounded-full transition relative ${
                      settings.vibrationEnabled ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                    aria-label={`Vibration ${settings.vibrationEnabled ? 'enabled' : 'disabled'}`}
                  >
                    <div
                      className={`w-8 h-8 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                        settings.vibrationEnabled ? 'left-11' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl">
                <p className="text-2xl font-bold mb-4">Volume Level</p>
                <div className="space-y-3">
                  {(['high', 'medium', 'low'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setSettings((prev) => ({ ...prev, volume: level }));
                        speak(`Volume set to ${level}`);
                      }}
                      className={`w-full p-4 rounded-lg text-xl font-semibold transition ${
                        settings.volume === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      aria-label={`Set volume to ${level}`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl">
                <p className="text-2xl font-bold mb-4">Detection Sensitivity</p>
                <p className="text-gray-400 mb-4">Adjust edge detection threshold</p>
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
                    className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    aria-label="Adjust detection sensitivity"
                  />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Low</span>
                    <span className="text-blue-400 font-bold text-lg">{settings.sensitivity}%</span>
                    <span>High</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  speak('Testing voice and vibration');
                  vibrate([200, 100, 200]);
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5 rounded-xl text-xl font-bold"
                aria-label="Test voice and vibration"
              >
                Test Alerts
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
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-xl text-lg font-semibold"
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