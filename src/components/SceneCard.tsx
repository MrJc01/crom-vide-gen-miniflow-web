import React from 'react';
import type { Scene } from '../types/video';
import { MediaManager } from './MediaManager';
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
  onAddMedia: (files: FileList) => void;
  onRemoveMedia: (mediaIndex: number) => void;
  apiUrl: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
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
      return {
        title: 'Reels Dinâmico',
        allowed: 'Vídeos curtos e Imagens',
        limit: 'Até 5 mídias recomendadas (para cortes dinâmicos)',
        timing: 'Duração recomendada: 3 a 5 segundos',
        instructions: 'O motor corta entre as mídias carregadas. Para trocar de mídia, clique na lixeira vermelha ao passar o mouse sobre a miniatura no box abaixo e adicione outra.'
      };
    case '2':
      return {
        title: 'Documentário',
        allowed: 'Imagens HD e vídeos cinematográficos',
        limit: 'Exatamente 1 mídia de fundo',
        timing: 'Duração recomendada: 6 a 15 segundos',
        instructions: 'Focado em narrativa contínua. Carregue apenas 1 mídia principal de fundo. Para trocar, remova a atual na lixeira e adicione a nova.'
      };
    case '3':
      return {
        title: 'Stories Vendas',
        allowed: 'Fotos verticais de produtos e banners promocionais',
        limit: '1 imagem central do produto + opcional logo/overlay',
        timing: 'Duração recomendada: 5 a 10 segundos',
        instructions: 'Layout formatado com destaque para vendas e link de ação simulated. Remova o produto antigo para fazer upload de um novo.'
      };
    default:
      return {
        title: 'Template Geral',
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
  onAddMedia,
  onRemoveMedia,
  apiUrl,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
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
  const isVertical = scene.resolution.includes('1080x1920') || scene.resolution.includes('2160x3840');
  const guide = getTemplateGuide(scene.template);

  // Background media source in real-time preview
  const firstMedia = scene.mediaFiles.length > 0 ? scene.mediaFiles[0] : null;
  const backgroundSrc = firstMedia ? getFullUrl(firstMedia) : null;
  const isBgVideo = firstMedia ? isVideo(firstMedia) : false;

  return (
    <div 
      className="w-full bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-5 sm:p-6 flex flex-col gap-5 transition-all hover:border-slate-700/80 group"
      data-id={scene.id}
    >
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-600/20 text-indigo-400 font-extrabold px-3 py-1 rounded-lg text-xs uppercase tracking-wider border border-indigo-500/30">
            CENA {String(index + 1).padStart(2, '0')}
          </span>
          <select
            value={scene.template}
            onChange={(e) => onUpdateField('template', e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-900/50 transition-colors"
          >
            <option value="1">Template 1: Reels Dinâmico</option>
            <option value="2">Template 2: Documentário</option>
            <option value="3">Template 3: Stories Vendas</option>
          </select>
        </div>

        {/* Scene control buttons */}
        <div className="flex items-center gap-2">
          {/* Ordering buttons */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800/80">
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

          <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1.5">
            {isVertical ? <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> : <Tv className="w-3.5 h-3.5 text-indigo-400" />}
            {scene.resolution === '1920x1080' ? '1080p • 16:9' : 
             scene.resolution === '1080x1920' ? '1080p • 9:16' : 
             scene.resolution === '3840x2160' ? '4K • 16:9' : '4K • 9:16'}
          </span>

          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-colors"
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
          
          {/* Dynamic Template Rule / Guidelines */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-600/10 text-indigo-400 border-l border-b border-indigo-500/25 px-2.5 py-0.5 rounded-bl-lg text-[9px] font-extrabold uppercase tracking-wider">
              Diretrizes do Layout
            </div>
            
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {guide.title}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] mt-1">
              <div>
                <span className="text-slate-500 uppercase tracking-wider font-extrabold block">Tipos Permitidos</span>
                <span className="text-slate-300 font-semibold">{guide.allowed}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase tracking-wider font-extrabold block">Quantidade Permitida</span>
                <span className="text-slate-300 font-semibold">{guide.limit}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed border-t border-slate-900 pt-2 font-medium">
              <span className="text-indigo-400 font-bold">Como trocar:</span> {guide.instructions}
            </p>
          </div>

          {/* Grid Mídias e Roteiro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mídias */}
            <div className="md:col-span-1">
              <MediaManager
                mediaFiles={scene.mediaFiles}
                onAddMedia={onAddMedia}
                onRemoveMedia={onRemoveMedia}
                apiUrl={apiUrl}
              />
            </div>

            {/* Narração */}
            <div className="md:col-span-2 flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Texto de Narração / Prompt de Voz
              </label>
              <textarea
                value={scene.narration}
                onChange={(e) => handleNarrationChange(e.target.value)}
                className="w-full flex-1 min-h-[110px] p-3 text-sm text-slate-200 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:bg-slate-950/50 transition-all resize-none outline-none placeholder:text-slate-600"
                placeholder="Digite a narração da cena aqui. O tempo de áudio será estimado automaticamente..."
              />
            </div>
          </div>

          {/* Ajustes de Tempos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            {/* Tempo de Áudio Estimado */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Áudio Estimado
                </p>
                <p className="text-sm font-mono font-bold text-slate-300 mt-0.5">
                  ~ {scene.audioDuration.toFixed(1)}s
                </p>
              </div>
              {isTimingShort && (
                <div 
                  className="ml-auto bg-amber-950/40 text-amber-400 border border-amber-900/50 rounded-lg px-2 py-1 flex items-center gap-1 animate-pulse"
                  title="O tempo de tela é menor do que o tempo de narração!"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[9px] font-bold">Curto demais</span>
                </div>
              )}
            </div>

            {/* Forçar Manualmente a Duração */}
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="text-left sm:text-right">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Duração do Take
                </label>
                <span className="text-[10px] text-slate-500 block">
                  Tempo de exibição da cena
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 w-28 focus-within:ring-1 focus-within:ring-indigo-500 transition-shadow">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={scene.takeDuration}
                  onChange={(e) => onUpdateField('takeDuration', Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                  className="w-full text-sm font-mono font-bold bg-transparent text-slate-200 text-center outline-none"
                />
                <span className="text-xs font-bold text-slate-500">seg</span>
              </div>
            </div>
          </div>

          {/* Configurações Avançadas (Accordion Nativo) */}
          <details className="group border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/20">
            <summary className="flex items-center justify-between p-3 text-xs font-medium text-slate-400 bg-slate-950 cursor-pointer hover:bg-slate-900/80 select-none transition-colors">
              <span className="flex items-center gap-2 font-bold text-slate-400 uppercase tracking-wider">
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                Configurações Avançadas da Cena
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row gap-6 text-xs">
              {/* Mixagem de Música de Fundo */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-indigo-400" />
                    Volume da Trilha de Fundo (BGM)
                  </span>
                  <span className="font-mono text-slate-300 font-bold">{scene.bgVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scene.bgVolume}
                  onChange={(e) => onUpdateField('bgVolume', parseInt(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-lg cursor-pointer transition-colors"
                />
              </div>

              {/* Escolha das Legendas */}
              <div className="w-full sm:w-1/3 flex flex-col gap-1.5">
                <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] flex items-center gap-1">
                  <Type className="w-3 h-3 text-indigo-400" />
                  Estilo da Legenda
                </span>
                <select
                  value={scene.subtitleStyle}
                  onChange={(e) => onUpdateField('subtitleStyle', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-md p-1.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="yellow">Destaque Amarelo</option>
                  <option value="minimalist">Branco Minimalista</option>
                  <option value="none">Sem Legendas</option>
                </select>
              </div>
            </div>
          </details>
        </div>

        {/* RIGHT COLUMN: LIVE CANVAS PREVIEW (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-3.5 border-t lg:border-t-0 lg:border-l border-slate-800 pt-5 lg:pt-0 lg:pl-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Preview do Layout
            </h4>
            <span className="text-[9px] text-slate-600 font-mono">
              WYSIWYG Simulação
            </span>
          </div>

          {/* Simulator Canvas Wrapper */}
          <div className="w-full flex items-center justify-center bg-slate-950/40 rounded-2xl p-4 border border-slate-800/50 shadow-inner min-h-[300px]">
            {isVertical ? (
              /* SMARTPHONE FRAME (9:16 Aspect Ratio Mockup) */
              <div className="aspect-[9/16] w-full max-w-[210px] rounded-[2rem] border-8 border-slate-950 bg-slate-900 relative overflow-hidden shadow-2xl flex flex-col justify-between">
                {/* Simulated Notch / iPhone Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-slate-950 rounded-full z-30" />
                
                {/* Background rendering inside phone */}
                {backgroundSrc ? (
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
                      className="absolute inset-0 w-full h-full object-cover z-0" 
                    />
                  )
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-center z-0">
                    <span className="text-slate-600 text-[10px] font-bold block uppercase tracking-wider mb-1">
                      Sem mídia
                    </span>
                    <span className="text-[8px] text-slate-700">
                      Adicione imagens/vídeos ao take
                    </span>
                  </div>
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
              /* TV/MONITOR FRAME (16:9 Aspect Ratio Mockup) */
              <div className="aspect-[16/9] w-full max-w-[310px] rounded-xl border-4 border-slate-950 bg-slate-900 relative overflow-hidden shadow-2xl flex flex-col justify-between">
                
                {/* Background rendering inside TV */}
                {backgroundSrc ? (
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
                      className="absolute inset-0 w-full h-full object-cover z-0" 
                    />
                  )
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-center z-0">
                    <span className="text-slate-600 text-[10px] font-bold block uppercase tracking-wider mb-1">
                      Sem mídia
                    </span>
                    <span className="text-[8px] text-slate-700">
                      Adicione imagens/vídeos ao take
                    </span>
                  </div>
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
                      <span className="bg-slate-950/80 text-yellow-400 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded border border-yellow-400/25 leading-tight inline-block shadow-lg">
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

          <div className="text-[10px] text-slate-500 bg-slate-950/30 p-2 rounded-lg border border-slate-800/40 text-center leading-relaxed">
            Mídias e legendas serão renderizadas fisicamente no arquivo final nas posições e estilos configurados.
          </div>
        </div>
      </div>
    </div>
  );
};
