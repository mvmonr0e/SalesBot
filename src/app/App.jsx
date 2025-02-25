import { useEffect, useState } from "react";
import Button from "./components/base/Button";
import Vapi from "@vapi-ai/web";
import { isPublicKeyMissingError } from "./utils";
import supabase from "./utils/supabaseClient";
import ActiveCallDetail from "./components/ActiveCallDetail";


// Initialize Vapi
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_KEY);


const App = () => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callId, setCallId] = useState(null);
  const [callData, setCallData] = useState(null);
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  
  const { showPublicKeyInvalidMessage, setShowPublicKeyInvalidMessage } = usePublicKeyInvalid();

  const fetchCallData = async (callId, attempt = 1) => {
    if (!callId) {
      console.error("callId is undefined, cannot fetch data.");
      return;
    }
  
    console.log(`Fetching data for Call ID: ${callId}, Attempt: ${attempt}`);
  
    const { data, error } = await supabase
      .from("interviews")
      .select("transcript, summary, clarity, relevance, persuasiveness")
      .eq("call_id", callId)
      .maybeSingle(); // Ensures null instead of an error if no row is found
  
    if (error) {
      console.error("Error fetching call data:", error);
      return;
    }
  
    if (!data) {
      console.warn(`No data found yet for call_id: ${callId}, retrying in 2 seconds...`);
  
      if (attempt < 5) { // Retry up to 5 times
        setTimeout(() => fetchCallData(callId, attempt + 1), 2000);
      } else {
        console.error("Failed to fetch call data after multiple attempts.");
      }
      return;
    }
  
    console.log("Fetched Call Data:", data);
    setCallData(data); // Store data in state
  };
  
  // Hook into Vapi events
  useEffect(() => {
    vapi.on("call-start", () => {
      console.log("starting call");
      setConnecting(false);
      setConnected(true);
      setShowPublicKeyInvalidMessage(false);
    });

    vapi.on("call-end", () => {
      console.log(`Call ended. Waiting before fetching data for Call ID: ${callId}...`);
      
      setConnecting(false);
      setConnected(false);
      setFetchingTranscript(true);

      setTimeout(() => {
        fetchCallData(callId); // Start polling for data
      }, 3000); // Wait 3 seconds before fetching
      setFetchingTranscript(false); 
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
  const startCall = async () => {
    setConnecting(true);
  
    try {
      const call = await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID);
      console.log("Call started:", call);
  
      setCallId(call.id); 
      console.log("Call ID:", call.id);
    } catch (error) {
      console.error("Error starting call:", error);
      setConnecting(false);
    }
  };
  
  const endCall = () => {
    vapi.stop();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen p-4">
      {/* Start Interview Button (Only show when not fetching transcript) */}
      {!connected && !fetchingTranscript && !callData && (
        <Button
          label="Start Interview"
          onClick={startCall}
          isLoading={connecting}
          className="mb-4"
        />
      )}
  
      {/* Active Call UI */}
      {connected && (
        <ActiveCallDetail
          assistantIsSpeaking={assistantIsSpeaking}
          volumeLevel={volumeLevel}
          onEndCallClick={endCall}
        />
      )}
  
      {/* Loading indicator while fetching transcript */}
      {fetchingTranscript && (
        <Button label="Fetching transcript..." isLoading={true} disabled />
      )}
  
      {/* Display Call Summary & Scores After Call Ends */}
      {!connected && !fetchingTranscript && callData && (
        <div className="bg-black text-white w-3/4 h-48 p-4 rounded-lg border border-gray-600 overflow-auto whitespace-pre-wrap mt-4">
          <p><strong>Transcript:</strong> {callData.transcript || "No transcript available"}</p>
          <p><strong>Summary:</strong> {callData.summary?.replace(/^summary:\s*/i, "") || "No summary available"}</p>
          <p><strong>Clarity:</strong> {callData.clarity !== undefined ? `${callData.clarity}/5` : "N/A"}</p>
          <p><strong>Relevance:</strong> {callData.relevance !== undefined ? `${callData.relevance}/5` : "N/A"}</p>
          <p><strong>Persuasiveness:</strong> {callData.persuasiveness !== undefined ? `${callData.persuasiveness}/5` : "N/A"}</p>
        </div>
      )}
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
