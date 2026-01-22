import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Lista de vistas materializadas a refrescar
const MATERIALIZED_VIEWS = [
  'mv_agenda_resumen',
  'mv_cartera_analisis',
  'mv_clientes_resumen',
  'mv_leads_pipeline',
  'mv_saldos_consolidado'
];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting dashboard refresh...');

    const results: { view: string; success: boolean; error?: string }[] = [];

    // Refrescar cada vista materializada
    for (const viewName of MATERIALIZED_VIEWS) {
      console.log(`Refreshing view: ${viewName}`);
      
      const { data, error } = await supabase.rpc('refresh_view', { 
        view_name: viewName 
      });

      if (error) {
        console.error(`Error refreshing ${viewName}:`, error);
        results.push({ 
          view: viewName, 
          success: false, 
          error: error.message 
        });
      } else {
        console.log(`Successfully refreshed ${viewName}`);
        results.push({ 
          view: viewName, 
          success: true 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedViews = results.filter(r => !r.success);

    console.log(`Dashboard refresh complete: ${successCount}/${MATERIALIZED_VIEWS.length} views refreshed`);

    return new Response(
      JSON.stringify({
        success: failedViews.length === 0,
        message: `${successCount}/${MATERIALIZED_VIEWS.length} vistas actualizadas`,
        results,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error refreshing dashboard:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
