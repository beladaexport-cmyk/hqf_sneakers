import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  productSku: string;
}

export default function ImageUpload({ images, onImagesChange, productSku }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          alert(`Файл ${file.name} не является изображением`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(`Файл ${file.name} слишком большой (максимум 5MB)`);
          continue;
        }

        const timestamp = Date.now();
        const ext = file.name.split('.').pop();
        const fileName = `products/${productSku}/${timestamp}_${i}.${ext}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        newImages.push(downloadURL);

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      onImagesChange([...images, ...newImages]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Ошибка загрузки: ${msg}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = async (imageUrl: string, index: number) => {
    if (!confirm('Удалить это фото?')) return;

    try {
      if (imageUrl.includes('firebasestorage.googleapis.com')) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }
    } catch (error: unknown) {
      console.error('Error deleting image from storage:', error);
    }

    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Фотографии товара
        </label>

        <label className="relative cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <div className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50">
            {uploading ? (
              <div className="text-center">
                <div className="text-sm text-gray-600">Загрузка {uploadProgress.toFixed(0)}%</div>
                <div className="w-48 h-2 mt-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <span className="mt-2 text-sm text-gray-600">
                  Перетащите файлы или нажмите для выбора
                </span>
                <span className="block text-xs text-gray-400 mt-1">
                  PNG, JPG, WebP до 5MB
                </span>
              </div>
            )}
          </div>
        </label>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Product ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(imageUrl, index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center text-gray-400">
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Нет загруженных фото</p>
          </div>
        </div>
      )}
    </div>
  );
}
