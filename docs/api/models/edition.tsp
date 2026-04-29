using TypeSpec.Http;

namespace BibliotecaDigital;

/** A single edition of a source (e.g. issue nº 42 of a newspaper). */
model Edition {
  id: string;
  source_id: string;
  number?: string;
  published_at?: string;
  notes?: string;
  created_at: utcDateTime;
  updated_at: utcDateTime;
}

/** Edition enriched with parent source metadata. Returned by GET /{id}. */
model EditionWithSource {
  ...Edition;
  source_name: string;
  source_type: string;
  source_language: string;
}

model CreateEditionDTO {
  /** UUID of the parent source. */
  source_id: string;
  number?: string;
  /** Date in YYYY-MM-DD format. */
  published_at?: string;
  notes?: string;
}

model UpdateEditionDTO {
  number?: string;
  /** Date in YYYY-MM-DD format. */
  published_at?: string;
  notes?: string;
}

model ListEditionsResult {
  metadata: {
    total: int32;
    page: int32;
    limit: int32;
  };
  data: Edition[];
}
