import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

@route("/api/sources")
@tag("Sources")
namespace DigitalLibrary.Sources {

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
    collectionId?: string;
    name: string;
    type: "newspaper" | "magazine" | "book";
    language: string;
    metadata?: Record<unknown>;
  }

  model UpdateSourceDTO {
    collectionId?: string;
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

  @post
  @route("/create")
  op create(@body body: CreateSourceDTO): {
    @statusCode statusCode: 201;
    @body source: Source;
  } | {
    @statusCode statusCode: 401 | 403 | 400;
  };

  @patch
  @route("/{id}/update")
  op update(@path id: string, @body body: UpdateSourceDTO): {
    @statusCode statusCode: 200;
    @body source: Source;
  } | {
    @statusCode statusCode: 404 | 401 | 403 | 400;
  };

  @delete
  @route("/{id}/delete")
  op delete(@path id: string): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404 | 401 | 403;
  };

  @get
  @route("/{id}")
  op getById(@path id: string): {
    @statusCode statusCode: 200;
    @body source: Source;
  } | {
    @statusCode statusCode: 404 | 401;
  };

  @get
  @route("/list")
  op list(
    @query page?: int32,
    @query limit?: int32,
  ): {
    @statusCode statusCode: 200;
    @body result: ListSourcesResult;
  } | {
    @statusCode statusCode: 401;
  };
}
