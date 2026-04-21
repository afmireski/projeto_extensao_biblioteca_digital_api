import type { Generated, Insertable, Selectable, Updateable } from 'kysely'

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export interface UsersTable {
  id: Generated<string>
  email: string
  nome: string
  senha_hash: string
  role: 'leitor' | 'gestor'
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export type User = Selectable<UsersTable>
export type NewUser = Insertable<UsersTable>
export type UserUpdate = Updateable<UsersTable>

// ---------------------------------------------------------------------------
// jwt_denylist
// ---------------------------------------------------------------------------
export interface JwtDenylistTable {
  id: Generated<string>
  jti: string
  expires_at: Date
  created_at: Generated<Date>
}

export type JwtDenylist = Selectable<JwtDenylistTable>
export type NewJwtDenylist = Insertable<JwtDenylistTable>

// ---------------------------------------------------------------------------
// acervos
// ---------------------------------------------------------------------------
export interface AcervosTable {
  id: Generated<string>
  nome: string
  descricao: string | null
  instituicao: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export type Acervo = Selectable<AcervosTable>
export type NewAcervo = Insertable<AcervosTable>
export type AcervoUpdate = Updateable<AcervosTable>

// ---------------------------------------------------------------------------
// fontes
// ---------------------------------------------------------------------------
export interface FontesTable {
  id: Generated<string>
  acervo_id: string
  nome: string
  tipo: 'jornal' | 'revista' | 'livro'
  idioma: string
  metadata: unknown  // JSONB — validado por Zod no service
  deleted_at: Date | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export type Fonte = Selectable<FontesTable>
export type NewFonte = Insertable<FontesTable>
export type FonteUpdate = Updateable<FontesTable>

// ---------------------------------------------------------------------------
// edicoes
// ---------------------------------------------------------------------------
export interface EdicoesTable {
  id: Generated<string>
  fonte_id: string
  numero: string | null
  data_publicacao: Date | null
  observacoes: string | null
  deleted_at: Date | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export type Edicao = Selectable<EdicoesTable>
export type NewEdicao = Insertable<EdicoesTable>
export type EdicaoUpdate = Updateable<EdicoesTable>

// ---------------------------------------------------------------------------
// paginas
// ---------------------------------------------------------------------------
export interface PaginasTable {
  id: Generated<string>
  edicao_id: string
  numero: number
  imagem_original_path: string
  imagem_display_path: string | null
  imagem_thumb_path: string | null
  ocr_status: 'aguardando' | 'processando' | 'concluido' | 'erro'
  ocr_confidence: number | null
  ocr_raw: unknown | null  // JSONB
  conteudo_tsv: unknown | null  // TSVECTOR — gerenciado por trigger no Postgres
  deleted_at: Date | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export type Pagina = Selectable<PaginasTable>
export type NewPagina = Insertable<PaginasTable>
export type PaginaUpdate = Updateable<PaginasTable>

// ---------------------------------------------------------------------------
// ocr_jobs
// ---------------------------------------------------------------------------
export interface OcrJobsTable {
  id: Generated<string>
  pagina_id: string
  status: 'pendente' | 'processando' | 'concluido' | 'erro'
  tentativa: Generated<number>
  erro: string | null
  iniciado_em: Date | null
  concluido_em: Date | null
  created_at: Generated<Date>
}

export type OcrJob = Selectable<OcrJobsTable>
export type NewOcrJob = Insertable<OcrJobsTable>
export type OcrJobUpdate = Updateable<OcrJobsTable>

// ---------------------------------------------------------------------------
// Database — interface central passada como generic ao Kysely
// ---------------------------------------------------------------------------
export interface Database {
  users: UsersTable
  jwt_denylist: JwtDenylistTable
  acervos: AcervosTable
  fontes: FontesTable
  edicoes: EdicoesTable
  paginas: PaginasTable
  ocr_jobs: OcrJobsTable
}
