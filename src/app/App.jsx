import { useEffect, useState } from "react";
import Button from "./components/base/Button";
import Vapi from "@vapi-ai/web";
import { isPublicKeyMissingError } from "./utils";
import supabase from "./utils/supabaseClient";
import ActiveCallDetail from "./components/ActiveCallDetail";


// Initialize Vapi
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_KEY);


const App = () => {
  // state variables to manage UI and call status
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callId, setCallId] = useState(null);
  const [callData, setCallData] = useState(null);
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  
  //Custom hook to manage invalid public key status
  const { showPublicKeyInvalidMessage, setShowPublicKeyInvalidMessage } = usePublicKeyInvalid();

  // fetch call data from supabase using the call ID
  const fetchCallData = async (callId, attempt = 1) => {
    if (!callId) {
      console.warn("callId is undefined, cannot fetch data.");
      return;
    }
  
    console.log(`Fetching data for Call ID: ${callId}, Attempt: ${attempt}`);
  
    const { data, error } = await supabase
      .from("interviews")
      .select("transcript, summary, clarity, relevance, persuasiveness")
      .eq("call_id", callId)
      .maybeSingle(); 
  
    if (error) {
      console.error("Error fetching call data:", error);
      return;
    }
  
    if (!data) {
      console.warn(`No data found yet for call_id: ${callId}, retrying in 2 seconds...`);
  
      if (attempt < 5) { 
        setTimeout(() => fetchCallData(callId, attempt + 1), 2000);
      } else {
        console.error("Failed to fetch call data after multiple attempts.");
      }
      return;
    }
  
    console.log("Fetched Call Data:", data);
    setCallData(data); 
    setFetchingTranscript(false);
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
        fetchCallData(callId); 
      }, 3000); 
 
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

  // start vapi call
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
  
  // end vapi call
  const endCall = () => {
    vapi.stop();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen p-4">
      {/* Start Interview Button - Shows Loading When Connecting or Fetching Transcript */}
      {!connected && (
        <Button
          label={fetchingTranscript ? "Fetching Transcript..." : "Start Interview"}
          onClick={startCall}
          isLoading={connecting || fetchingTranscript}
          disabled={connecting || fetchingTranscript}
          className="mb-4"
        />
      )}
  
      {/* Active Call Details (Only Show When Connected) */}
      {connected && (
        <ActiveCallDetail
          assistantIsSpeaking={assistantIsSpeaking}
          volumeLevel={volumeLevel}
          onEndCallClick={endCall}
        />
      )}
  
      {/* Text Box for Call Data (Only Show After Transcript is Fetched) */}
      {callData && !connected && !fetchingTranscript && (
        <textarea
          className="bg-black text-white w-4/5 h-80 p-4 rounded-lg border border-gray-600 resize-none mt-4"
          value={`Summary: ${callData.summary.replace(/^summary:\s*/i, "")}\n\nClarity: ${callData.clarity}/5\nRelevance: ${callData.relevance}/5\nPersuasiveness: ${callData.persuasiveness}/5\n\nTranscript:\n${callData.transcript}`}
          readOnly
        />
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
