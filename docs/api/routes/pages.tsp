import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

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
    @statusCode statusCode: 400 | 401 | 403 | 500;
  };

  @summary("Listar Páginas por Edição")
  @doc("Lista todas as páginas de uma edição de forma paginada.")
  @get
  @route("/")
  listByEditionId(
    @query edition_id: string,
    @query page?: int32 = 1,
    @query limit?: int32 = 50,
  ): {
    @statusCode statusCode: 200;
    @body response: {
      data: {
        id: string;
        edition_id: string;
        number: int32;
        display_image_url: string | null;
        thumb_image_url: string | null;
        ocr_status: string;
        ocr_confidence: float32 | null;
      }[];
      meta: {
        total: int32;
        page: int32;
        limit: int32;
        total_pages: int32;
      };
    };
  } | {
    @statusCode statusCode: 400 | 401 | 500;
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
    @statusCode statusCode: 400 | 401 | 403 | 404 | 500;
  };
}
