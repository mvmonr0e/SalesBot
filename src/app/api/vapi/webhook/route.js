/* eslint-disable prettier/prettier */
import supabase from "@/app/utils/supabaseClient";

export async function POST(req) {
    try {
      // Parse the request JSON body to extract the message payload
      const { message } = await req.json(); 
      
      // Validate the request, ensuring it contains an end-of-call report
      if (!message || message.type !== "end-of-call-report") {
        return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
      } 

      // Extract relevant call details and analysis data from the message
      const call_id = message.call?.id;
      const summary = message.analysis?.summary || "";
      const transcript = message.artifact?.transcript || "";
      const clarity = message.analysis.structuredData.clarity;
      const relevance = message.analysis.structuredData.relevance;
      const persuasiveness = message.analysis.structuredData.persuasiveness;

      // Insert extracted data into the "interviews" table in Supabase
      const { error } = await supabase
        .from("interviews") 
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
      
      // Handle errors during insertion
      if (error) throw error;
      
      // Return success response if data is saved successfully
      return new Response(JSON.stringify({ message: "Data saved to Supabase" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Log error and return failure response
      console.error("Error saving to Supabase:", error);
      return new Response(JSON.stringify({ error: "Failed to save data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }