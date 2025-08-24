import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Ako koristiš fs, pobrini se da si na Node runtime-u (ne Edge):
export const runtime = 'nodejs';

type AnyFile = Blob & { name?: string; type?: string; size: number };

export async function parseFormData(req: NextRequest): Promise<{ fields: any; files: any }> {
  try {
    const formData = await req.formData();
    const fields: any = {};
    const files: any = { images: [] };

    for (const [key, value] of formData.entries()) {
      if (key === 'existingImages') {
        // Handle existing images as array
        if (!fields.existingImages) {
          fields.existingImages = [];
        }
        fields.existingImages.push(value);
      } else if (typeof value === 'object' && value !== null && 'arrayBuffer' in value) {
        const file = value as AnyFile;

        // 5MB limit
        if (file.size > 0 && file.size <= 5 * 1024 * 1024) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
          }

          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const originalName = file.name ?? 'upload.bin';
          const extension = originalName.split('.').pop() || 'bin';
          const filename = `${timestamp}-${randomString}.${extension}`;
          const filepath = path.join(uploadsDir, filename);

          await writeFile(filepath, buffer);

          const publicPath = `/uploads/${filename}`;

          files.images.push({
            path: publicPath,
            name: originalName,
            size: file.size,
            type: (file as any).type || 'application/octet-stream',
          });
        }
      } else {
        fields[key] = value;
      }
    }

    return { fields, files };
  } catch (error) {
    console.error('Error parsing form data:', error);
    throw new Error('Failed to parse form data');
  }
}