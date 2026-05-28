import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "../models/page.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace BibliotecaDigital;

@route("/api/pages")
@tag("Pages")
interface PagesRoutes {
  @summary("Upload de Página")
  @doc("Recebe uma imagem em formato multipart/form-data, processa e vincula a uma edição.")
  @post
  @route("/upload")
  upload(
    @header contentType: "multipart/form-data",
    @multipartBody _: {
      page: HttpPart<bytes>;
      edition_id: HttpPart<string>;
      number: HttpPart<int32>;
    }
  ): {
    @statusCode statusCode: 201;
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
    @statusCode statusCode: 500;
    @body body: InternalErrorResponse;
  };

  @summary("Listar Páginas por Edição")
  @doc("Lista todas as páginas de uma edição de forma paginada.")
  @get
  @route("/list")
  list(
    @query page?: int32,
    @query limit?: int32,
    @query filters?: PageFilters,
    @query order?: PageOrder,
  ): {
    @statusCode statusCode: 200;
    @body response: ListPagesResult;
  } | {
    @statusCode statusCode: 400;
    @body body: ValidationErrorResponse;
  } | {
    @statusCode statusCode: 401;
    @body body: UnauthorizedErrorResponse;
  } | {
    @statusCode statusCode: 500;
    @body body: InternalErrorResponse;
  };

  @summary("Remover Páginas em Lote")
  @doc("Remove fisicamente os arquivos e as referências no banco de dados para as páginas informadas.")
  @post
  @route("/delete-batch")
  deleteBatch(
    @body _: {
      page_ids: string[];
    }
  ): {
    @statusCode statusCode: 204;
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
  } | {
    @statusCode statusCode: 500;
    @body body: InternalErrorResponse;
  };
}
