import React, { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadMultipleImages, testImgBBConnection } from '../utils/imgbbUpload';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  productSku: string;
}

export default function ImageUpload({ images, onImagesChange, productSku: _productSku }: ImageUploadProps) {
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    percent: 0,
    currentFile: '',
    current: 0,
    total: 0,
  });

  useEffect(() => {
    testImgBBConnection();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    setUploadState({
      isUploading: true,
      percent: 0,
      currentFile: '',
      current: 0,
      total: fileArray.length,
    });

    const { results, errors } = await uploadMultipleImages(
      fileArray,
      (progress) => {
        setUploadState({
          isUploading: progress.status !== 'done',
          percent: progress.percent,
          currentFile: progress.fileName,
          current: progress.current,
          total: progress.total,
        });
      }
    );

    if (results.length > 0) {
      onImagesChange([
        ...images,
        ...results.map((r) => r.url),
      ]);
    }

    if (errors.length > 0) {
      alert(
        `Не удалось загрузить:\n` +
        errors.map((e) => `\u2022 ${e.file}: ${e.error}`).join('\n')
      );
    }

    setUploadState({
      isUploading: false,
      percent: 100,
      currentFile: '',
      current: 0,
      total: 0,
    });
  };

  const handleRemoveImage = async (_imageUrl: string, index: number) => {
    if (!confirm('Удалить это фото?')) return;

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
            disabled={uploadState.isUploading}
          />
          <div className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50">
            {uploadState.isUploading ? (
              <div className="text-center w-full px-4">
                <div className="text-sm text-gray-600">
                  Загрузка {uploadState.currentFile} ({uploadState.current}/{uploadState.total})
                </div>
                <div className="w-48 h-2 mt-2 bg-gray-200 rounded-full mx-auto">
                  <div
                    className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.percent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">{uploadState.percent}%</div>
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

      {uploadState.isUploading && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#EBF8FF',
          borderRadius: '8px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
            fontSize: '13px',
          }}>
            <span>{uploadState.currentFile}</span>
            <span style={{ fontWeight: 600 }}>
              {uploadState.current}/{uploadState.total} ({uploadState.percent}%)
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#BEE3F8',
            borderRadius: '3px',
          }}>
            <div style={{
              width: `${uploadState.percent}%`,
              height: '100%',
              backgroundColor: '#3B82F6',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

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

      {images.length === 0 && !uploadState.isUploading && (
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
