-- ─────────────────────────────────────────────────────────────
-- Row-Level Security para aislamiento multi-tenant
-- Correr después de cada `prisma migrate deploy`:
--   psql $DIRECT_URL -f prisma/rls.sql
-- ─────────────────────────────────────────────────────────────

-- Tablas con tenantId que deben quedar protegidas por RLS.
-- OJO: el schema de Prisma nunca mapeó el campo `tenantId` a snake_case
-- (no hay @map("tenant_id") en ningún modelo), así que la columna real
-- en Postgres queda en camelCase — "tenantId", entrecomillada — aunque
-- el nombre de la TABLA sí está mapeado a snake_case vía @@map(...).
-- Si esto se vuelve a romper, comparar contra prisma/migrations/*/migration.sql.
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'tenant_users', 'clients', 'leads', 'projects',
      'tasks', 'invoices', 'events'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);

    -- Elimina la política si ya existe, para poder re-ejecutar este script
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', t);

    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING ("tenantId" = current_setting(''app.current_tenant'', true))
         WITH CHECK ("tenantId" = current_setting(''app.current_tenant'', true));',
      t
    );
  END LOOP;
END $$;

-- invoice_items no tiene tenantId propio (cuelga de invoices),
-- así que se protege vía join implícito en la aplicación + FK cascade.
-- Si se necesita RLS directo ahí también, añadir tenantId denormalizado.

-- Rol de aplicación: usa esta conexión desde Prisma en runtime.
-- El rol de migraciones (DIRECT_URL, dueño de las tablas) SÍ puede
-- saltarse RLS, por eso las migraciones deben ir por un usuario admin.
-- CREATE ROLE app_user WITH LOGIN PASSWORD '...' NOBYPASSRLS;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
