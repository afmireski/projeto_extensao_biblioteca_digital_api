# Processamento de Imagem — Geração das Variantes com Sharp

**Contexto:** Ao receber o upload de uma página, o `edicao.service.ts` deriva três
variantes da imagem original e delega cada uma ao `IStorageAdapter`. O Sharp é a
biblioteca responsável pela conversão e redimensionamento.

---

## 1. Instalar o Sharp

```sh
bun add sharp
bun add -d @types/sharp
```

---

## 2. Utilitário de processamento (`src/infra/image/image.processor.ts`)

Isolar a lógica do Sharp num utilitário mantém o service limpo e facilita trocar a
biblioteca no futuro sem tocar nas regras de negócio.

```typescript
import sharp from "sharp";

export interface ImageVariants {
  original: Buffer; // buffer bruto, sem alteração
  display: Buffer;  // ~1800px, WebP, qualidade 85
  thumb: Buffer;    // ~300px, WebP, qualidade 75
}

export async function gerarVariantes(input: Buffer): Promise<ImageVariants> {
  const base = sharp(input).rotate(); // .rotate() respeita o EXIF de orientação

  const [display, thumb] = await Promise.all([
    base
      .clone()
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer(),

    base
      .clone()
      .resize({ width: 300, height: 300, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer(),
  ]);

  return { original: input, display, thumb };
}
```

Pontos relevantes:

- `fit: "inside"` preserva a proporção original sem cortar nada — importante para páginas
  de livro/jornal que podem ser retrato ou paisagem.
- `withoutEnlargement: true` evita que imagens menores que o limite sejam ampliadas e
  percam qualidade.
- `.rotate()` sem argumento lê os metadados EXIF e corrige a orientação automaticamente.
  Scanners e celulares frequentemente gravam a rotação no EXIF em vez de rotacionar os
  pixels — sem isso a imagem chega virada no browser.
- As duas conversões rodam em paralelo com `Promise.all` já que são independentes.

---

## 3. Uso no `edicao.service.ts`

O service recebe o buffer do controller, gera as variantes e delega o upload:

```typescript
import { gerarVariantes } from "../infra/image/image.processor";
import { randomUUID } from "crypto";

// Dentro do método de upload de páginas:
async uploadPagina(edicaoId: string, numero: number, buffer: Buffer) {
  const key = randomUUID(); // uma chave base para as três variantes

  const { original, display, thumb } = await gerarVariantes(buffer);

  const [originalPath, displayPath, thumbPath] = await Promise.all([
    this.storageAdapter.upload("paginas-originais", `${key}/original`, original, "image/webp"),
    this.storageAdapter.upload("paginas-display",   `${key}/display`,  display,  "image/webp"),
    this.storageAdapter.upload("paginas-thumb",     `${key}/thumb`,    thumb,    "image/webp"),
  ]);

  await this.paginaRepository.criar({
    edicao_id:            edicaoId,
    numero,
    imagem_original_path: originalPath.path,
    imagem_display_path:  displayPath.path,
    imagem_thumb_path:    thumbPath.path,
  });
}
```

> A original também é salva como WebP neste modelo. Se houver requisito de preservar o
> formato bruto do scanner (TIFF, por exemplo), basta não passar a original pelo Sharp e
> ajustar o `contentType` no upload para o tipo real do arquivo recebido.

---

## 4. Recebendo o arquivo no controller

O controller usa `multer` para extrair o buffer do multipart antes de passar ao service:

```sh
bun add multer
bun add -d @types/multer
```

```typescript
import multer from "multer";

// memoryStorage mantém o arquivo em buffer — não toca no disco da aplicação
const upload = multer({ storage: multer.memoryStorage() });

// Na definição da rota (edicao.router.ts):
router.post(
  "/:edicaoId/paginas",
  authMiddleware,
  roleMiddleware("manager"),
  upload.single("imagem"),
  edicaoController.uploadPagina
);

// No controller:
async uploadPagina(req: Request, res: Response) {
  const buffer = req.file?.buffer;
  if (!buffer) throw new ValidationError("Nenhuma imagem recebida.");

  const numero = Number(req.body.numero);
  await this.edicaoService.uploadPagina(req.params.edicaoId, numero, buffer);

  res.status(201).json({ message: "Página registrada com sucesso." });
}
```

---

## 5. Resumo das variantes

| Variante   | Dimensão máxima | Formato | Qualidade | Bucket               | Acesso  |
|------------|-----------------|---------|-----------|----------------------|---------|
| `original` | sem alteração   | WebP    | —         | `paginas-originais`  | privado |
| `display`  | 1800 × 1800 px  | WebP    | 85        | `paginas-display`    | público |
| `thumb`    | 300 × 300 px    | WebP    | 75        | `paginas-thumb`      | público |

Os valores de dimensão e qualidade são pontos de partida razoáveis e podem ser ajustados
conforme a qualidade média dos scans do acervo.
