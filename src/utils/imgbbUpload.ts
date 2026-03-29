const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '';

export interface ImgBBResponse {
  url: string;
  thumb: string;
  deleteUrl: string;
}

// Конвертация File в base64 для отправки в API
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Убираем префикс "data:image/jpeg;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Загрузка одного файла на ImgBB
export const uploadToImgBB = async (file: File): Promise<ImgBBResponse> => {
  if (!IMGBB_API_KEY) {
    throw new Error('VITE_IMGBB_API_KEY не настроен в .env файле');
  }

  // Проверка размера файла (макс 32МБ для ImgBB)
  const maxSize = 32 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`Файл слишком большой: ${Math.round(file.size / 1024 / 1024)}МБ. Максимум 32МБ`);
  }

  // Проверка типа файла
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Неподдерживаемый формат. Используй: JPG, PNG, WebP`);
  }

  const base64 = await fileToBase64(file);

  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64);
  formData.append('name', `hqf_${Date.now()}_${file.name}`);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ImgBB API ошибка: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`ImgBB вернул ошибку: ${JSON.stringify(data.error)}`);
  }

  return {
    url: data.data.url,
    thumb: data.data.thumb?.url || data.data.url,
    deleteUrl: data.data.delete_url,
  };
};

// Загрузка нескольких файлов
export const uploadMultipleToImgBB = async (
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i + 1, files.length);
    const result = await uploadToImgBB(files[i]);
    urls.push(result.url);
  }

  return urls;
};

// Проверка что строка является URL а не base64
export const isValidImageUrl = (str: string): boolean => {
  if (!str) return false;
  if (str.startsWith('data:')) return false; // это base64 — плохо
  return str.startsWith('http://') || str.startsWith('https://');
};

// Очистка массива изображений — убираем base64
export const sanitizeImages = (images: string[]): string[] => {
  if (!images || !Array.isArray(images)) return [];
  return images.filter(isValidImageUrl);
};
