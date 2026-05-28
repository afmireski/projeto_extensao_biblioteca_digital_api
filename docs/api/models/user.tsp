using TypeSpec.Http;

namespace BibliotecaDigital;

enum UserRole {
  reader,
  manager,
}

/** Authenticated user profile. */
model UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: utcDateTime;
}

/** Payload returned on successful login. */
model LoginResponse {
  token: string;
  email: string;
  name: string;
}


