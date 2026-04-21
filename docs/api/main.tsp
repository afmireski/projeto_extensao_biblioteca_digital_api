import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

import "./models/user.tsp";
import "./routes/auth.tsp";
import "./routes/users.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

@service
@server("http://localhost:3000", "Servidor local de desenvolvimento")
namespace BibliotecaDigital;
