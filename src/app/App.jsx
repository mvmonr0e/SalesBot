import { useEffect, useState } from "react";
import ActiveCallDetail from "./components/ActiveCallDetail";
import Button from "./components/base/Button";
import Vapi from "@vapi-ai/web";
import { isPublicKeyMissingError } from "./utils";

// Initialize Vapi
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_KEY);

var globalCallId = -1

const App = () => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callId, setCallId] = useState(null);
  
  const { showPublicKeyInvalidMessage, setShowPublicKeyInvalidMessage } = usePublicKeyInvalid();

  // Hook into Vapi events
  useEffect(() => {
    vapi.on("call-start", () => {
      console.log("starting call");
      setConnecting(false);
      setConnected(true);
      setShowPublicKeyInvalidMessage(false);
    });

    vapi.on("call-end", () => {
      console.log("ending call");
      setConnecting(false);
      setConnected(false);
      setShowPublicKeyInvalidMessage(false);
      setCallId(null);
    });

    vapi.on("speech-start", () => setAssistantIsSpeaking(true));
    vapi.on("speech-end", () => setAssistantIsSpeaking(false));
    vapi.on("volume-level", (level) => setVolumeLevel(level));

    vapi.on("error", () => {
      console.error(error);
      setConnecting(false);
      if (isPublicKeyMissingError({ vapiError: error })) {
        setShowPublicKeyInvalidMessage(true);
      }
    });
  }, [callId]); // Depend on callId to ensure it's available

  // Call start handler
  const startCall = () => {
    setConnecting(true);
    const call = vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID);
    // set call id
    setCallId(call.id);
    globalCallId = call.id;
  };
  
  const endCall = () => {
    vapi.stop();
  };

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {!connected ? (
        <Button label="Start Interview" onClick={startCall} isLoading={connecting} />
      ) : (
        <ActiveCallDetail
          assistantIsSpeaking={assistantIsSpeaking}
          volumeLevel={volumeLevel}
          onEndCallClick={endCall}
        />
      )}
      {showPublicKeyInvalidMessage ? <PleaseSetYourPublicKeyMessage /> : null}
    </div>
  );
};

// Utility hooks
const usePublicKeyInvalid = () => {
  const [showPublicKeyInvalidMessage, setShowPublicKeyInvalidMessage] = useState(false);

  useEffect(() => {
    if (showPublicKeyInvalidMessage) {
      setTimeout(() => setShowPublicKeyInvalidMessage(false), 3000);
    }
  }, [showPublicKeyInvalidMessage]);

  return { showPublicKeyInvalidMessage, setShowPublicKeyInvalidMessage };
};

// Public Key Error Message Component
const PleaseSetYourPublicKeyMessage = () => (
  <div
    style={{
      position: "fixed",
      bottom: "25px",
      left: "25px",
      padding: "10px",
      color: "#fff",
      backgroundColor: "#f03e3e",
      borderRadius: "5px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    }}
  >
    Is your Vapi Public Key missing? (recheck your code)
  </div>
);

export default App;
