import React, { useState, useEffect } from 'react';
import type { Scene } from '../types/video';
import { MediaManager } from './MediaManager';
import defaultTemplateBg from '../../assets/images/default_template_preview.png';
import { 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Mic, 
  Settings, 
  Volume2, 
  Type, 
  AlertTriangle,
  Smartphone,
  Tv,
  Info,
  Heart,
  MessageSquare,
  Send,
  MoreHorizontal
} from 'lucide-react';

interface SceneCardProps {
  scene: Scene;
  index: number;
  onUpdateField: (field: keyof Scene, value: any) => void;
  onDelete: () => void;
  onAddMediaForSlot: (slotIdx: number, files: FileList) => void;
  onUpdateMediaForSlot: (slotIdx: number, value: string) => void;
  apiUrl: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
  templates?: string[];
}

interface TemplateGuide {
  title: string;
  allowed: string;
  limit: string;
  timing: string;
  instructions: string;
}

const getTemplateGuide = (template: string): TemplateGuide => {
  switch (template) {
    case '1':
    case '10_best':
      return {
        title: '10 Best (Listicle)',
        allowed: 'Vídeos curtos e Imagens',
        limit: 'Até 10 mídias recomendadas (para cortes dinâmicos)',
        timing: 'Duração recomendada: 5 a 15 segundos',
        instructions: 'O motor corta entre as mídias carregadas. Para trocar de mídia, clique na lixeira vermelha ao passar o mouse sobre a miniatura no box abaixo e adicione outra.'
      };
    case '2':
    case 'breaking_news':
      return {
        title: 'Breaking News',
        allowed: 'Imagens HD e vídeos cinematográficos',
        limit: 'Exatamente 1 mídia de fundo',
        timing: 'Duração recomendada: 6 a 15 segundos',
        instructions: 'Focado em narrativa contínua. Carregue apenas 1 mídia principal de fundo. Para trocar, remova a atual na lixeira e adicione a nova.'
      };
    case '3':
    case 'trendy_stories':
    case 'stories_vendas':
      return {
        title: 'Trendy Stories',
        allowed: 'Fotos verticais de produtos e banners promocionais',
        limit: '1 imagem central do produto + opcional logo/overlay',
        timing: 'Duração recomendada: 5 a 10 segundos',
        instructions: 'Layout formatado com destaque para vendas e link de ação simulated. Remova o produto antigo para fazer upload de um novo.'
      };
    case 'multiscreen':
      return {
        title: 'Multiscreen (Collage)',
        allowed: 'Múltiplas fotos e vídeos',
        limit: 'Até 4 mídias simultâneas na tela',
        timing: 'Duração recomendada: 3 a 8 segundos',
        instructions: 'O motor divide o canvas para exibir múltiplos ângulos das mídias carregadas.'
      };
    case 'teste':
      return {
        title: 'Template de Teste',
        allowed: 'Qualquer imagem/vídeo',
        limit: 'Até 2 mídias',
        timing: 'Duração recomendada: 2 a 5 segundos',
        instructions: 'Ambiente sandbox para testar rendering rápido.'
      };
    default:
      return {
        title: template.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        allowed: 'Imagens e Vídeos',
        limit: 'Qualquer quantidade',
        timing: 'Sem limites recomendados',
        instructions: 'Adicione mídias e insira o roteiro falado.'
      };
  }
};

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  index,
  onUpdateField,
  onDelete,
  onAddMediaForSlot,
  onUpdateMediaForSlot,
  apiUrl,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  templates = ['10_best', 'breaking_news', 'multiscreen', 'teste', 'trendy_stories']
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    setIsGuideOpen(true);
  }, [scene.template]);

  const handleNarrationChange = (text: string) => {
    // Timing rule: ~140 words per minute (~2.3 words per second)
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const calculatedTime = parseFloat((words.length / 2.3).toFixed(1));
    
    onUpdateField('narration', text);
    onUpdateField('audioDuration', calculatedTime);

    // Auto-adjust take duration if it's less than the narration duration
    if (scene.takeDuration < calculatedTime) {
      onUpdateField('takeDuration', Math.ceil(calculatedTime + 1.0));
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

  const isTimingShort = scene.takeDuration < scene.audioDuration;
  const isVertical = scene.resolution === '1080x1920' || scene.resolution === '2160x3840';

  // Slot calculations
  const primaryMedia = scene.mediaFiles[0] || '';
  const isBgColor = primaryMedia.startsWith('#');
  const isBgTrans = primaryMedia === 'transparent';
  const hasBgMedia = primaryMedia && !isBgColor && !isBgTrans;
  const backgroundSrc = hasBgMedia ? getFullUrl(primaryMedia) : (!isBgColor && !isBgTrans ? defaultTemplateBg : '');
  const isBgVideo = hasBgMedia && isVideo(primaryMedia);
  const guide = getTemplateGuide(scene.template);

  return (
    <div 
      className="bg-slate-900/60 rounded-2xl p-5 shadow-xl flex flex-col gap-6"
      data-id={scene.id}
    >
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-600/20 text-indigo-400 font-extrabold px-3 py-1 rounded-lg text-xs uppercase tracking-wider">
            CENA {String(index + 1).padStart(2, '0')}
          </span>
          <select
            value={scene.template}
            onChange={(e) => onUpdateField('template', e.target.value)}
            className="bg-slate-950 text-slate-300 text-xs rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-900/50 transition-colors"
          >
            {templates.map(tmpl => {
              const label = tmpl.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return (
                <option key={tmpl} value={tmpl}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        {/* Scene control buttons */}
        <div className="flex items-center gap-2">
          {/* Ordering buttons */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              className={`p-1.5 rounded-md transition-colors ${
                isFirst 
                  ? 'text-slate-700 cursor-not-allowed' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Mover para cima"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              className={`p-1.5 rounded-md transition-colors ${
                isLast 
                  ? 'text-slate-700 cursor-not-allowed' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Mover para baixo"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md flex items-center gap-1.5">
            {isVertical ? <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> : <Tv className="w-3.5 h-3.5 text-indigo-400" />}
            {scene.resolution === '1920x1080' ? '1080p • 16:9' : 
             scene.resolution === '1080x1920' ? '1080p • 9:16' : 
             scene.resolution === '3840x2160' ? '4K • 16:9' : '4K • 9:16'}
          </span>

          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
            title="Deletar cena"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: Editor Form (Left) & Canvas Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: EDITOR FORM (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {/* Mídias */}
            <div className="md:col-span-2">
              <MediaManager
                template={scene.template}
                mediaFiles={scene.mediaFiles}
                onUpdateMediaForSlot={onUpdateMediaForSlot}
                onAddMediaForSlot={onAddMediaForSlot}
                apiUrl={apiUrl}
              />
            </div>

            {/* Narração */}
            <div className="md:col-span-3 flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Texto de Narração / Prompt de Voz
              </label>
              <textarea
                value={scene.narration}
                onChange={(e) => handleNarrationChange(e.target.value)}
                className="w-full flex-1 min-h-[110px] p-3 text-sm text-slate-200 bg-slate-955 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:bg-slate-955/50 transition-all resize-none outline-none placeholder:text-slate-600"
                placeholder="Digite a narração da cena aqui. O tempo de áudio será estimado automaticamente..."
              />
            </div>
          </div>

          {/* Collapsible Settings Block */}
          <details className="group rounded-xl overflow-hidden bg-slate-955/40">
            <summary className="flex items-center justify-between p-3 text-xs font-bold text-slate-400 bg-slate-950 cursor-pointer hover:bg-slate-900/60 select-none transition-colors">
              <span className="flex items-center gap-2 uppercase tracking-wider">
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                Configurações & Ajustes do Take
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            
            <div className="p-4 bg-slate-955/20 flex flex-col gap-4">
              {/* Timing Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-900/50">
                {/* Tempo de Áudio Estimado */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                      Áudio Estimado
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-300">
                      ~ {scene.audioDuration.toFixed(1)}s
                    </p>
                  </div>
                  {isTimingShort && (
                    <div 
                      className="ml-auto bg-amber-955/40 text-amber-400 border border-amber-900/50 rounded-lg px-2 py-0.5 flex items-center gap-1 animate-pulse"
                      title="O tempo de tela é menor do que o tempo de narração!"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-[8px] font-bold">Curto demais</span>
                    </div>
                  )}
                </div>

                {/* Forçar Manualmente a Duração */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-left sm:text-right">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Duração do Take
                    </label>
                    <span className="text-[9px] text-slate-500 block leading-tight">
                      Tempo de exibição
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900 rounded-lg px-2.5 py-1 w-24 focus-within:ring-1 focus-within:ring-indigo-500 transition-shadow">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={scene.takeDuration}
                      onChange={(e) => onUpdateField('takeDuration', Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                      className="w-full text-xs font-mono font-bold bg-transparent text-slate-200 text-center outline-none"
                    />
                    <span className="text-[10px] font-bold text-slate-500">seg</span>
                  </div>
                </div>
              </div>

              {/* Sound & Subtitle Styles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Mixagem de Música de Fundo */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-slate-500 text-[9px] flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      Volume da Música (BGM)
                    </span>
                    <span className="font-mono text-slate-300 font-bold text-[10px]">{scene.bgVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scene.bgVolume}
                    onChange={(e) => onUpdateField('bgVolume', parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Escolha das Legendas */}
                <div className="flex flex-col gap-1">
                  <span className="font-bold uppercase tracking-wider text-slate-500 text-[9px] flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-indigo-400" />
                    Estilo da Legenda
                  </span>
                  <select
                    value={scene.subtitleStyle}
                    onChange={(e) => onUpdateField('subtitleStyle', e.target.value)}
                    className="w-full bg-slate-900 text-slate-300 rounded-lg p-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="yellow">Destaque Amarelo</option>
                    <option value="minimalist">Branco Minimalista</option>
                    <option value="none">Sem Legendas</option>
                  </select>
                </div>
              </div>
            </div>
          </details>

          {/* About Template & Guidelines Accordion (Collapsible, opens automatically) */}
          <details 
            open={isGuideOpen} 
            onToggle={(e) => setIsGuideOpen(e.currentTarget.open)}
            className="group rounded-xl overflow-hidden bg-slate-950/40"
          >
            <summary className="flex items-center justify-between p-3 text-xs font-bold text-slate-400 bg-slate-950 cursor-pointer hover:bg-slate-900/60 select-none transition-colors">
              <span className="flex items-center gap-2 uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Sobre o Template & Diretrizes
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            
            <div className="p-4 bg-slate-955/20 flex flex-col gap-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <span className="bg-indigo-600/10 text-indigo-400 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded">
                  {guide.title}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-400">
                <div>
                  <span className="font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">Tipos Permitidos</span>
                  <span className="font-semibold text-slate-300">{guide.allowed}</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">Quantidade de Mídias</span>
                  <span className="font-semibold text-slate-300">{guide.limit}</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 leading-relaxed pt-2">
                <span className="text-indigo-400 font-bold uppercase tracking-wider block mb-0.5">Instruções de Troca</span>
                {guide.instructions}
              </div>
            </div>
          </details>
        </div>

        {/* RIGHT COLUMN: LIVE CANVAS PREVIEW (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-3.5 pt-5 lg:pt-0 lg:pl-6 w-full">
          <div className="flex items-center justify-between w-full">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Preview do Layout
            </h4>
            <span className="text-[9px] text-slate-600 font-mono">
              WYSIWYG Simulação
            </span>
          </div>

          {/* Simulator Canvas Wrapper */}
          <div className="w-full flex items-center justify-center bg-slate-950/40 rounded-2xl p-4 shadow-inner min-h-[350px]">
            {isVertical ? (
              /* SMARTPHONE FRAME (9:16 Aspect Ratio Mockup) - Responsive max-width */
              <div className="aspect-[9/16] w-full max-w-[210px] sm:max-w-[240px] md:max-w-[260px] lg:max-w-full xl:max-w-[280px] rounded-[2rem] border-8 border-slate-950 bg-slate-900 relative overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-300">
                {/* Simulated Notch / iPhone Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-slate-950 rounded-full z-30" />
                
                {scene.template === 'multiscreen' ? (
                  /* SPLIT MULTISCREEN MOCKUP PREVIEW */
                  <div className="absolute inset-0 flex z-0">
                    {[0, 1, 2].map((slotIdx) => {
                      const media = scene.mediaFiles[slotIdx] || '';
                      const isCol = media.startsWith('#');
                      const isTr = media === 'transparent';
                      const hasMed = media && !isCol && !isTr;
                      const srcUrl = hasMed ? getFullUrl(media) : defaultTemplateBg;
                      const isVid = hasMed && isVideo(media);

                      return (
                        <div key={slotIdx} className="flex-1 h-full border-r border-slate-950/50 last:border-r-0 relative overflow-hidden bg-slate-950">
                          {hasMed ? (
                            isVid ? (
                              <video src={srcUrl} autoPlay muted loop className="w-full h-full object-cover" />
                            ) : (
                              <img src={srcUrl} alt="" className="w-full h-full object-cover" />
                            )
                          ) : isCol ? (
                            <div className="w-full h-full" style={{ backgroundColor: media }} />
                          ) : isTr ? (
                            <div 
                              className="w-full h-full" 
                              style={{
                                backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                                backgroundSize: '10px 10px',
                                backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                                backgroundColor: '#0f172a'
                              }}
                            />
                          ) : (
                            <img src={defaultTemplateBg} alt="" className="w-full h-full object-cover opacity-80" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* STANDARD SINGLE BG PREVIEW */
                  hasBgMedia ? (
                    isBgVideo ? (
                      <video 
                        src={backgroundSrc} 
                        autoPlay 
                        muted 
                        loop 
                        className="absolute inset-0 w-full h-full object-cover z-0" 
                      />
                    ) : (
                      <img 
                        src={backgroundSrc} 
                        alt="Preview Fundo" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="absolute inset-0 w-full h-full object-cover z-0" 
                      />
                    )
                  ) : isBgColor ? (
                    <div className="absolute inset-0 z-0" style={{ backgroundColor: primaryMedia }} />
                  ) : isBgTrans ? (
                    <div 
                      className="absolute inset-0 z-0" 
                      style={{
                        backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                        backgroundColor: '#0f172a'
                      }}
                    />
                  ) : (
                    <img 
                      src={defaultTemplateBg} 
                      alt="Preview Fundo" 
                      className="absolute inset-0 w-full h-full object-cover z-0 opacity-80" 
                    />
                  )
                )}

                {/* Template Specific Overlays inside Phone */}
                {scene.template === '1' && (
                  /* REELS SIMULATION */
                  <>
                    {/* Simulated Reels Right Bar */}
                    <div className="absolute right-1.5 bottom-[22%] flex flex-col gap-2 text-white items-center opacity-85 z-10">
                      <div className="w-6 h-6 rounded-full border border-slate-100 bg-slate-800 flex items-center justify-center text-[7px] font-bold text-white shadow-md">@</div>
                      <div className="flex flex-col items-center gap-0.5">
                        <Heart className="w-3.5 h-3.5 fill-white text-white drop-shadow-md" />
                        <span className="text-[7px] font-bold font-mono">1.2K</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <MessageSquare className="w-3.5 h-3.5 text-white drop-shadow-md" />
                        <span className="text-[7px] font-bold font-mono">45</span>
                      </div>
                      <Send className="w-3.5 h-3.5 text-white drop-shadow-md" />
                      <MoreHorizontal className="w-3.5 h-3.5 text-white drop-shadow-md" />
                    </div>

                    {/* Simulated Reels bottom details */}
                    <div className="absolute left-2.5 bottom-12 text-left text-white z-10 w-[70%]">
                      <p className="text-[8px] font-bold drop-shadow-md">@produtor_ia • <span className="text-indigo-400">Seguir</span></p>
                      <p className="text-[7px] font-medium opacity-80 drop-shadow-sm truncate mt-0.5">Música Original - Crom Mix</p>
                    </div>
                  </>
                )}

                {scene.template === '3' && (
                  /* STORIES VENDAS SIMULATION */
                  <>
                    <div className="absolute inset-1 rounded-[1.6rem] border border-dashed border-yellow-500/40 pointer-events-none z-10" />
                    
                    {/* Top Simulated Stories Bar */}
                    <div className="absolute top-8 left-0 w-full px-3 flex gap-1 z-10">
                      <div className="h-0.5 flex-1 bg-yellow-400 rounded-full" />
                      <div className="h-0.5 flex-1 bg-slate-800 rounded-full" />
                    </div>

                    {/* Swipe Up tag */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[7px] font-extrabold tracking-widest px-2.5 py-0.5 rounded-full shadow-xl z-20 pointer-events-none flex items-center gap-0.5 uppercase transition-all duration-300 animate-pulse">
                      Ver Oferta
                    </div>
                  </>
                )}

                {/* Subtitle Narration inside Phone */}
                {scene.subtitleStyle !== 'none' && scene.narration.trim() && (
                  <div className={`absolute left-1/2 -translate-x-1/2 w-[90%] z-20 text-center ${
                    scene.template === '1' ? 'bottom-[35%]' : 'bottom-[20%]'
                  }`}>
                    {scene.subtitleStyle === 'yellow' ? (
                      <span className="bg-slate-950/80 text-yellow-400 font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded border border-yellow-400/20 leading-tight block shadow-lg">
                        {scene.narration}
                      </span>
                    ) : (
                      <span className="text-white font-semibold text-[9px] drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.95)] block leading-tight px-1">
                        {scene.narration}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* TV/MONITOR FRAME (16:9 Aspect Ratio Mockup) - Responsive max-width */
              <div className="aspect-[16/9] w-full max-w-[310px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-full xl:max-w-[420px] rounded-xl border-4 border-slate-950 bg-slate-900 relative overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-300">
                
                {scene.template === 'multiscreen' ? (
                  /* SPLIT MULTISCREEN MOCKUP PREVIEW */
                  <div className="absolute inset-0 flex z-0">
                    {[0, 1, 2].map((slotIdx) => {
                      const media = scene.mediaFiles[slotIdx] || '';
                      const isCol = media.startsWith('#');
                      const isTr = media === 'transparent';
                      const hasMed = media && !isCol && !isTr;
                      const srcUrl = hasMed ? getFullUrl(media) : defaultTemplateBg;
                      const isVid = hasMed && isVideo(media);

                      return (
                        <div key={slotIdx} className="flex-1 h-full border-r border-slate-950/50 last:border-r-0 relative overflow-hidden bg-slate-955">
                          {hasMed ? (
                            isVid ? (
                              <video src={srcUrl} autoPlay muted loop className="w-full h-full object-cover" />
                            ) : (
                              <img src={srcUrl} alt="" className="w-full h-full object-cover" />
                            )
                          ) : isCol ? (
                            <div className="w-full h-full" style={{ backgroundColor: media }} />
                          ) : isTr ? (
                            <div 
                              className="w-full h-full" 
                              style={{
                                backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                                backgroundSize: '10px 10px',
                                backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                                backgroundColor: '#0f172a'
                              }}
                            />
                          ) : (
                            <img src={defaultTemplateBg} alt="" className="w-full h-full object-cover opacity-80" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* STANDARD SINGLE BG PREVIEW */
                  hasBgMedia ? (
                    isBgVideo ? (
                      <video 
                        src={backgroundSrc} 
                        autoPlay 
                        muted 
                        loop 
                        className="absolute inset-0 w-full h-full object-cover z-0" 
                      />
                    ) : (
                      <img 
                        src={backgroundSrc} 
                        alt="Preview Fundo" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="absolute inset-0 w-full h-full object-cover z-0" 
                      />
                    )
                  ) : isBgColor ? (
                    <div className="absolute inset-0 z-0" style={{ backgroundColor: primaryMedia }} />
                  ) : isBgTrans ? (
                    <div 
                      className="absolute inset-0 z-0" 
                      style={{
                        backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                        backgroundColor: '#0f172a'
                      }}
                    />
                  ) : (
                    <img 
                      src={defaultTemplateBg} 
                      alt="Preview Fundo" 
                      className="absolute inset-0 w-full h-full object-cover z-0 opacity-80" 
                    />
                  )
                )}

                {/* Template Specific Overlays inside TV */}
                {scene.template === '2' && (
                  /* DOCUMENTARY BLACK CINEMATIC BARS */
                  <>
                    <div className="absolute top-0 left-0 w-full h-[10%] bg-black/90 z-10" />
                    <div className="absolute bottom-0 left-0 w-full h-[10%] bg-black/90 z-10" />
                  </>
                )}

                {/* Subtitle Narration inside TV */}
                {scene.subtitleStyle !== 'none' && scene.narration.trim() && (
                  <div className="absolute bottom-[13%] left-1/2 -translate-x-1/2 w-[85%] z-20 text-center">
                    {scene.subtitleStyle === 'yellow' ? (
                      <span className="bg-slate-955/80 text-yellow-400 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded leading-tight inline-block shadow-lg">
                        {scene.narration}
                      </span>
                    ) : (
                      <span className="text-white font-semibold text-[9px] drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.95)] inline-block leading-tight px-1">
                        {scene.narration}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 bg-slate-950/30 p-2 rounded-lg text-center leading-relaxed w-full">
            Mídias e legendas serão renderizadas fisicamente no arquivo final nas posições e estilos configurados.
          </div>
        </div>
      </div>
    </div>
  );
};
