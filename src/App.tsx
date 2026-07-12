import { useState, useEffect } from 'react';
import type { Scene, VideoTemplate, RenderJob } from './types/video';
import { SceneCard } from './components/SceneCard';
import { RenderMonitor } from './components/RenderMonitor';
import { 
  Film, 
  Plus, 
  Play, 
  FileText, 
  Copy, 
  Wifi, 
  WifiOff, 
  Settings,
  Sparkles,
  Maximize2,
  Loader2
} from 'lucide-react';

const DEFAULT_SERVER_URL = 'http://localhost:8080';

export default function App() {
  // Global State
  const [scenes, setScenes] = useState<Scene[]>([
    {
      id: 'scene_' + Math.random().toString(36).substring(2, 9),
      template: '10_best',
      resolution: '1080x1920', // Default: Vertical Full HD
      mediaFiles: [
        'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=300&q=80'
      ],
      narration: 'A jornada começa agora. Explore os cenários mais incríveis do mundo com cortes dinâmicos.',
      audioDuration: 4.8,
      takeDuration: 5.0,
      bgVolume: 15,
      voiceLang: 'pt-BR-FranciscaNeural',
    }
  ]);

  // Global Configs
  const [projectName, setProjectName] = useState('meu_video_projeto');
  const [globalResolution, setGlobalResolution] = useState('1080x1920'); // 1080x1920 (Vertical)
  const [globalFps, setGlobalFps] = useState(30);
  const [globalBgmUrl, setGlobalBgmUrl] = useState('');
  const [hwAccel, setHwAccel] = useState(false);
  const [jpegQuality, setJpegQuality] = useState(2);

  // App settings & connection
  const [apiUrl, setApiUrl] = useState(DEFAULT_SERVER_URL);
  const [isApiUrlEditing, setIsApiUrlEditing] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);

  // Render & Exporter states
  const [jsonFormat, setJsonFormat] = useState<'simplified' | 'engine'>('simplified');
  const [exportOutput, setExportOutput] = useState('');
  const [isExportVisible, setIsExportVisible] = useState(false);
  const [jobs, setJobs] = useState<Record<string, RenderJob>>({});
  const [isRefreshingJobs, setIsRefreshingJobs] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<string[]>(['10_best', 'breaking_news', 'multiscreen', 'teste', 'trendy_stories']);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Active scene state
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Select first scene as active if none is active
  useEffect(() => {
    if (scenes.length > 0) {
      if (!activeSceneId || !scenes.some(s => s.id === activeSceneId)) {
        setActiveSceneId(scenes[0].id);
      }
    } else {
      setActiveSceneId(null);
    }
  }, [scenes, activeSceneId]);

  const activeScene = scenes.find(s => s.id === activeSceneId) || null;

  // Helper to map uploads to absolute backend URLs
  const getFullUrl = (path: string) => {
    if (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanPath = path.replace(/^tmp\/uploads\//, '');
    return `${apiUrl}/uploads/${cleanPath}`;
  };

  // Helper to detect video format
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

  // Check connection to videogen-server
  const checkConnection = async (urlToCheck: string) => {
    try {
      // Try fetching templates api to verify server presence
      const res = await fetch(`${urlToCheck}/api/templates`, { mode: 'cors' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAvailableTemplates(data);
        }
        setServerConnected(true);
        showNotification('success', 'Conectado ao videogen-server com sucesso!');
      } else {
        setServerConnected(false);
      }
    } catch (e) {
      setServerConnected(false);
    }
  };

  useEffect(() => {
    checkConnection(apiUrl);
  }, []);

  // Fetch jobs list
  const fetchJobs = async () => {
    if (!serverConnected) return;
    setIsRefreshingJobs(true);
    try {
      const res = await fetch(`${apiUrl}/api/videos`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      showNotification('error', 'Falha ao buscar fila de renderização.');
    } finally {
      setIsRefreshingJobs(false);
    }
  };

  // Poll jobs when there are active/processing items
  useEffect(() => {
    let interval: any;
    const hasActiveJobs = Object.values(jobs).some(j => j.status === 'processing' || j.status === 'rendering' || j.status === 'pending');
    
    if (serverConnected && hasActiveJobs) {
      interval = setInterval(() => {
        fetchJobs();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [jobs, serverConnected]);

  // Load jobs once server connects
  useEffect(() => {
    if (serverConnected) {
      fetchJobs();
    }
  }, [serverConnected]);

  // Notifications helper
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Sync scene resolution when global resolution changes
  useEffect(() => {
    setScenes(prev => prev.map(s => ({ ...s, resolution: globalResolution })));
  }, [globalResolution]);

  // Add scene
  const addScene = () => {
    const newId = 'scene_' + Math.random().toString(36).substring(2, 9);
    const newScene: Scene = {
      id: newId,
      template: availableTemplates[0] || '10_best',
      resolution: globalResolution,
      mediaFiles: [],
      narration: '',
      audioDuration: 0,
      takeDuration: 3.0,
      bgVolume: 20,
      voiceLang: 'pt-BR-FranciscaNeural',
    };
    setScenes(prev => [...prev, newScene]);
    setActiveSceneId(newId);
    showNotification('info', 'Nova cena adicionada à timeline.');
  };

  // Delete scene
  const deleteScene = (id: string) => {
    const remaining = scenes.filter(s => s.id !== id);
    setScenes(remaining);
    if (activeSceneId === id) {
      if (remaining.length > 0) {
        setActiveSceneId(remaining[0].id);
      } else {
        setActiveSceneId(null);
      }
    }
    showNotification('info', 'Cena removida.');
  };

  // Update scene field
  const updateSceneField = (id: string, field: keyof Scene, value: any) => {
    setScenes(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  // Move scene up/down
  const moveScene = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === scenes.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newScenes = [...scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[targetIdx];
    newScenes[targetIdx] = temp;
    setScenes(newScenes);
  };

  // Handle media file upload for specific slot
  const handleMediaUploadForSlot = async (sceneId: string, slotIdx: number, fileList: FileList) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || fileList.length === 0) return;

    const file = fileList[0];
    const newMediaFiles = [...scene.mediaFiles];

    if (serverConnected) {
      // Connected to server: Upload real file
      const formData = new FormData();
      formData.append('file', file);

      try {
        showNotification('info', `Enviando arquivo: ${file.name}...`);
        const res = await fetch(`${apiUrl}/api/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (res.ok) {
          const data = await res.json();
          // data.path will be "tmp/uploads/filename"
          newMediaFiles[slotIdx] = data.path;
          showNotification('success', `Arquivo ${file.name} enviado.`);
        } else {
          showNotification('error', `Falha ao enviar arquivo ${file.name}.`);
        }
      } catch (e) {
        showNotification('error', `Erro na conexão durante o upload de ${file.name}.`);
      }
    } else {
      // Offline / Unconnected fallback: Create local object URL
      const localUrl = URL.createObjectURL(file) + (file.type.startsWith('video') ? '#video' : '#image');
      newMediaFiles[slotIdx] = localUrl;
      showNotification('info', `Carregada mídia local offline: ${file.name}`);
    }

    updateSceneField(sceneId, 'mediaFiles', newMediaFiles);
  };

  // Formats JSON payload depending on selector
  const compileJsonData = (format: 'simplified' | 'engine' = jsonFormat) => {
    if (format === 'simplified') {
      // Simplified JSON schema matching the original index.html structure
      return scenes.map((scene, i) => ({
        index: i + 1,
        template_id: scene.template,
        video_settings: {
          resolution: scene.resolution,
          subtitle_style: 'minimalist',
          voice_lang: scene.voiceLang || 'pt'
        },
        assets: {
          media_urls: scene.mediaFiles,
          narration_text: scene.narration
        },
        timing: {
          estimated_audio_seconds: scene.audioDuration,
          final_take_seconds: scene.takeDuration
        },
        audio_mixing: {
          bgm_volume_percent: scene.bgVolume
        }
      }));
    } else {
      // Engine specification schema matching build/TEMPLATES.md
      const [widthStr, heightStr] = globalResolution.split('x');
      const width = parseInt(widthStr) || 1080;
      const height = parseInt(heightStr) || 1920;

      const template: VideoTemplate = {
        template_id: projectName,
        resolution: { width, height },
        fps: globalFps,
        audio_url: globalBgmUrl || undefined,
        hwaccel: hwAccel,
        jpeg_quality: jpegQuality,
        cards: scenes.map((scene, i) => {
          // Construct visual elements based on slots
          const elements: any[] = [];
          
          const getSlotsForTemplate = (tmpl: string) => {
            if (tmpl === 'multiscreen') {
              return [
                { x: 180, y: 960, w: 360, h: 1920 },
                { x: 540, y: 960, w: 360, h: 1920 },
                { x: 900, y: 960, w: 360, h: 1920 }
              ];
            }
            return [
              { x: width / 2, y: height / 2, w: width, h: height }
            ];
          };

          const templateSlots = getSlotsForTemplate(scene.template);
          
          templateSlots.forEach((slot, idx) => {
            const file = scene.mediaFiles[idx];
            if (!file || file === 'transparent') {
              return; // omit element or treat as transparent
            }
            if (file.startsWith('#')) {
              // solid color rect
              elements.push({
                type: 'rect',
                color: file,
                x: slot.x,
                y: slot.y,
                width: slot.w,
                height: slot.h
              });
            } else {
              // image or video element
              const isVid = file.toLowerCase().endsWith('.mp4') || file.toLowerCase().endsWith('.webm') || file.includes('video');
              elements.push({
                type: isVid ? 'video' : 'image',
                content: file,
                x: slot.x,
                y: slot.y,
                width: slot.w,
                height: slot.h
              });
            }
          });

          return {
            id: `cena_${String(i + 1).padStart(2, '0')}`,
            duration_ms: Math.round(scene.takeDuration * 1000),
            background_color: '#0F172A',
            narration: scene.narration,
            voice: scene.voiceLang ? { lang: scene.voiceLang } : { lang: 'pt' },
            elements
          };
        })
      };
      return template;
    }
  };

  const handleGenerateJson = (format: 'simplified' | 'engine' = jsonFormat) => {
    const compiled = compileJsonData(format);
    setExportOutput(JSON.stringify(compiled, null, 4));
    setIsExportVisible(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportOutput);
    showNotification('success', 'JSON copiado para a área de transferência!');
  };

  const downloadJsonFile = () => {
    const blob = new Blob([exportOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName}_template.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Arquivo JSON baixado!');
  };

  // Remote actions
  const triggerRender = async () => {
    if (!serverConnected) {
      showNotification('error', 'O servidor backend não está conectado!');
      return;
    }

    try {
      showNotification('info', 'Enviando roteiro para renderização...');
      // Engine format is required by the backend
      const templatePayload = compileJsonData('engine');

      const res = await fetch(`${apiUrl}/api/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templatePayload),
      });

      if (res.ok) {
        const data = await res.json();
        showNotification('success', `Renderização iniciada! Job ID: ${data.job_id}`);
        fetchJobs();
      } else {
        const errText = await res.text();
        showNotification('error', `Falha ao renderizar: ${errText || res.statusText}`);
      }
    } catch (e) {
      showNotification('error', 'Erro de rede ao disparar renderização.');
    }
  };

  const triggerPreview = async () => {
    if (!serverConnected) {
      showNotification('error', 'O servidor backend não está conectado!');
      return;
    }

    setIsPreviewLoading(true);
    setPreviewImage(null);
    try {
      const templatePayload = compileJsonData('engine');

      const res = await fetch(`${apiUrl}/api/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templatePayload),
      });

      if (res.ok) {
        const blob = await res.blob();
        const imgUrl = URL.createObjectURL(blob);
        setPreviewImage(imgUrl);
        showNotification('success', 'Prévia de frame gerada!');
      } else {
        showNotification('error', 'Falha ao renderizar preview de frame.');
      }
    } catch (e) {
      showNotification('error', 'Erro ao obter preview do backend.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Auto-trigger frame preview when media files of the active scene change
  useEffect(() => {
    if (activeScene && activeScene.mediaFiles && activeScene.mediaFiles.length > 0 && serverConnected) {
      const timer = setTimeout(() => {
        triggerPreview();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeScene?.mediaFiles?.join(','), activeScene?.template, activeScene?.id]);

  const deleteJob = async (id: string) => {
    if (!serverConnected) return;
    try {
      const res = await fetch(`${apiUrl}/api/videos/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showNotification('info', 'Job removido do histórico.');
        fetchJobs();
      }
    } catch (e) {
      showNotification('error', 'Erro ao remover Job.');
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col items-center p-4 sm:p-8 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border animate-fadeIn transition-all duration-300 ${
          notification.type === 'success' ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/30' :
          notification.type === 'error' ? 'bg-red-950/90 text-red-400 border-red-500/30' :
          'bg-slate-900/95 text-indigo-400 border-indigo-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            notification.type === 'success' ? 'bg-emerald-400' :
            notification.type === 'error' ? 'bg-red-400' :
            'bg-indigo-400'
          }`} />
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="w-full max-w-5xl flex flex-col gap-6 my-4">

        {/* Connection Bar & Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 w-full">
          <div>
            <div className="flex items-center gap-3">
              <Film className="w-8 h-8 text-indigo-500" />
              <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">
                AI Video Builder Studio
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1.5 max-w-xl">
              Monte seu roteiro visual, configure as transições de takes e envie os dados em lote para renderização local baseada em Go + FFmpeg.
            </p>
          </div>

          {/* Connection URL config & Project Drawer Button */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 bg-slate-900/80 rounded-xl px-3 py-1.5 w-full md:w-auto">
              {serverConnected ? (
                <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-500" />
              )}
              
              {isApiUrlEditing ? (
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  onBlur={() => {
                    setIsApiUrlEditing(false);
                    checkConnection(apiUrl);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsApiUrlEditing(false);
                      checkConnection(apiUrl);
                    }
                  }}
                  className="bg-slate-950 rounded px-1.5 py-0.5 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              ) : (
                <span 
                  onClick={() => setIsApiUrlEditing(true)}
                  className="text-xs font-mono text-slate-400 cursor-pointer hover:text-slate-200"
                  title="Clique para editar a URL da API"
                >
                  {apiUrl}
                </span>
              )}

              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                serverConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {serverConnected ? 'Online' : 'Offline'}
              </span>
            </div>

            <button
              onClick={() => setIsSidebarOpen(true)}
              className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-850 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-slate-950/20 active:scale-95 cursor-pointer"
              title="Abrir ajustes e produção"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              Configurações
            </button>
          </div>
        </header>

        {/* Studio Workspace Layout */}
        <div className="flex flex-col gap-6 w-full">
          {/* Active Scene Editor Panel */}
          {activeScene ? (
            <SceneCard
              key={activeScene.id}
              scene={activeScene}
              index={scenes.findIndex(s => s.id === activeScene.id)}
              apiUrl={apiUrl}
              isFirst={scenes.findIndex(s => s.id === activeScene.id) === 0}
              isLast={scenes.findIndex(s => s.id === activeScene.id) === scenes.length - 1}
              onUpdateField={(field, value) => updateSceneField(activeScene.id, field, value)}
              onDelete={() => deleteScene(activeScene.id)}
              onAddMediaForSlot={(slotIdx, files) => handleMediaUploadForSlot(activeScene.id, slotIdx, files)}
              onUpdateMediaForSlot={(slotIdx, val) => {
                const newMedia = [...activeScene.mediaFiles];
                newMedia[slotIdx] = val;
                updateSceneField(activeScene.id, 'mediaFiles', newMedia);
              }}
              onMoveUp={() => moveScene(scenes.findIndex(s => s.id === activeScene.id), 'up')}
              onMoveDown={() => moveScene(scenes.findIndex(s => s.id === activeScene.id), 'down')}
              templates={availableTemplates}
            />
          ) : (
            <div className="text-center py-20 bg-slate-900/40 rounded-2xl text-slate-500 flex flex-col items-center gap-2 shadow-inner">
              <Film className="w-8 h-8 text-slate-700" />
              <p className="text-sm">Nenhuma cena na timeline.</p>
              <button 
                onClick={addScene}
                className="mt-2 text-indigo-400 hover:text-indigo-300 font-bold text-xs"
              >
                Adicionar primeira cena
              </button>
            </div>
          )}

          {/* Horizontal Filmstrip Timeline - Overlapping Deck Style */}
          {scenes.length > 0 && (
            <div className="bg-slate-900/60 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between pb-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Storyboard Timeline ({scenes.length} cena(s))
                </span>
                <button 
                  onClick={addScene}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-950/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Cena
                </button>
              </div>
              
              <div className="flex overflow-x-auto py-4 pl-4 pr-10 -space-x-5 hover:space-x-1.5 transition-all duration-300 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {scenes.map((scene, index) => {
                  const isActive = scene.id === activeSceneId;
                  const hasMedia = scene.mediaFiles.length > 0;
                  const mediaUrl = hasMedia ? getFullUrl(scene.mediaFiles[0]) : '';
                  const isVid = hasMedia && isVideo(scene.mediaFiles[0]);
                  
                  return (
                    <div
                      key={scene.id}
                      onClick={() => setActiveSceneId(scene.id)}
                      style={{ zIndex: isActive ? 20 : 10 + index }}
                      className={`flex-shrink-0 w-44 bg-slate-950 rounded-xl p-2.5 cursor-pointer transition-all flex flex-col gap-2 relative select-none hover:z-30 hover:-translate-y-2 hover:scale-105 shadow-xl ${
                        isActive 
                          ? 'ring-2 ring-indigo-600 shadow-indigo-950/80 scale-102 z-20 translate-y-[-2px]' 
                          : 'hover:ring-1 hover:ring-slate-700'
                      }`}
                    >
                      {/* Thumbnail frame indicator */}
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                        {hasMedia ? (
                          isVid ? (
                            <video src={mediaUrl} className="w-full h-full object-cover pointer-events-none" muted />
                          ) : (
                            <img src={mediaUrl} alt="" className="w-full h-full object-cover pointer-events-none" />
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-700 p-2">
                            <Film className="w-5 h-5 mb-0.5" />
                            <span className="text-[8px] font-bold uppercase tracking-wider">Vazio</span>
                          </div>
                        )}
                        <span className="absolute top-1 left-1 bg-slate-950/95 text-slate-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                          #{String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="absolute bottom-1 right-1 bg-slate-950/95 text-slate-300 text-[8px] font-mono px-1 py-0.5 rounded">
                          {scene.takeDuration.toFixed(1)}s
                        </span>
                      </div>
                      
                      {/* Scene text/info */}
                      <div className="flex flex-col gap-0.5 text-left">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 truncate">
                          {scene.template === '1' ? 'Reels Dinâmico' : scene.template === '2' ? 'Documentário' : 'Stories Vendas'}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium truncate h-3.5">
                          {scene.narration || <span className="text-slate-600 italic">Sem narração</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Overlay / Backdrop */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 animate-fadeIn"
          />
        )}

        {/* Sliding Drawer Sidebar */}
        <div 
          className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-450" />
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Ajustes & Produção</h2>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-bold font-mono border border-slate-800 px-2 cursor-pointer"
            >
              Fechar [X]
            </button>
          </div>

          {/* Drawer Body (Scrollable container) */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            
            {/* Project Global Configuration */}
            <div className="bg-slate-955 border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-indigo-400" />
                Configurações Globais
              </h3>

              {/* Project Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Identificador do Template
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-300"
                  placeholder="ID sem espaços..."
                />
              </div>

              {/* Global Resolution Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Proporção e Resolução
                </label>
                <select
                  value={globalResolution}
                  onChange={(e) => setGlobalResolution(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="1080x1920">Vertical (1080x1920) • Reels / Shorts</option>
                  <option value="1920x1080">Horizontal (1920x1080) • YouTube / Full HD</option>
                  <option value="2160x3840">Vertical 4K (2160x3840)</option>
                  <option value="3840x2160">Horizontal 4K (3840x2160)</option>
                </select>
              </div>

              {/* Framerate & Audio */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Taxa de FPS
                  </label>
                  <select
                    value={globalFps}
                    onChange={(e) => setGlobalFps(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="24">24 fps (Cinema)</option>
                    <option value="30">30 fps (Padrão)</option>
                    <option value="60">60 fps (Fluído)</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Qualidade JPEG
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={jpegQuality}
                    onChange={(e) => setJpegQuality(Math.min(31, Math.max(1, parseInt(e.target.value) || 2)))}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center font-mono"
                  />
                </div>
              </div>

              {/* Global Background Audio Path */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Trilha Sonora de Fundo (Caminho/URL)
                </label>
                <input
                  type="text"
                  value={globalBgmUrl}
                  onChange={(e) => setGlobalBgmUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-300 font-mono"
                  placeholder="ex: tmp/uploads/bg_music.mp3"
                />
              </div>

              {/* Hardware Acceleration Checkbox */}
              <label className="flex items-center gap-2 mt-1 cursor-pointer select-none bg-slate-900 border border-slate-850 px-3 py-2.5 rounded-xl hover:bg-slate-850 transition-colors">
                <input
                  type="checkbox"
                  checked={hwAccel}
                  onChange={(e) => setHwAccel(e.target.checked)}
                  className="w-4 h-4 accent-indigo-650 rounded cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">Aceleração por GPU</span>
                  <span className="text-[9px] text-slate-500">Usa NVENC (fallback automático p/ CPU)</span>
                </div>
              </label>
            </div>

            {/* Backend Actions & Production Triggers */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Ações de Produção
              </h3>

              <div className="flex flex-col gap-3">
                {/* Visual Preview Trigger */}
                <button
                  type="button"
                  onClick={triggerPreview}
                  disabled={!serverConnected || isPreviewLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-850 text-indigo-400 border border-indigo-950 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPreviewLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando Prévia...
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4" />
                      Visualizar Primeiro Frame
                    </>
                  )}
                </button>

                {/* Render Trigger */}
                <button
                  type="button"
                  onClick={triggerRender}
                  disabled={!serverConnected || scenes.length === 0}
                  className="w-full py-3 px-4 rounded-xl text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-950/50 hover:shadow-indigo-950/70 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Renderizar Vídeo Completo
                </button>

                {/* Local JSON compiler */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false); // Close drawer to show JSON export panel
                    handleGenerateJson();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Gerar Estrutura JSON
                </button>
              </div>

              {/* Visual Preview Modal/Viewer */}
              {previewImage && (
                <div className="mt-2 p-2 bg-slate-900 border border-slate-850 rounded-xl relative group">
                  <span className="absolute top-3 left-3 bg-slate-955/90 text-indigo-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/20">
                    PRÉVIA DO FRAME 1
                  </span>
                  <img
                    src={previewImage}
                    alt="Frame preview"
                    className="w-full h-auto rounded-lg border border-slate-950"
                  />
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-3 right-3 bg-slate-955/90 text-slate-400 hover:text-white p-1 rounded-md text-[8px]"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>

            {/* Fila de Jobs Monitor */}
            {serverConnected && (
              <RenderMonitor
                jobs={jobs}
                onRefresh={fetchJobs}
                onDeleteJob={deleteJob}
                apiUrl={apiUrl}
                isRefreshing={isRefreshingJobs}
              />
            )}
          </div>
        </div>

        {/* Global JSON Export Dialog Panel */}
        {isExportVisible && (
          <div className="mt-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Estrutura JSON Consolidada
                </h3>
                <p className="text-xs text-slate-400">
                  Consolidado das especificações dos cards prontos para renderização.
                </p>
              </div>

              {/* JSON Format Selector Toggle */}
              <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800/80">
                <button
                  onClick={() => {
                    setJsonFormat('simplified');
                    handleGenerateJson('simplified');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    jsonFormat === 'simplified'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Simplificado (UI)
                </button>
                <button
                  onClick={() => {
                    setJsonFormat('engine');
                    handleGenerateJson('engine');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    jsonFormat === 'engine'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Engine (Go)
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-center bg-slate-950 px-4 py-2.5 rounded-t-xl border-t border-x border-slate-800 text-xs font-mono text-slate-500">
                <span>{projectName}_template.json</span>
                <div className="flex gap-3">
                  <button
                    onClick={downloadJsonFile}
                    className="text-slate-400 hover:text-indigo-400 font-bold transition-colors"
                  >
                    Salvar Arquivo
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </button>
                </div>
              </div>
              <pre className="bg-slate-950 border border-slate-800 p-4 rounded-b-xl overflow-x-auto text-xs font-mono text-emerald-400 max-h-80 select-all scrollbar">
                <code>{exportOutput}</code>
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
