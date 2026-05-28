import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

import "./models/user.tsp";
import "./models/errors.tsp";
import "./models/source.tsp";
import "./models/edition.tsp";
import "./models/page.tsp";
import "./routes/auth.tsp";
import "./routes/users.tsp";
import "./routes/sources.tsp";
import "./routes/editions.tsp";
import "./routes/pages.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

@service(#{ title: "Biblioteca Digital API" })
@server(
    "http://localhost:{port}", 
    "Servidor local de desenvolvimento", 
    {
        @doc("Local server port")
        port: string = "3000",
    }
)
@useAuth(BearerAuth)
namespace BibliotecaDigital;
