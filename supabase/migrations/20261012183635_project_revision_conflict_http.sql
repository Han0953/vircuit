-- Business revision conflicts must not use serialization_failure (40001).
-- PostgREST 14 retries that SQLSTATE instead of returning a usable response.
-- Preserve the existing functions, signatures, ownership checks and ACLs.
begin;
do $migration$
declare
  signature text;
  definition text;
begin
  foreach signature in array array[
    'public.save_project(uuid,uuid,integer,uuid,jsonb)',
    'public.delete_project(uuid,integer)'
  ] loop
    if to_regprocedure(signature) is null then
      raise exception 'Missing prerequisite function: %', signature;
    end if;
    definition := pg_get_functiondef(to_regprocedure(signature));
    if position('errcode = ''40001''' in definition) = 0
      and position('errcode = ''PT409''' in definition) = 0 then
      raise exception 'Unexpected revision conflict definition: %', signature;
    end if;
    execute replace(definition, 'errcode = ''40001''', 'errcode = ''PT409''');
  end loop;
end;
$migration$;
notify pgrst, 'reload schema';
commit;
