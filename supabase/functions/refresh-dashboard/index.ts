import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Vistas materializadas en schema analytics (capa 1 - datos crudos transformados)
const ANALYTICS_VIEWS = [
  'fact_turnos',
  'fact_cartera_pasiva',
  'fact_leads',
  'dim_clientes',
  'dim_origen',
  'dim_procedimiento',
  'dim_profesional'
];

// Vistas materializadas en schema dashboard (capa 2 - agregaciones para UI)
const DASHBOARD_VIEWS = [
  'finanzas_diario',
  'finanzas_deudores',
  'finanzas_recupero_master',
  'finanzas_deuda_aging',
  'finanzas_prioridades',
  'finanzas_por_profesional',
  'finanzas_por_procedimiento',
  'operaciones_diario',
  'operaciones_heatmap',
  'operaciones_capacidad',
  'comercial_embudo',
  'comercial_canales'
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

    const results: { view: string; schema: string; success: boolean; error?: string }[] = [];

    // PASO 1: Refrescar vistas de analytics (datos base)
    console.log('=== Refreshing ANALYTICS views ===');
    for (const viewName of ANALYTICS_VIEWS) {
      console.log(`Refreshing analytics.${viewName}`);
      
      const { data, error } = await supabase.rpc('refresh_view', { 
        view_name: viewName 
      });

      if (error) {
        console.error(`Error refreshing analytics.${viewName}:`, error);
        results.push({ 
          view: viewName,
          schema: 'analytics',
          success: false, 
          error: error.message 
        });
      } else {
        console.log(`Successfully refreshed analytics.${viewName}`);
        results.push({ 
          view: viewName,
          schema: 'analytics',
          success: true 
        });
      }
    }

    // PASO 2: Refrescar vistas de dashboard (agregaciones UI)
    console.log('=== Refreshing DASHBOARD views ===');
    for (const viewName of DASHBOARD_VIEWS) {
      console.log(`Refreshing dashboard.${viewName}`);
      
      // Usar SQL directo para refrescar en schema dashboard
      const { data, error } = await supabase.rpc('execute_sql', { 
        query: `REFRESH MATERIALIZED VIEW dashboard.${viewName}` 
      });

      if (error) {
        console.error(`Error refreshing dashboard.${viewName}:`, error);
        results.push({ 
          view: viewName,
          schema: 'dashboard',
          success: false, 
          error: error.message 
        });
      } else if (data && !data.success) {
        console.error(`Error refreshing dashboard.${viewName}:`, data.error);
        results.push({ 
          view: viewName,
          schema: 'dashboard',
          success: false, 
          error: data.error 
        });
      } else {
        console.log(`Successfully refreshed dashboard.${viewName}`);
        results.push({ 
          view: viewName,
          schema: 'dashboard',
          success: true 
        });
      }
    }

    const analyticsSuccess = results.filter(r => r.schema === 'analytics' && r.success).length;
    const dashboardSuccess = results.filter(r => r.schema === 'dashboard' && r.success).length;
    const totalSuccess = results.filter(r => r.success).length;
    const totalViews = ANALYTICS_VIEWS.length + DASHBOARD_VIEWS.length;
    const failedViews = results.filter(r => !r.success);

    console.log(`Dashboard refresh complete: ${totalSuccess}/${totalViews} views refreshed`);
    console.log(`  - Analytics: ${analyticsSuccess}/${ANALYTICS_VIEWS.length}`);
    console.log(`  - Dashboard: ${dashboardSuccess}/${DASHBOARD_VIEWS.length}`);

    return new Response(
      JSON.stringify({
        success: failedViews.length === 0,
        message: `${totalSuccess}/${totalViews} vistas actualizadas (Analytics: ${analyticsSuccess}, Dashboard: ${dashboardSuccess})`,
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
