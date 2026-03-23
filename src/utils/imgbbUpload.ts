const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

if (!IMGBB_API_KEY) {
  console.error('VITE_IMGBB_API_KEY is missing!');
}

console.log('ImgBB API key loaded:', IMGBB_API_KEY ? 'YES' : 'NO');

interface ImgBBResult {
  url: string;
  displayUrl: string;
  thumb: string | undefined;
  deleteUrl: string;
  size: number;
  name: string | undefined;
}

export async function uploadImageToImgBB(file: File): Promise<ImgBBResult> {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error(
      'VITE_IMGBB_API_KEY not found. Add it to Netlify Environment Variables'
    );
  }

  if (!file) throw new Error('No file selected');
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File exceeds 5MB limit');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', apiKey);

  console.log('Uploading to ImgBB...');

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    console.error('ImgBB error:', data);
    throw new Error(data.error?.message || 'Upload failed');
  }

  console.log('Upload successful:', data.data.url);

  return {
    url: data.data.url,
    displayUrl: data.data.display_url,
    thumb: data.data.thumb?.url,
    deleteUrl: data.data.delete_url,
    size: data.data.size,
    name: data.data.image?.filename,
  };
}

interface UploadProgress {
  current: number;
  total: number;
  percent: number;
  status: 'uploading' | 'done';
  fileName: string;
}

interface MultiUploadResult {
  results: ImgBBResult[];
  errors: { file: string; error: string }[];
}

export async function uploadMultipleImages(
  files: File[],
  onProgress: (progress: UploadProgress) => void = () => {}
): Promise<MultiUploadResult> {
  const results: ImgBBResult[] = [];
  const errors: { file: string; error: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress({
        current: i,
        total: files.length,
        percent: Math.round((i / files.length) * 100),
        status: 'uploading',
        fileName: files[i].name,
      });

      const result = await uploadImageToImgBB(files[i]);
      results.push(result);

      onProgress({
        current: i + 1,
        total: files.length,
        percent: Math.round(((i + 1) / files.length) * 100),
        status: i + 1 === files.length ? 'done' : 'uploading',
        fileName: files[i].name,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`Error uploading ${files[i].name}:`, error);
      errors.push({
        file: files[i].name,
        error: msg,
      });
    }
  }

  if (errors.length > 0) {
    console.warn('Some uploads failed:', errors);
  }

  return { results, errors };
}

export async function testImgBBConnection(): Promise<void> {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  console.log('ImgBB API Key exists:', !!apiKey);
  console.log('Key length:', apiKey?.length);
}
