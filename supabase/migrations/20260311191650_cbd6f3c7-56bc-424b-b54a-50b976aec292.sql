CREATE OR REPLACE FUNCTION public.raw_snapshot_replace(table_key text, rows jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  inserted_count integer := 0;
BEGIN
  IF table_key NOT IN ('agenda_detallada','cartera_pasiva','leads','listado_clientes','saldos','tratamientos_reporte') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid table_key');
  END IF;

  EXECUTE format('DELETE FROM raw.%I WHERE true', table_key);

  IF table_key = 'agenda_detallada' THEN
    INSERT INTO raw.agenda_detallada (
      "IDTurno", "Sucursal", "Consultorio", "Horario", "Mins.", "Profesional", "IDCliente", "Nombre",
      "Procedimiento", "Equipo", "TQP", "Detalle", "Estado", "Confirmado", "Sesion", "Usuario", "Fecha de carga"
    )
    SELECT "IDTurno", "Sucursal", "Consultorio", "Horario", "Mins.", "Profesional", "IDCliente", "Nombre",
      "Procedimiento", "Equipo", "TQP", "Detalle", "Estado", "Confirmado", "Sesion", "Usuario", "Fecha de carga"
    FROM jsonb_to_recordset(rows) AS t(
      "IDTurno" text, "Sucursal" text, "Consultorio" text, "Horario" text, "Mins." text,
      "Profesional" text, "IDCliente" text, "Nombre" text, "Procedimiento" text, "Equipo" text,
      "TQP" text, "Detalle" text, "Estado" text, "Confirmado" text, "Sesion" text,
      "Usuario" text, "Fecha de carga" text
    );
    GET DIAGNOSTICS inserted_count = ROW_COUNT;

  ELSIF table_key = 'cartera_pasiva' THEN
    INSERT INTO raw.cartera_pasiva (
      "Nro", "Apellido", "Nombre", "Alta", "Usuario de Alta", "Sucursal", "Ejecutivo",
      "Ultimo Contacto", "Ultimo usuario", "Tipo", "Ultimo Presupuesto"
    )
    SELECT "Nro", "Apellido", "Nombre", "Alta", "Usuario de Alta", "Sucursal", "Ejecutivo",
      "Ultimo Contacto", "Ultimo usuario", "Tipo", "Ultimo Presupuesto"
    FROM jsonb_to_recordset(rows) AS t(
      "Nro" text, "Apellido" text, "Nombre" text, "Alta" text, "Usuario de Alta" text,
      "Sucursal" text, "Ejecutivo" text, "Ultimo Contacto" text, "Ultimo usuario" text,
      "Tipo" text, "Ultimo Presupuesto" text
    );
    GET DIAGNOSTICS inserted_count = ROW_COUNT;

  ELSIF table_key = 'leads' THEN
    INSERT INTO raw.leads (
      "Cliente", "Apellido", "Nombres", "E-Mail", "Alta", "Sucursal", "Origen", "Ultimo Seguimiento", "Ultimo Contacto"
    )
    SELECT "Cliente", "Apellido", "Nombres", "E-Mail", "Alta", "Sucursal", "Origen", "Ultimo Seguimiento", "Ultimo Contacto"
    FROM jsonb_to_recordset(rows) AS t(
      "Cliente" text, "Apellido" text, "Nombres" text, "E-Mail" text, "Alta" text,
      "Sucursal" text, "Origen" text, "Ultimo Seguimiento" text, "Ultimo Contacto" text
    );
    GET DIAGNOSTICS inserted_count = ROW_COUNT;

  ELSIF table_key = 'listado_clientes' THEN
    INSERT INTO raw.listado_clientes (
      "ID", "Fecha", "Apellido y Nombre", "Tipo de Alta", "DNI", "Nacimiento", "Género", "Pais",
      "Telefono Pais", "Telefono", "Celular Pais", "Celular", "EMail", "Direccion", "Codigo Postal", "Ciudad",
      "Barrio", "Referente", "Operador", "Origen", "Grupo", "Sucursal", "Ultimo Contacto", "Ejecutivo",
      "Obra Social", "Número de afiliado", "Estado"
    )
    SELECT "ID", "Fecha", "Apellido y Nombre", "Tipo de Alta", "DNI", "Nacimiento", "Género", "Pais",
      "Telefono Pais", "Telefono", "Celular Pais", "Celular", "EMail", "Direccion", "Codigo Postal", "Ciudad",
      "Barrio", "Referente", "Operador", "Origen", "Grupo", "Sucursal", "Ultimo Contacto", "Ejecutivo",
      "Obra Social", "Número de afiliado", "Estado"
    FROM jsonb_to_recordset(rows) AS t(
      "ID" text, "Fecha" text, "Apellido y Nombre" text, "Tipo de Alta" text, "DNI" text,
      "Nacimiento" text, "Género" text, "Pais" text, "Telefono Pais" text, "Telefono" text,
      "Celular Pais" text, "Celular" text, "EMail" text, "Direccion" text, "Codigo Postal" text,
      "Ciudad" text, "Barrio" text, "Referente" text, "Operador" text, "Origen" text,
      "Grupo" text, "Sucursal" text, "Ultimo Contacto" text, "Ejecutivo" text,
      "Obra Social" text, "Número de afiliado" text, "Estado" text
    );
    GET DIAGNOSTICS inserted_count = ROW_COUNT;

  ELSIF table_key = 'saldos' THEN
    INSERT INTO raw.saldos ("NroCliente", "Cliente", "Saldo", "TQP", "Proximo Turno")
    SELECT "NroCliente", "Cliente", "Saldo", "TQP", "Proximo Turno"
    FROM jsonb_to_recordset(rows) AS t(
      "NroCliente" text, "Cliente" text, "Saldo" text, "TQP" text, "Proximo Turno" text
    );
    GET DIAGNOSTICS inserted_count = ROW_COUNT;

  ELSIF table_key = 'tratamientos_reporte' THEN
    INSERT INTO raw.tratamientos_reporte (
      "ID", "Nombre y Apellido", "ASEID", "Procedimiento", "Sesiones",
      "Realizadas", "Restantes", "Estado", "Ultima Sesion", "Proximo Turno",
      "Saldo", "Sucursal Compra"
    )
    SELECT "ID", "Nombre y Apellido", "ASEID", "Procedimiento", "Sesiones",
      "Realizadas", "Restantes", "Estado", "Ultima Sesion", "Proximo Turno",
      "Saldo", "Sucursal Compra"
    FROM jsonb_to_recordset(rows) AS t(
      "ID" text, "Nombre y Apellido" text, "ASEID" text, "Procedimiento" text,
      "Sesiones" text, "Realizadas" text, "Restantes" text, "Estado" text,
      "Ultima Sesion" text, "Proximo Turno" text, "Saldo" text, "Sucursal Compra" text
    );
    GET DIAGNOSTICS inserted_count = ROW_COUNT;

  END IF;

  RETURN json_build_object('success', true, 'inserted', inserted_count);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM, 'detail', SQLSTATE);
END;
$function$;