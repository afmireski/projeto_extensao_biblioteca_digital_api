import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace BibliotecaDigital;

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

  model Metadata {
    total: int32;
    page: int32;
    limit: int32;
  }

  model ListSourcesResult {
    metadata: Metadata;
    data: Source[];
}

@route("/api/sources")
@tag("Sources")
interface Sources {
  @post
  @route("/create")
  create(@body body: CreateSourceDTO): {
    @statusCode statusCode: 201;
    @body source: Source;
  } | {
    @statusCode statusCode: 401 | 403 | 400;
  };

  @patch
  @route("/{id}/update")
  update(@path id: string, @body body: UpdateSourceDTO): {
    @statusCode statusCode: 200;
    @body source: Source;
  } | {
    @statusCode statusCode: 404 | 401 | 403 | 400;
  };

  @delete
  @route("/{id}/delete")
  deleteOp(@path id: string): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404 | 401 | 403;
  };

  @get
  @route("/{id}")
  getById(@path id: string): {
    @statusCode statusCode: 200;
    @body source: Source;
  } | {
    @statusCode statusCode: 404 | 401;
  };

  @get
  @route("/list")
  list(
    @query page?: int32,
    @query limit?: int32,
  ): {
    @statusCode statusCode: 200;
    @body result: ListSourcesResult;
  } | {
    @statusCode statusCode: 401;
  };
}
