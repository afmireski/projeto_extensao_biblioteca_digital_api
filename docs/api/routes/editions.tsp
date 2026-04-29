import "@typespec/http";
import "@typespec/rest";
import "../models/edition.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace BibliotecaDigital;

@route("/api/editions")
@tag("Editions")
interface Editions {
  /**
   * Create a new edition.
   * Requires manager role. Validates that the referenced source exists.
   */
  @post
  @route("/create")
  create(@body body: BibliotecaDigital.CreateEditionDTO): {
    @statusCode statusCode: 201;
    @body edition: BibliotecaDigital.Edition;
  } | {
    @statusCode statusCode: 400 | 401 | 403 | 404;
    @body error: BibliotecaDigital.ErrorResponse;
  };

  /**
   * Update an edition.
   * Requires manager role. source_id is immutable and cannot be changed.
   * Returns 404 if the edition or its parent source is soft-deleted.
   */
  @patch
  @route("/{id}/update")
  update(@path id: string, @body body: BibliotecaDigital.UpdateEditionDTO): {
    @statusCode statusCode: 200;
    @body edition: BibliotecaDigital.Edition;
  } | {
    @statusCode statusCode: 400 | 401 | 403 | 404;
    @body error: BibliotecaDigital.ErrorResponse;
  };

  /**
   * Soft-delete an edition.
   * Requires manager role.
   * Returns 404 if the edition or its parent source is soft-deleted.
   */
  @delete
  @route("/{id}/delete")
  deleteOp(@path id: string): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 401 | 403 | 404;
    @body error: BibliotecaDigital.ErrorResponse;
  };

  /**
   * Get an edition by ID.
   * Returns 404 if the edition or its parent source is soft-deleted.
   * Response includes source metadata (name, type, language).
   */
  @get
  @route("/{id}")
  getById(@path id: string): {
    @statusCode statusCode: 200;
    @body edition: BibliotecaDigital.EditionWithSource;
  } | {
    @statusCode statusCode: 401 | 404;
    @body error: BibliotecaDigital.ErrorResponse;
  };

  /**
   * List editions with filtering, ordering, and pagination.
   * Only editions whose parent source is not soft-deleted are returned.
   * Supports filtering by: number, published_at (range), source_name, source_type, source_language.
   */
  @get
  @route("/list")
  list(
    @query page?: int32,
    @query limit?: int32,
    @query `number`?: string,
    @query published_at_gte?: string,
    @query published_at_lte?: string,
    @query source_name?: string,
    @query source_type?: string,
    @query source_language?: string,
  ): {
    @statusCode statusCode: 200;
    @body result: BibliotecaDigital.ListEditionsResult;
  } | {
    @statusCode statusCode: 401;
    @body error: BibliotecaDigital.ErrorResponse;
  };
}
