import "@typespec/http";
import "@typespec/rest";
import "../models/source.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace BibliotecaDigital;

@route("/api/sources")
@tag("Sources")
interface Sources {
  @post
  @route("/create")
  create(@body body: CreateSourceDTO): {
    @statusCode statusCode: 201;
    @body source: Source;
  } | {
    @statusCode statusCode: 400;
    @body body: ValidationErrorResponse;
  } | {
    @statusCode statusCode: 401;
    @body body: UnauthorizedErrorResponse;
  } | {
    @statusCode statusCode: 403;
    @body body: ForbiddenErrorResponse;
  };

  @patch
  @route("/{id}/update")
  update(@path id: string, @body body: UpdateSourceDTO): {
    @statusCode statusCode: 200;
    @body source: Source;
  } | {
    @statusCode statusCode: 400;
    @body body: ValidationErrorResponse;
  } | {
    @statusCode statusCode: 401;
    @body body: UnauthorizedErrorResponse;
  } | {
    @statusCode statusCode: 403;
    @body body: ForbiddenErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: NotFoundErrorResponse;
  };

  @delete
  @route("/{id}/delete")
  deleteOp(@path id: string): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 401;
    @body body: UnauthorizedErrorResponse;
  } | {
    @statusCode statusCode: 403;
    @body body: ForbiddenErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: NotFoundErrorResponse;
  };

  @get
  @route("/{id}")
  getById(@path id: string): {
    @statusCode statusCode: 200;
    @body source: Source;
  } | {
    @statusCode statusCode: 401;
    @body body: UnauthorizedErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: NotFoundErrorResponse;
  };

  @get
  @route("/list")
  list(
    @query page?: int32,
    @query limit?: int32,
    @query filters?: SourceFilters,
    @query order?: SourceOrder,
  ): {
    @statusCode statusCode: 200;
    @body result: ListSourcesResult;
  } | {
    @statusCode statusCode: 401;
    @body body: UnauthorizedErrorResponse;
  };
}
