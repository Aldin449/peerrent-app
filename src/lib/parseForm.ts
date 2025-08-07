import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function parseFormData(req: NextRequest): Promise<{ fields: any; files: any }> {
  try {
    const formData = await req.formData();
    const fields: any = {};
    const files: any = { images: [] };

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Save file to disk and return the path
        if (value.size > 0 && value.size <= 5 * 1024 * 1024) { // 5MB limit
          const bytes = await value.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          // Create uploads directory if it doesn't exist
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
          }
          
          // Generate unique filename
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const extension = value.name.split('.').pop() || 'jpg';
          const filename = `${timestamp}-${randomString}.${extension}`;
          const filepath = path.join(uploadsDir, filename);
          
          // Save file to disk
          await writeFile(filepath, buffer);
          
          // Return the public URL path
          const publicPath = `/uploads/${filename}`;
          
          files.images.push({
            path: publicPath,
            name: value.name,
            size: value.size,
            type: value.type || 'image/jpeg'
          });
        }
      } else {
        // Handle regular form fields
        fields[key] = value;
      }
    }

    return { fields, files };
  } catch (error) {
    console.error('Error parsing form data:', error);
    throw error;
  }
}

