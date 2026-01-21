import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TableDefinition {
  label: string;
  required: boolean;
  signatureColumns: string[];
  allColumns: string[];
}

interface CsvUploadRequest {
  fileType?: string;
  fileName: string;
  csvData: string;
}

// Configuración de tablas con columnas signature para auto-detección
// TODAS LAS TABLAS SON REQUERIDAS (5 archivos obligatorios)
const TABLE_DEFINITIONS: Record<string, TableDefinition> = {
  'listado_clientes': {
    label: 'Listado Clientes',
    required: true,
    signatureColumns: ['ID', 'Apellido y Nombre', 'DNI'],
    allColumns: ['ID', 'Apellido y Nombre', 'Fecha', 'DNI', 'Estado', 'Telefono', 'Celular', 'EMail', 'Origen', 'Sucursal']
  },
  'agenda_detallada': {
    label: 'Agenda Detallada',
    required: true,
    signatureColumns: ['Fecha', 'Hora', 'Paciente'],
    allColumns: ['Fecha', 'Hora', 'Paciente', 'Profesional', 'Prestacion', 'Estado', 'Observaciones', 'Sucursal']
  },
  'cartera_pasiva': {
    label: 'Cartera Pasiva',
    required: true,
    signatureColumns: ['Cliente', 'Ultima Visita', 'Dias Inactivo'],
    allColumns: ['Cliente', 'Ultima Visita', 'Dias Inactivo', 'Telefono', 'Email', 'Sucursal', 'Profesional']
  },
  'leads': {
    label: 'Leads',
    required: true,
    signatureColumns: ['Nombre', 'Origen', 'Fecha Ingreso'],
    allColumns: ['Nombre', 'Telefono', 'Email', 'Origen', 'Fecha Ingreso', 'Estado', 'Comentarios', 'Sucursal']
  },
  'saldos': {
    label: 'Saldos',
    required: true,
    signatureColumns: ['Cliente', 'Saldo', 'Fecha Ultimo Movimiento'],
    allColumns: ['Cliente', 'Saldo', 'Fecha Ultimo Movimiento', 'Tipo', 'Sucursal']
  }
}

// Función para detectar el tipo de tabla basado en las columnas del CSV
function detectTableType(headers: string[]): string | null {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  
  for (const [tableKey, config] of Object.entries(TABLE_DEFINITIONS)) {
    const signatureLower = config.signatureColumns.map(c => c.toLowerCase());
    const matchCount = signatureLower.filter(sig => 
      normalizedHeaders.some(h => h.includes(sig) || sig.includes(h))
    ).length;
    
    if (matchCount >= 2) {
      return tableKey;
    }
  }
  
  return null;
}

// Función para parsear una línea CSV respetando comillas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileType, fileName, csvData }: CsvUploadRequest = await req.json();

    console.log(`Processing CSV upload: ${fileName} (type: ${fileType})`);

    if (!csvData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          stage: 'validation',
          errors: ['No se proporcionaron datos CSV'] 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          stage: 'validation',
          errors: ['El archivo CSV debe tener al menos una fila de encabezados y una de datos'] 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const headers = parseCSVLine(lines[0]);
    const dataRows = lines.slice(1).filter((line: string) => line.trim() !== '');

    console.log(`CSV has ${dataRows.length} data rows and ${headers.length} columns`);
    console.log(`Headers: ${headers.join(', ')}`);

    let detectedType: string | null = fileType || null;
    if (!fileType || !TABLE_DEFINITIONS[fileType]) {
      detectedType = detectTableType(headers);
      console.log(`Auto-detected table type: ${detectedType}`);
    }

    if (!detectedType || !TABLE_DEFINITIONS[detectedType]) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          stage: 'detection',
          errors: [`No se pudo identificar el tipo de archivo. Tipos válidos: ${Object.keys(TABLE_DEFINITIONS).join(', ')}`],
          headers: headers
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const tableConfig = TABLE_DEFINITIONS[detectedType];

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const parsedRows = dataRows.map((line: string) => {
      const values = parseCSVLine(line);
      const row: Record<string, string> = {};
      
      headers.forEach((header: string, i: number) => {
        row[header] = values[i] || '';
      });
      
      return row;
    });

    const recordsProcessed = parsedRows.length;

    console.log(`Successfully processed ${recordsProcessed} records for ${detectedType} (${tableConfig.label})`);

    return new Response(
      JSON.stringify({
        success: true,
        stage: 'complete',
        message: `Se procesaron ${recordsProcessed} registros de ${tableConfig.label}`,
        recordsProcessed,
        fileType: detectedType,
        fileName,
        detectedLabel: tableConfig.label,
        headers: headers
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
        stage: 'critical_error',
        errors: [error instanceof Error ? error.message : 'Error desconocido al procesar CSV'],
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});