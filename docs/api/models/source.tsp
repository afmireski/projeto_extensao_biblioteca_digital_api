using TypeSpec.Http;

namespace BibliotecaDigital;

/** A single source (e.g. a newspaper, magazine, or book). */
model Source {
  id: string;
  collection_id?: string;
  name: string;
  type: "newspaper" | "magazine" | "book";
  language: string;
  metadata: Record<unknown>;
  created_at: string;
  updated_at: string;
}

model CreateSourceDTO {
  collection_id?: string;
  name: string;
  type: "newspaper" | "magazine" | "book";
  language: string;
  metadata?: Record<unknown>;
}

model UpdateSourceDTO {
  collection_id?: string;
  name?: string;
  type?: "newspaper" | "magazine" | "book";
  language?: string;
  metadata?: Record<unknown>;
}

model SourceFilters {
  name?: {
    eq?: string;
    ne?: string;
    like?: string;
    in?: string[];
    nin?: string[];
  };
  type?: {
    eq?: string;
    ne?: string;
    like?: string;
    in?: string[];
    nin?: string[];
  };
  language?: {
    eq?: string;
    ne?: string;
    like?: string;
    in?: string[];
    nin?: string[];
  };
  collection_id?: {
    eq?: string;
    ne?: string;
    like?: string;
    in?: string[];
    nin?: string[];
  };
}

model SourceOrder {
  name?: "asc" | "desc";
  type?: "asc" | "desc";
  created_at?: "asc" | "desc";
}

model SourceMetadata {
  total: int32;
  page: int32;
  limit: int32;
}

model ListSourcesResult {
  metadata: SourceMetadata;
  data: Source[];
}
