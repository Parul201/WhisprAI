import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import "./App.css";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = false;

function App() {
  const [userName, setUserName] = useState(
    localStorage.getItem("username") || ""
  );
  const [command, setCommand] = useState("");
  const [step, setStep] = useState(userName ? 1 : 0);
  const [pendingUrl, setPendingUrl] = useState(null);
  const isRecognizing = useRef(false); // 👈 track recognition status

  const speak = (text) => {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";

    const voices = synth.getVoices();
    const femaleVoice = voices.find(
      (v) =>
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("aria") ||
        (v.gender && v.gender.toLowerCase() === "female")
    );

    utter.voice = femaleVoice || voices[0];
    synth.cancel();
    synth.speak(utter);
  };

  const extractName = (input) => {
    const patterns = [
      /my name is (.+)/i,
      /i am (.+)/i,
      /this is (.+)/i,
      /^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)$/i,
    ];

    for (let pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  };

  const handleVoiceInput = useCallback(
    async (spoken) => {
      const lower = spoken.toLowerCase();

      if (step === 10) {
        const name = extractName(spoken);
        if (!name || name.length > 25) {
          speak("I didn't catch your name clearly. Please try again.");
          startRecognition();
          return;
        }

        setUserName(name);
        localStorage.setItem("username", name);
        speak(`Hello ${name}, how can I help you?`);
        setStep(1);
        return;
      }

      if (!userName) {
        speak("Please tell me your name first.");
        setStep(10);
        startRecognition();
        return;
      }

      setCommand(spoken);
      setStep(1);

      try {
        await axios.post("http://localhost:5000/api/user/save", {
          name: userName,
          command: spoken,
        });
      } catch (err) {
        console.error("❌ Error saving:", err);
      }

      if (lower === "logout" || lower.includes("logout this account")) {
        localStorage.removeItem("username");
        setUserName("");
        setStep(0);
        speak("Logged out. Please tell me your name to continue.");
        return;
      }

      if (lower.startsWith("open ")) {
        const site = spoken.slice(5).trim();
        const url = site.startsWith("http") ? site : `https://${site}`;
        setPendingUrl(url);
        return;
      }

      if (lower.startsWith("play a song ")) {
        const song = spoken.slice(10).trim();
        speak(`Playing ${song} on YouTube`);
        const query = encodeURIComponent(song);
        const url = `https://www.youtube.com/results?search_query=${query}`;
        setPendingUrl(url);
        return;
      }

      speak("Sorry, I didn't understand that.");
    },
    [step, userName]
  );

  const startRecognition = () => {
    if (!isRecognizing.current) {
      try {
        recognition.start();
        isRecognizing.current = true;
      } catch (e) {
        console.warn("🎤 Already started:", e.message);
      }
    }
  };

  // Voice recognition handlers
  useEffect(() => {
    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript.trim();
      console.log("🗣 Voice Input:", spoken);
      isRecognizing.current = false;
      handleVoiceInput(spoken);
    };

    recognition.onerror = (e) => {
      console.error("🎤 Error:", e.error);
      isRecognizing.current = false;
      setStep(1);
    };

    recognition.onend = () => {
      isRecognizing.current = false;
    };
  }, [handleVoiceInput]);

  // Greet on first login
  useEffect(() => {
    if (userName && step === 1) {
      speak(`Welcome, ${userName}. Tap anywhere to speak.`);
    }
  }, [userName, step]);

  // Initial greeting
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!userName && voices.length) {
        speak("Hello, may I know your good name please?");
        setStep(10);
        startRecognition();
      }
    };

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    loadVoices();
  }, [userName]);

  // Open URL
  useEffect(() => {
    if (pendingUrl) {
      window.open(pendingUrl, "_blank");
      setPendingUrl(null);
    }
  }, [pendingUrl]);

  const handleScreenClick = () => {
    startRecognition();
  };

  return (
    <div className="container" onClick={handleScreenClick}>
      <h1>👋 Voice Assistant for Visually Impaired</h1>
      <p>Tap anywhere to talk</p>
      {userName && <h3>Hello, {userName}!</h3>}
      {command && (
        <p>
          ✅ Last Command: <strong>{command}</strong>
        </p>
      )}
    </div>
  );
}

export default App;
