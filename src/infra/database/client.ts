import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
// Tipo gerado automaticamente pelo kysely-codegen via: bun run db:codegen
// Não edite este import manualmente — rode o script após cada migration
import type { DB } from './types'

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
})

