-- Create a function that executes SELECT queries and returns results
CREATE OR REPLACE FUNCTION public.execute_select(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Execute the SELECT query and return results as JSON
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  
  -- Return empty array if no results
  IF result IS NULL THEN
    RETURN '[]'::json;
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return empty with error info
    RAISE WARNING 'execute_select error: %, query: %', SQLERRM, query;
    RETURN json_build_object('error', SQLERRM, 'query', query);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_select(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_select(text) TO anon;