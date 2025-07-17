// src/hooks/useVoiceRecognition.js
import { useEffect, useState } from "react";

const useVoiceRecognition = (onCommandRecognized) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    const startListening = () => {
      recognition.start();
      setIsListening(true);
    };

    const stopListening = () => {
      recognition.stop();
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript;
      setTranscript(speech);
      if (onCommandRecognized) onCommandRecognized(speech);
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
    };

    if (isListening) {
      startListening();
    }

    return () => {
      stopListening();
    };
  }, [isListening, onCommandRecognized]);

  return { isListening, setIsListening, transcript };
};

export default useVoiceRecognition;
