---
name: new-migration
description: Cria uma migration Supabase com tenant_id, RLS habilitado e policy de isolamento, seguindo o naming por timestamp do projeto.
disable-model-invocation: true
---

# Nova migration Supabase

## 1. Nome do arquivo

Timestamp UTC + slug descritivo, em `supabase/migrations/`:

```
supabase/migrations/<YYYYMMDDHHMMSS>_<slug>.sql
```

Gere o timestamp com `date -u +%Y%m%d%H%M%S`. Não invente a data.

`001_rls_setup.sql` é legado — não siga esse formato.

## 2. Conteúdo obrigatório para tabela nova

Toda tabela precisa das três partes. Sem elas, os dados vazam entre tenants.

```sql
CREATE TABLE IF NOT EXISTS <tabela> (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  -- colunas
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation Policy - <Tabela>" ON <tabela>
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE INDEX IF NOT EXISTS <tabela>_tenant_id_idx ON <tabela> (tenant_id);
```

`WITH CHECK` não é opcional: sem ele, um cliente autenticado consegue inserir linhas com `tenant_id` de outro tenant.

O índice em `tenant_id` importa porque a policy filtra por ele em toda query.

## 3. Migration já aplicada nunca é editada

Se o SQL já rodou em produção, crie uma nova migration com o `ALTER`. Editar o arquivo antigo faz o histórico divergir do banco real.

## 4. Antes de fechar

- Rode o subagent `rls-reviewer` sobre a migration.
- Confirme que nenhuma função nova `SECURITY DEFINER` ignora o filtro de tenant.
