# Storage — Integração com MinIO (desenvolvimento local)

**Contexto:** O projeto usa o padrão de porta/adaptador para storage (`src/infra/storage/`).
Em desenvolvimento, um container MinIO simula a API do S3. Para produção, basta trocar o
adaptador registrado no Awilix — nenhuma regra de negócio é alterada.

---

## 1. O que é o MinIO aqui

MinIO é um servidor de object storage com API 100% compatível com S3. Ele roda como
container e expõe exatamente os mesmos endpoints que a AWS usaria. O cliente usado no
código (`@aws-sdk/client-s3`) não sabe que está falando com MinIO — a troca para S3 real
é só de variáveis de ambiente.

A mudança de licença do MinIO (Apache → AGPL-3.0 em 2021) é irrelevante para este
contexto: o servidor roda isolado como dependência de infraestrutura, não é embutido no
código da aplicação.

---

## 2. docker-compose

Adicionar ao `docker-compose.yml` existente do projeto:

```yaml
services:
  minio:
    image: minio/minio:latest
    container_name: biblioteca_storage
    command: server /data --console-address ":9001"
    ports:
      - '9000:9000' # API S3 — endpoint que a aplicação usa
      - '9001:9001' # Console web (http://localhost:9001)
    environment:
      MINIO_ROOT_USER: ${STORAGE_KEY}
      MINIO_ROOT_PASSWORD: ${STORAGE_SECRET}
    volumes:
      - minio_data:/data
    healthcheck:
      test: ['CMD', 'mc', 'ready', 'local']
      interval: 5s
      timeout: 5s
      retries: 5

  # Cria os buckets automaticamente na primeira subida
  minio-init:
    image: minio/mc:latest
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
        mc alias set local http://minio:9000 ${STORAGE_KEY} ${STORAGE_SECRET};
        mc mb --ignore-existing local/pages-originals;
        mc mb --ignore-existing local/pages-display;
        mc mb --ignore-existing local/pages-thumb;
        mc anonymous set download local/pages-display;
        mc anonymous set download local/pages-thumb;
      "

volumes:
  minio_data:
```

Os três buckets correspondem diretamente às colunas da tabela `paginas`:

| Bucket            | Coluna                 | Acesso  |
| ----------------- | ---------------------- | ------- |
| `pages-originals` | `imagem_original_path` | privado |
| `pages-display`   | `imagem_display_path`  | público |
| `pages-thumb`     | `imagem_thumb_path`    | público |

Display e thumb são públicos para que o frontend sirva as imagens diretamente pela URL,
sem passar pela API.

---

## 3. Variáveis de ambiente

Adicionar ao `.env` (e ao `.env.example`):

```env
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_KEY=minioadmin
STORAGE_SECRET=minioadmin
STORAGE_REGION=us-east-1
STORAGE_PATH_STYLE=true
```

> `STORAGE_PATH_STYLE=true` é obrigatório para MinIO. O S3 real usa virtual-hosted style
> por padrão; o MinIO usa path style. Em produção esse valor vai para `false`.

---

## 4. Adaptador S3 (`src/infra/storage/s3.adapter.ts`)

Implementa a mesma interface `IStorageAdapter` que o adaptador local já segue:

```typescript
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { IStorageAdapter, UploadResult } from './storage.interface';

export class S3StorageAdapter implements IStorageAdapter {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      endpoint: process.env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: process.env.STORAGE_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET!,
      },
      region: process.env.STORAGE_REGION ?? 'us-east-1',
      forcePathStyle: process.env.STORAGE_PATH_STYLE === 'true',
    });
  }

  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    // Retorna a path relativa — a URL pública é montada pela aplicação usando o endpoint
    return { path: `${bucket}/${key}` };
  }

  async delete(bucket: string, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
  }
}
```

Instalar a dependência:

```sh
bun add @aws-sdk/client-s3
```

---

## 5. Registro no Awilix (`src/container.ts`)

Trocar o adaptador registrado conforme o ambiente:

```typescript
import { LocalStorageAdapter } from './infra/storage/local.adapter';
import { S3StorageAdapter } from './infra/storage/s3.adapter';

const storageAdapter = process.env.STORAGE_ENDPOINT
  ? new S3StorageAdapter()
  : new LocalStorageAdapter();

container.register({
  storageAdapter: asValue(storageAdapter),
});
```

Qualquer service que dependa de `IStorageAdapter` recebe o adaptador correto sem saber
qual é. A lógica de negócio em `edicao.service.ts` (que orquestra o upload das páginas)
permanece intocada.

---

## 6. Checklist para produção (S3 real)

Quando o projeto sair do ambiente local, a única coisa a fazer é:

- [ ] Criar os três buckets no S3 com as mesmas políticas de acesso
- [ ] Atualizar as variáveis de ambiente:
  - `STORAGE_ENDPOINT` → remover (SDK aponta para AWS por padrão)
  - `STORAGE_KEY` / `STORAGE_SECRET` → credenciais IAM
  - `STORAGE_PATH_STYLE` → `false`
- [ ] Remover os serviços `minio` e `minio-init` do `docker-compose.yml`

Nenhum arquivo TypeScript precisa ser alterado.
