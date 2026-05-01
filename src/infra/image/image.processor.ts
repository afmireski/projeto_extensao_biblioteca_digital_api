import sharp from 'sharp';
import type { UploadFileDTO } from '../../modules/pages/pages.types';

export interface ImageVariants {
  original: UploadFileDTO;
  display: Buffer;
  thumb: Buffer;
}

export async function generateVariants(
  input: UploadFileDTO,
): Promise<ImageVariants> {
  const base = sharp(input.buffer).rotate();

  const [display, thumb] = await Promise.all([
    base
      .clone()
      .resize({
        width: 1800,
        height: 1800,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer(),

    base
      .clone()
      .resize({
        width: 300,
        height: 300,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 75 })
      .toBuffer(),
  ]);

  return { original: input, display, thumb };
}
