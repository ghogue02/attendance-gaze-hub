
// Create a Supabase Edge Function that provides backend functionality
// including direct database operations for maintenance tasks

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key (needed for RPC operations)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request payload
    const { name, params } = await req.json();

    // Define available RPC functions
    const rpcFunctions = {
      force_delete_attendance_by_date: async (params: { target_date: string }) => {
        const { target_date } = params;
        console.log(`Force deleting attendance records for date: ${target_date}`);
        
        // Execute direct SQL to delete records
        const { data, error } = await supabaseClient
          .from('attendance')
          .delete()
          .eq('date', target_date)
          .select('count');
        
        if (error) throw error;
        return data || { count: 0 };
      },
      
      count_face_registrations: async () => {
        const { data, error } = await supabaseClient
          .from('face_registrations')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { count: data };
      },
      
      insert_face_registration: async (params: any) => {
        const { data, error } = await supabaseClient
          .from('face_registrations')
          .insert(params)
          .select();
        
        if (error) throw error;
        return data;
      }
    };

    // Check if requested function exists
    if (!rpcFunctions[name as keyof typeof rpcFunctions]) {
      return new Response(
        JSON.stringify({
          error: `Function "${name}" not found`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Call the requested function
    const result = await rpcFunctions[name as keyof typeof rpcFunctions](params);

    // Return success response
    return new Response(
      JSON.stringify({
        data: result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
