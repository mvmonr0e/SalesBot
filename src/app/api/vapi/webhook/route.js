/* eslint-disable prettier/prettier */
import supabase from "@/app/utils/supabaseClient";

export async function POST(req) {
    try {
      const { message } = await req.json(); // Parse Vapi payload
  
      if (!message || message.type !== "end-of-call-report") {
        return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
      } 

      // Extract relevant data
      const call_id = message.call?.id;
      const summary = message.analysis?.summary || "";
      const transcript = message.artifact?.transcript || "";
      const clarity = message.analysis.structuredData.clarity;
      const relevance = message.analysis.structuredData.relevance;
      const persuasiveness = message.analysis.structuredData.persuasiveness;

      // Insert into Supabase
      const { error } = await supabase
        .from("interviews") // Your Supabase table
        .insert([
          {
            transcript,
            summary,
            clarity,
            relevance,
            persuasiveness,
            call_id
          },
        ]);
  
      if (error) throw error;
  
      return new Response(JSON.stringify({ message: "Data saved to Supabase" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error saving to Supabase:", error);
      return new Response(JSON.stringify({ error: "Failed to save data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }