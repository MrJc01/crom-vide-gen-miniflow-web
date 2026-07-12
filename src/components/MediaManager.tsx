import React, { useRef } from 'react';
import { Plus, Trash2, Film, Image as ImageIcon } from 'lucide-react';

interface MediaManagerProps {
  mediaFiles: string[];
  onAddMedia: (files: FileList) => void;
  onRemoveMedia: (index: number) => void;
  apiUrl: string;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  mediaFiles,
  onAddMedia,
  onRemoveMedia,
  apiUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddMedia(e.target.files);
    }
  };

  const getFullUrl = (path: string) => {
    if (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // For local backend path e.g. "tmp/uploads/xyz.mp4", map it to backend static server
    // videogen-server maps /uploads/* to tmp/uploads/*
    const cleanPath = path.replace(/^tmp\/uploads\//, '');
    return `${apiUrl}/uploads/${cleanPath}`;
  };

  const isVideo = (path: string) => {
    const lower = path.toLowerCase();
    return (
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.ogg') ||
      lower.endsWith('.mov') ||
      lower.includes('video')
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Mídias do Take
        </label>
        <span className="text-[10px] text-slate-500 font-mono">
          {mediaFiles.length} item(ns)
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {mediaFiles.map((fileSrc, idx) => {
          const fullSrc = getFullUrl(fileSrc);
          const videoElement = isVideo(fileSrc);

          return (
            <div
              key={idx}
              className="relative group aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-inner"
            >
              {videoElement ? (
                <div className="w-full h-full relative">
                  <video
                    src={fullSrc}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute bottom-1 left-1 bg-slate-900/80 p-0.5 rounded text-[8px] text-indigo-400 flex items-center gap-0.5">
                    <Film className="w-2.5 h-2.5" />
                    <span>VÍDEO</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <img
                    src={fullSrc}
                    alt={`Mídia ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 bg-slate-900/80 p-0.5 rounded text-[8px] text-emerald-400 flex items-center gap-0.5">
                    <ImageIcon className="w-2.5 h-2.5" />
                    <span>IMG</span>
                  </div>
                </div>
              )}

              {/* Hover overlay with Delete button */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onRemoveMedia(idx)}
                  className="bg-red-600/90 hover:bg-red-500 p-2 rounded-xl text-white shadow-lg transition-transform transform scale-90 group-hover:scale-100 active:scale-95"
                  title="Remover mídia"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Media Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square bg-slate-950 hover:bg-slate-900 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-slate-500 hover:text-indigo-400 group"
        >
          <Plus className="w-6 h-6 mb-1 transition-transform group-hover:scale-110" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Add</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </button>
      </div>
    </div>
  );
};
