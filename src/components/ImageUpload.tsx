import React, { useState, useRef } from 'react';
import { uploadToImgBB, isValidImageUrl } from '../utils/imgbbUpload';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  productSku?: string;
  maxImages?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  productSku: _productSku,
  maxImages = 5,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Фильтруем существующие изображения — убираем base64
  const validImages = images.filter(isValidImageUrl);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - validImages.length;
    if (remainingSlots <= 0) {
      setError(`Максимум ${maxImages} фотографий`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadProgress(Math.round(((i) / filesToUpload.length) * 100));

        const result = await uploadToImgBB(filesToUpload[i]);
        newUrls.push(result.url);

        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      }

      onImagesChange([...validImages, ...newUrls]);
    } catch (err: any) {
      setError(`Ошибка загрузки: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;

    if (!isValidImageUrl(url)) {
      setError('Введите корректный URL (должен начинаться с http:// или https://)');
      return;
    }

    if (validImages.length >= maxImages) {
      setError(`Максимум ${maxImages} фотографий`);
      return;
    }

    onImagesChange([...validImages, url]);
    setUrlInput('');
    setShowUrlInput(false);
    setError(null);
  };

  const handleRemove = (index: number) => {
    const newImages = validImages.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleSetMain = (index: number) => {
    const newImages = [...validImages];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    onImagesChange(newImages);
  };

  return (
    <div style={{ marginTop: '8px' }}>
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '10px',
      }}>
        📸 Фотографии товара ({validImages.length}/{maxImages})
      </label>

      {/* Превью загруженных фото */}
      {validImages.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '12px',
        }}>
          {validImages.map((url, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                borderRadius: '10px',
                overflow: 'hidden',
                border: index === 0
                  ? '2px solid #6366F1'
                  : '2px solid #E2E8F0',
                flexShrink: 0,
              }}
            >
              <img
                src={url}
                alt={`Фото ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Главное фото бейдж */}
              {index === 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  backgroundColor: 'rgba(99,102,241,0.85)',
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: '700',
                  textAlign: 'center',
                  padding: '2px',
                }}>
                  ГЛАВНОЕ
                </div>
              )}

              {/* Кнопки управления */}
              <div style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                {/* Удалить */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'rgba(239,68,68,0.9)',
                    color: 'white',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>

                {/* Сделать главным */}
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetMain(index)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'rgba(99,102,241,0.9)',
                      color: 'white',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Сделать главным"
                  >
                    ★
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Кнопки загрузки */}
      {validImages.length < maxImages && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

          {/* Загрузить файл */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '2px dashed #C7D2FE',
              backgroundColor: uploading ? '#F1F5F9' : '#EEF2FF',
              color: uploading ? '#94A3B8' : '#6366F1',
              fontSize: '13px',
              fontWeight: '700',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {uploading ? (
              <>⏳ Загрузка {uploadProgress}%</>
            ) : (
              <>📁 Выбрать файл</>
            )}
          </button>

          {/* Добавить по URL */}
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '2px dashed #E2E8F0',
              backgroundColor: 'white',
              color: '#64748B',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            🔗 По ссылке
          </button>
        </div>
      )}

      {/* Прогресс загрузки */}
      {uploading && (
        <div style={{
          marginTop: '8px',
          height: '6px',
          backgroundColor: '#E2E8F0',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${uploadProgress}%`,
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Поле для URL */}
      {showUrlInput && (
        <div style={{
          marginTop: '10px',
          display: 'flex',
          gap: '8px',
        }}>
          <input
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1.5px solid #E2E8F0',
              borderRadius: '10px',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={handleAddUrl}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#6366F1',
              color: 'white',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Добавить
          </button>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div style={{
          marginTop: '8px',
          padding: '10px 14px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '10px',
          fontSize: '13px',
          color: '#EF4444',
          fontWeight: '600',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              border: 'none',
              background: 'none',
              color: '#EF4444',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Скрытый input для файлов */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <p style={{
        fontSize: '11px',
        color: '#94A3B8',
        marginTop: '8px',
      }}>
        JPG, PNG, WebP • Максимум {maxImages} фото • До 32МБ каждое
      </p>
    </div>
  );
};

export default ImageUpload;
