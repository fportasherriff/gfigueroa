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
// Configuración de tablas con columnas signature para auto-detección
// Basado en las columnas reales de los CSVs del cliente
const TABLE_DEFINITIONS: Record<string, TableDefinition> = {
  'agenda_detallada': {
    label: 'Agenda Detallada',
    required: true,
    // Columnas únicas: IDTurno, Consultorio, Procedimiento
    signatureColumns: ['IDTurno', 'Consultorio', 'Procedimiento'],
    allColumns: ['IDTurno', 'Sucursal', 'Consultorio', 'Horario', 'Mins.', 'Profesional', 'IDCliente', 'Nombre', 'Procedimiento', 'Equipo', 'TQP', 'Detalle', 'Estado', 'Confirmado', 'Sesion', 'Usuario', 'Fecha de carga']
  },
  'cartera_pasiva': {
    label: 'Cartera Pasiva',
    required: true,
    // Columnas únicas: Ultimo Contacto, Ultimo usuario, Ultimo Presupuesto
    signatureColumns: ['Ultimo Contacto', 'Ultimo usuario', 'Ultimo Presupuesto'],
    allColumns: ['Nro', 'Apellido', 'Nombre', 'Alta', 'Usuario de Alta', 'Sucursal', 'Ejecutivo', 'Ultimo Contacto', 'Ultimo usuario', 'Tipo', 'Ultimo Presupuesto']
  },
  'listado_clientes': {
    label: 'Listado Clientes',
    required: true,
    // Columnas únicas para clientes: DNI, Celular, EMail
    signatureColumns: ['DNI', 'Celular', 'EMail'],
    allColumns: ['ID', 'Apellido y Nombre', 'Fecha', 'DNI', 'Estado', 'Telefono', 'Celular', 'EMail', 'Origen', 'Sucursal']
  },
  'leads': {
    label: 'Leads',
    required: true,
    // Columnas únicas: Origen, Fecha Ingreso, Comentarios
    signatureColumns: ['Origen', 'Fecha Ingreso', 'Comentarios'],
    allColumns: ['Nombre', 'Telefono', 'Email', 'Origen', 'Fecha Ingreso', 'Estado', 'Comentarios', 'Sucursal']
  },
  'saldos': {
    label: 'Saldos',
    required: true,
    // Columnas únicas: Saldo, Fecha Ultimo Movimiento
    signatureColumns: ['Saldo', 'Fecha Ultimo Movimiento'],
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

// Función para detectar el delimitador del CSV (coma o punto y coma)
function detectDelimiter(headerLine: string): string {
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

// Función para parsear una línea CSV respetando comillas
function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
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
    let csvData: string;
    let fileName: string;
    let fileType: string | undefined;

    // Detectar si es FormData o JSON
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Procesar FormData (archivo crudo)
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            stage: 'validation',
            errors: ['No se proporcionó ningún archivo'] 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      fileName = file.name;
      csvData = await file.text();
      fileType = formData.get('fileType') as string | undefined;
      
      console.log(`Received FormData upload: ${fileName}`);
    } else {
      // Fallback a JSON para compatibilidad
      const jsonData: CsvUploadRequest = await req.json();
      csvData = jsonData.csvData;
      fileName = jsonData.fileName;
      fileType = jsonData.fileType;
      
      console.log(`Received JSON upload: ${fileName}`);
    }

    console.log(`Processing CSV upload: ${fileName} (type: ${fileType || 'auto-detect'})`);

    if (!csvData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          stage: 'validation',
          errors: ['No se proporcionaron datos CSV'] 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Detectar delimitador automáticamente
    const delimiter = detectDelimiter(lines[0]);
    console.log(`Detected delimiter: "${delimiter}"`);

    const headers = parseCSVLine(lines[0], delimiter);
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

    // Helper to convert header names to snake_case column names
    const toSnakeCase = (str: string): string => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    };

    const parsedRows = dataRows.map((line: string) => {
      const values = parseCSVLine(line, delimiter);
      const row: Record<string, string | null> = {};
      
      headers.forEach((header: string, i: number) => {
        const columnName = toSnakeCase(header);
        const value = values[i]?.trim() || null;
        row[columnName] = value === '' ? null : value;
      });
      
      return row;
    });

    console.log(`Parsed ${parsedRows.length} rows. Starting database operations for table: ${detectedType}`);

    // Step 1: Delete all existing records (snapshot replacement strategy)
    const { error: deleteError } = await supabase
      .from(detectedType)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows (workaround for "delete all")

    if (deleteError) {
      console.error(`Error deleting from ${detectedType}:`, deleteError);
      return new Response(
        JSON.stringify({
          success: false,
          stage: 'delete',
          errors: [`Error al limpiar tabla ${tableConfig.label}: ${deleteError.message}`],
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Deleted existing records from ${detectedType}. Inserting ${parsedRows.length} new rows...`);

    // Step 2: Insert new records in batches to avoid payload limits
    const BATCH_SIZE = 500;
    let totalInserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < parsedRows.length; i += BATCH_SIZE) {
      const batch = parsedRows.slice(i, i + BATCH_SIZE);
      
      const { error: insertError, data: insertedData } = await supabase
        .from(detectedType)
        .insert(batch)
        .select();

      if (insertError) {
        console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, insertError);
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`);
      } else {
        totalInserted += insertedData?.length || batch.length;
      }
    }

    if (errors.length > 0 && totalInserted === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          stage: 'insert',
          errors: errors,
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Successfully inserted ${totalInserted} records into ${detectedType}`);

    return new Response(
      JSON.stringify({
        success: true,
        stage: 'complete',
        message: `Se reemplazaron ${totalInserted} registros en ${tableConfig.label}`,
        recordsProcessed: totalInserted,
        fileType: detectedType,
        fileName,
        detectedLabel: tableConfig.label,
        headers: headers,
        warnings: errors.length > 0 ? errors : undefined
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