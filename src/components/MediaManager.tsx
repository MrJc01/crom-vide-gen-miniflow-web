import React, { useRef, useState } from 'react';
import { Trash2, Film, Sparkles } from 'lucide-react';

interface MediaManagerProps {
  template: string;
  mediaFiles: string[];
  onUpdateMediaForSlot: (slotIdx: number, value: string) => void;
  onAddMediaForSlot: (slotIdx: number, files: FileList) => void;
  apiUrl: string;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  template,
  mediaFiles,
  onUpdateMediaForSlot,
  onAddMediaForSlot,
  apiUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);

  const getSlotsForTemplate = (tmpl: string) => {
    if (tmpl === 'multiscreen') {
      return [
        { label: 'Mídia Esquerda', type: 'video' },
        { label: 'Mídia Central', type: 'video' },
        { label: 'Mídia Direita', type: 'video' }
      ];
    }
    return [
      { label: 'Mídia Principal (Fundo)', type: 'video' }
    ];
  };

  const slots = getSlotsForTemplate(template);

  const triggerUploadForSlot = (slotIdx: number) => {
    setActiveSlotIdx(slotIdx);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && activeSlotIdx !== null) {
      onAddMediaForSlot(activeSlotIdx, e.target.files);
    }
  };

  const getFullUrl = (path: string) => {
    if (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
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
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between pb-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Substituição de Mídias ({slots.length} slot/s)
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {slots.map((slot, idx) => {
          const fileSrc = mediaFiles[idx] || '';
          const isColor = fileSrc.startsWith('#');
          const isTrans = fileSrc === 'transparent';
          const hasMedia = fileSrc && !isColor && !isTrans;
          const fullSrc = hasMedia ? getFullUrl(fileSrc) : '';
          const videoElement = hasMedia && isVideo(fileSrc);

          return (
            <div 
              key={idx} 
              className="bg-slate-950 rounded-xl p-3 flex items-center justify-between gap-3 shadow-inner transition-colors"
            >
              {/* Left Side: Thumbnail Preview */}
              <div 
                className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center"
                style={isTrans ? {
                  backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                  backgroundSize: '10px 10px',
                  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                  backgroundColor: '#0f172a'
                } : undefined}
              >
                {hasMedia ? (
                  videoElement ? (
                    <video src={fullSrc} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={fullSrc} alt="" className="w-full h-full object-cover" />
                  )
                ) : isColor ? (
                  <div className="w-full h-full" style={{ backgroundColor: fileSrc }} />
                ) : isTrans ? (
                  <div className="w-full h-full opacity-60" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-700 text-center p-1">
                    <Film className="w-4 h-4 mb-0.5" />
                    <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Padrão</span>
                  </div>
                )}
              </div>

              {/* Center Side: Slot Info & Controls */}
              <div className="flex-1 flex flex-col justify-between h-14 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-white block uppercase tracking-wider truncate">
                    {slot.label}
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">
                    {hasMedia ? (videoElement ? 'VÍDEO' : 'IMAGEM') : isColor ? 'SÓLIDO' : isTrans ? 'TRANSP.' : 'ENGINE'}
                  </span>
                </div>

                {/* Slot Actions Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {/* Media Upload Trigger */}
                  <button
                    type="button"
                    onClick={() => triggerUploadForSlot(idx)}
                    className="px-2 py-1 text-[9px] font-bold text-slate-300 hover:text-indigo-400 bg-slate-900 hover:bg-slate-850 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Mídia
                  </button>

                  {/* Solid Color Picker input */}
                  <div className="relative flex items-center bg-slate-900 hover:bg-slate-850 rounded-md px-1.5 py-0.5 group/picker cursor-pointer">
                    <input
                      type="color"
                      value={isColor ? fileSrc : '#4f46e5'}
                      onChange={(e) => onUpdateMediaForSlot(idx, e.target.value)}
                      className="w-3.5 h-3.5 border-0 p-0 cursor-pointer bg-transparent rounded"
                    />
                    <span className="text-[9px] font-bold text-slate-355 ml-1">Cor</span>
                  </div>

                  {/* Transparency Trigger */}
                  <button
                    type="button"
                    onClick={() => onUpdateMediaForSlot(idx, 'transparent')}
                    className={`px-2 py-1 text-[9px] font-bold rounded-md transition-colors cursor-pointer ${
                      isTrans 
                        ? 'text-indigo-400 bg-indigo-950/20' 
                        : 'text-slate-300 bg-slate-900 hover:bg-slate-850'
                    }`}
                  >
                    Transp.
                  </button>

                  {/* Clear/Reset Slot */}
                  {(hasMedia || isColor || isTrans) && (
                    <button
                      type="button"
                      onClick={() => onUpdateMediaForSlot(idx, '')}
                      className="p-1 text-red-500 hover:text-red-400 hover:bg-red-950/20 rounded-md transition-colors ml-auto cursor-pointer"
                      title="Restaurar padrão"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <input
        type="file"
        accept="image/*,video/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
};
