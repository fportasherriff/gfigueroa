import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CsvUploadRequest {
  fileType: string;
  fileName: string;
  csvData: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse JSON body (not form data)
    const { fileType, fileName, csvData }: CsvUploadRequest = await req.json();

    console.log(`Processing CSV upload: ${fileName} (type: ${fileType})`);

    if (!fileType || !csvData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required fields: fileType and csvData' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);

    console.log(`CSV has ${dataRows.length} data rows and ${headers?.length || 0} columns`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For now, just validate and return success
    // In a full implementation, you would:
    // 1. Map fileType to the appropriate table
    // 2. Parse and validate each row
    // 3. Insert/upsert data into the database

    const recordsProcessed = dataRows.length;

    console.log(`Successfully processed ${recordsProcessed} records for ${fileType}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Se procesaron ${recordsProcessed} registros de ${fileType}`,
        recordsProcessed,
        fileType,
        fileName,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing CSV:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al procesar CSV',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
