import { useState, useEffect } from 'react';
import type { Scene, VideoTemplate, RenderJob } from './types/video';
import { SceneCard } from './components/SceneCard';
import { RenderMonitor } from './components/RenderMonitor';
import { VoiceStudio } from './components/VoiceStudio';
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
  Loader2,
  Home,
  Mic,
  Activity,
  Sun,
  Moon,
  Power
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
  const [globalSubtitles, setGlobalSubtitles] = useState(true);
  const [jpegQuality, setJpegQuality] = useState(2);

  // App settings & connection
  const [apiUrl, setApiUrl] = useState(DEFAULT_SERVER_URL);
  const [isApiUrlEditing, setIsApiUrlEditing] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const [isPowerLoading, setIsPowerLoading] = useState(false);

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
  const [currentTab, setCurrentTab] = useState<'home' | 'video-studio' | 'voice-studio' | 'jobs'>('video-studio');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
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
  const checkConnection = async (urlToCheck: string, silent = false) => {
    try {
      // Try fetching templates api to verify server presence
      const res = await fetch(`${urlToCheck}/api/templates`, { mode: 'cors' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAvailableTemplates(data);
        }
        setServerConnected(prev => {
          if (!prev && !silent) {
            showNotification('success', 'Conectado ao videogen-server com sucesso!');
          }
          return true;
        });
      } else {
        setServerConnected(false);
      }
    } catch (e) {
      setServerConnected(false);
    }
  };

  useEffect(() => {
    checkConnection(apiUrl);
    const interval = setInterval(() => {
      checkConnection(apiUrl, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const handleServerPower = async (action: 'start' | 'stop') => {
    setIsPowerLoading(true);
    try {
      const response = await fetch('/__server_control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await response.json();
      if (data.success) {
        // Wait a bit and check connection
        await new Promise(resolve => setTimeout(resolve, 1500));
        await checkConnection(apiUrl);
        showNotification(
          action === 'start' ? 'success' : 'info',
          action === 'start' ? 'Servidor iniciado com sucesso!' : 'Servidor desligado com sucesso!'
        );
      } else {
        showNotification('error', `Erro ao ${action === 'start' ? 'iniciar' : 'desligar'} o servidor.`);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'Falha ao se comunicar com o controle do servidor.');
    } finally {
      setIsPowerLoading(false);
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
      setServerConnected(false);
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
        subtitles: globalSubtitles,
        cards: scenes.map((scene, i) => {
          // Construct visual elements based on slots
          const elements: any[] = [];
          
          const getSlotsForTemplate = (tmpl: string) => {
            if (tmpl === 'multiscreen') {
              const colW = Math.round(width / 3);
              return [
                { x: Math.round(colW * 0.5), y: Math.round(height * 0.5), w: colW, h: height },
                { x: Math.round(colW * 1.5), y: Math.round(height * 0.5), w: colW, h: height },
                { x: Math.round(colW * 2.5), y: Math.round(height * 0.5), w: colW, h: height }
              ];
            }
            return [
              { x: Math.round(width / 2), y: Math.round(height / 2), w: width, h: height }
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
    <div className={`min-h-screen flex flex-col md:flex-row font-sans antialiased selection:bg-indigo-600 selection:text-white w-full transition-colors duration-250 ${
      theme === 'dark' ? 'bg-[#06070b] text-slate-200' : 'bg-[#f8f9fa] text-slate-800'
    }`}>
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-[150] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border animate-fadeIn transition-all duration-300 ${
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

      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-full md:fixed md:top-0 md:left-0 md:h-screen md:w-64 border-b md:border-b-0 md:border-r flex flex-col py-6 px-4 shrink-0 gap-6 transition-all duration-250 z-30 ${
        theme === 'dark' ? 'bg-[#0b0c10] border-white/[0.04]' : 'bg-white border-slate-100 shadow-[2px_0_8px_rgba(0,0,0,0.01)]'
      }`}>
        {/* Brand & Theme Switcher */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-indigo-500" />
            <span className={`text-md font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500`}>
              Cromedia
            </span>
          </div>
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              theme === 'dark' 
                ? 'text-amber-400 hover:bg-slate-800' 
                : 'text-indigo-600 hover:bg-slate-100'
            }`}
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Create new button */}
        <div className="px-2">
          <button
            onClick={() => {
              setCurrentTab('video-studio');
              addScene();
            }}
            className="w-full py-2.5 px-4 rounded-full text-[11px] font-extrabold text-white bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 shadow-md hover:shadow-cyan-500/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create new
          </button>
        </div>

        {/* Tab Links */}
        <nav className="flex flex-row md:flex-col gap-1.5 flex-1 overflow-x-auto md:overflow-x-visible">
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'home' 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/15' 
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] hover:translate-x-0.5'
                  : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100 hover:translate-x-0.5'
            }`}
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          
          <button
            onClick={() => setCurrentTab('video-studio')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'video-studio' 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/15' 
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] hover:translate-x-0.5'
                  : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100 hover:translate-x-0.5'
            }`}
          >
            <Film className="w-4 h-4" />
            Video Studio
          </button>

          <button
            onClick={() => setCurrentTab('voice-studio')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'voice-studio' 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/15' 
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] hover:translate-x-0.5'
                  : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100 hover:translate-x-0.5'
            }`}
          >
            <Mic className="w-4 h-4" />
            Voice Studio
          </button>

          <button
            onClick={() => setCurrentTab('jobs')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'jobs' 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/15' 
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] hover:translate-x-0.5'
                  : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100 hover:translate-x-0.5'
            }`}
          >
            <Activity className="w-4 h-4" />
            Fila de Render
          </button>
        </nav>

        {/* Connection Widget at the bottom */}
        <div className={`hidden md:flex flex-col gap-2 p-3 rounded-xl border transition-all ${
          theme === 'dark' ? 'bg-[#12131a] border-slate-850' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Servidor</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
              serverConnected ? 'bg-emerald-500/10 text-emerald-400 animate-pulse' : 'bg-amber-500/10 text-amber-400'
            }`}>
              {serverConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 truncate">
            {serverConnected ? (
              <Wifi className="w-3 h-3 text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="w-3 h-3 text-amber-500 shrink-0" />
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
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono focus:outline-none w-full border ${
                  theme === 'dark' ? 'bg-slate-900 text-slate-300 border-indigo-500/30' : 'bg-white text-slate-750 border-indigo-300/30'
                }`}
                autoFocus
              />
            ) : (
              <span
                onClick={() => setIsApiUrlEditing(true)}
                className={`text-[10px] font-mono cursor-pointer truncate ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                title="Clique para editar"
              >
                {apiUrl}
              </span>
            )}
          </div>

          {/* Controls to turn server on/off */}
          <div className={`mt-1.5 pt-1.5 border-t flex gap-1.5 ${theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-200/40'}`}>
            <button
              type="button"
              onClick={() => handleServerPower(serverConnected ? 'stop' : 'start')}
              disabled={isPowerLoading}
              className={`w-full py-1 px-2 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50 ${
                serverConnected
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
              }`}
            >
              {isPowerLoading ? (
                <>
                  <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0" />
                  <span>Aguarde...</span>
                </>
              ) : serverConnected ? (
                <>
                  <Power className="w-2.5 h-2.5 shrink-0" />
                  <span>Desligar</span>
                </>
              ) : (
                <>
                  <Power className="w-2.5 h-2.5 shrink-0" />
                  <span>Ligar Servidor</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col p-6 sm:p-8 w-full max-w-6xl overflow-y-auto min-w-0 md:ml-64 md:h-screen">
        {/* Render pages depending on currentTab */}
        
        {/* PAGE 1: HOME/DASHBOARD */}
        {currentTab === 'home' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Page Header */}
            <div className={`border-b pb-4 ${theme === 'dark' ? 'border-slate-850' : 'border-slate-100'}`}>
              <h2 className={`text-2xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Dashboard do Projeto
              </h2>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Estatísticas, configurações globais e acesso rápido ao workspace.
              </p>
            </div>

            {/* CapCut Feature Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Text to Speech Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-800 p-6 flex flex-col justify-between min-h-[160px] shadow-md border border-transparent">
                <div className="max-w-[65%] flex flex-col gap-2">
                  <h3 className="text-md font-bold text-white uppercase tracking-wider">Text to speech</h3>
                  <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                    Convert text to speech in various languages with premium voices.
                  </p>
                </div>
                <div className="mt-4 z-10">
                  <button 
                    onClick={() => setCurrentTab('voice-studio')}
                    className="px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-950 font-extrabold text-[10px] rounded-full transition-all shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    Try now &rarr;
                  </button>
                </div>
                <div className="absolute right-4 bottom-2 top-2 w-1/3 flex items-center justify-center opacity-15">
                  <Mic className="w-20 h-20 text-white" />
                </div>
              </div>

              {/* Video Studio Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-800 to-teal-900 p-6 flex flex-col justify-between min-h-[160px] shadow-md border border-transparent">
                <div className="max-w-[65%] flex flex-col gap-2">
                  <h3 className="text-md font-bold text-white uppercase tracking-wider">Video Studio</h3>
                  <p className="text-xs text-teal-150 leading-relaxed font-medium">
                    Compile scenes and timeline tracks dynamically with Go engine.
                  </p>
                </div>
                <div className="mt-4 z-10">
                  <button 
                    onClick={() => setCurrentTab('video-studio')}
                    className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-950 font-extrabold text-[10px] rounded-full transition-all shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    Try now &rarr;
                  </button>
                </div>
                <div className="absolute right-4 bottom-2 top-2 w-1/3 flex items-center justify-center opacity-15">
                  <Film className="w-20 h-20 text-white" />
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div className={`p-5 rounded-2xl flex flex-col gap-1 transition-all ${
                theme === 'dark' ? 'bg-[#1e2029]' : 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)]'
              }`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cenas Criadas</span>
                <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{scenes.length}</span>
              </div>
              <div className={`p-5 rounded-2xl flex flex-col gap-1 transition-all ${
                theme === 'dark' ? 'bg-[#1e2029]' : 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)]'
              }`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duração Estimada</span>
                <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {(scenes.reduce((acc, s) => acc + s.takeDuration, 0)).toFixed(1)}s
                </span>
              </div>
              <div className={`p-5 rounded-2xl flex flex-col gap-1 transition-all ${
                theme === 'dark' ? 'bg-[#1e2029]' : 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)]'
              }`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resolução do Vídeo</span>
                <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{globalResolution}</span>
              </div>
              <div className={`p-5 rounded-2xl flex flex-col gap-1 transition-all ${
                theme === 'dark' ? 'bg-[#1e2029]' : 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)]'
              }`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">FPS de Render</span>
                <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{globalFps} frames/s</span>
              </div>
            </div>

            {/* Config & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-2xl flex flex-col gap-4 transition-all ${
                theme === 'dark' ? 'bg-[#1e2029]' : 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)]'
              }`}>
                <h3 className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b pb-2.5 ${
                  theme === 'dark' ? 'text-white border-slate-800' : 'text-slate-900 border-slate-100'
                }`}>
                  <Settings className="w-4 h-4 text-indigo-500" />
                  Identificação do Vídeo
                </h3>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Nome do Projeto / Identificador
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                      theme === 'dark' ? 'bg-[#12131a] border-transparent text-slate-205' : 'bg-[#f0f2f5] border-transparent text-slate-800'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button
                    onClick={() => setCurrentTab('video-studio')}
                    className="py-2.5 px-4 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer text-center"
                  >
                    Abrir Estúdio de Vídeo
                  </button>
                  <button
                    onClick={() => setCurrentTab('voice-studio')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border active:scale-95 cursor-pointer text-center ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-200' 
                        : 'bg-[#f0f2f5] border-transparent hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    Testar Vozes TTS
                  </button>
                </div>
              </div>

              {/* Status Connection Widget */}
              <div className={`p-6 rounded-2xl flex flex-col gap-4 transition-all ${
                theme === 'dark' ? 'bg-[#1e2029]' : 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)]'
              }`}>
                <h3 className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b pb-2.5 ${
                  theme === 'dark' ? 'text-white border-slate-800' : 'text-slate-900 border-slate-100'
                }`}>
                  <Wifi className="w-4 h-4 text-indigo-500" />
                  Status da API do Motor
                </h3>
                
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${serverConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-205' : 'text-slate-800'}`}>
                      {serverConnected ? 'Conectado ao Servidor Go' : 'Sem Conexão'}
                    </span>
                    <span className="text-[10px] text-slate-500">{apiUrl}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Editar URL de Conexão
                  </label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    onBlur={() => checkConnection(apiUrl)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                      theme === 'dark' ? 'bg-[#12131a] border-transparent text-slate-205' : 'bg-[#f0f2f5] border-transparent text-slate-800'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: VIDEO STUDIO WORKSPACE */}
        {currentTab === 'video-studio' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Header com botões de Configurações e exportador */}
            <div className={`flex items-center justify-between border-b pb-4 ${theme === 'dark' ? 'border-slate-850' : 'border-slate-100'}`}>
              <div>
                <h1 className={`text-xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  AI Video Builder Studio
                </h1>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-550'}`}>
                  Organize seus takes, ajuste mídias e configure narrações.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  id="btn-open-settings"
                  onClick={() => setIsSidebarOpen(true)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 border border-transparent ${
                    theme === 'dark' 
                      ? 'text-slate-250 bg-slate-900 hover:bg-slate-850' 
                      : 'text-slate-700 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-500" />
                  Configurações
                </button>
              </div>
            </div>

            {/* Stepper Header Progress */}
            <div className={`rounded-2xl p-4 flex flex-col gap-2 ${
              theme === 'dark' ? 'bg-[#0b0c10]/40 border border-white/[0.04]' : 'bg-slate-50 border border-slate-200/40'
            }`}>
              <div className="flex items-center justify-center py-2 relative">
                <div className="flex items-center gap-4 w-full max-w-md justify-between relative z-10">
                  {/* Horizontal progress bar background */}
                  <div className={`absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 -z-10 ${
                    theme === 'dark' ? 'bg-slate-800/80' : 'bg-slate-200'
                  }`}>
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                      style={{ width: wizardStep === 1 ? '0%' : wizardStep === 2 ? '50%' : '100%' }}
                    />
                  </div>

                  {/* Step 1 indicator */}
                  <button
                    id="step-tab-config"
                    onClick={() => setWizardStep(1)}
                    className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                      wizardStep >= 1
                        ? 'bg-indigo-650 border-indigo-550 text-white shadow-md shadow-indigo-500/20'
                        : theme === 'dark' ? 'bg-[#0f1015] border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      1
                    </div>
                    <span className={`text-[9px] font-bold tracking-wider uppercase ${
                      wizardStep === 1 ? 'text-indigo-400' : 'text-slate-500'
                    }`}>Configurações</span>
                  </button>

                  {/* Step 2 indicator */}
                  <button
                    id="step-tab-cards"
                    onClick={() => setWizardStep(2)}
                    className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                      wizardStep >= 2
                        ? 'bg-indigo-650 border-indigo-550 text-white shadow-md shadow-indigo-500/20'
                        : theme === 'dark' ? 'bg-[#0f1015] border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      2
                    </div>
                    <span className={`text-[9px] font-bold tracking-wider uppercase ${
                      wizardStep === 2 ? 'text-indigo-400' : 'text-slate-500'
                    }`}>Cards & Timeline</span>
                  </button>

                  {/* Step 3 indicator */}
                  <button
                    id="step-tab-render"
                    onClick={() => setWizardStep(3)}
                    className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                      wizardStep >= 3
                        ? 'bg-indigo-655 border-indigo-555 text-white shadow-md shadow-indigo-500/20'
                        : theme === 'dark' ? 'bg-[#0f1015] border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      3
                    </div>
                    <span className={`text-[9px] font-bold tracking-wider uppercase ${
                      wizardStep === 3 ? 'text-indigo-400' : 'text-slate-500'
                    }`}>Renderizar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 1: CONFIGURAÇÕES */}
            {wizardStep === 1 && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className={`rounded-2xl p-6 shadow-xl flex flex-col gap-5 border border-transparent ${
                  theme === 'dark' ? 'bg-[#161720] text-slate-200' : 'bg-white'
                }`}>
                  <div className={`border-b pb-3 flex items-center gap-2 ${theme === 'dark' ? 'border-white/[0.05]' : 'border-slate-100'}`}>
                    <Settings className="w-5 h-5 text-indigo-400" />
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      Parâmetros e Configurações do Vídeo
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Project Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                        Identificador do Template
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                          theme === 'dark' ? 'bg-[#0c0d12] border-white/[0.05] text-slate-200 focus:bg-transparent' : 'bg-[#f8f9fa] border-slate-200/60 text-slate-800 focus:bg-white'
                        }`}
                        placeholder="Ex: meu_video_projeto..."
                      />
                    </div>

                    {/* Proporção e Resolução */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">
                        Proporção e Resolução
                      </label>
                      <select
                        value={globalResolution}
                        onChange={(e) => setGlobalResolution(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all ${
                          theme === 'dark' ? 'bg-[#0c0d12] border-white/[0.05] text-slate-350' : 'bg-[#f8f9fa] border-slate-200/60 text-slate-800'
                        }`}
                      >
                        <option value="1080x1920">Vertical (1080x1920) • Reels / Shorts</option>
                        <option value="1920x1080">Horizontal (1920x1080) • YouTube / Full HD</option>
                        <option value="2160x3840">Vertical 4K (2160x3840)</option>
                        <option value="3840x2160">Horizontal 4K (3840x2160)</option>
                      </select>
                    </div>

                    {/* Taxa de FPS */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">
                        Taxa de FPS (Quadros por segundo)
                      </label>
                      <select
                        value={globalFps}
                        onChange={(e) => setGlobalFps(parseInt(e.target.value))}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all ${
                          theme === 'dark' ? 'bg-[#0c0d12] border-white/[0.05] text-slate-350' : 'bg-[#f8f9fa] border-slate-200/60 text-slate-800'
                        }`}
                      >
                        <option value="24">24 fps (Cinema)</option>
                        <option value="30">30 fps (Padrão)</option>
                        <option value="60">60 fps (Fluído)</option>
                      </select>
                    </div>

                    {/* Qualidade JPEG */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">
                        Qualidade de Exportação JPEG (1-31)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={jpegQuality}
                        onChange={(e) => setJpegQuality(Math.min(31, Math.max(1, parseInt(e.target.value) || 2)))}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition-all ${
                          theme === 'dark' ? 'bg-[#0c0d12] border-white/[0.05] text-slate-205' : 'bg-[#f8f9fa] border-slate-200/60 text-slate-800'
                        }`}
                      />
                    </div>

                    {/* Background audio */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">
                        Trilha Sonora de Fundo (BGM)
                      </label>
                      <input
                        type="text"
                        value={globalBgmUrl}
                        onChange={(e) => setGlobalBgmUrl(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition-all ${
                          theme === 'dark' ? 'bg-[#0c0d12] border-white/[0.05] text-slate-205' : 'bg-[#f8f9fa] border-slate-200/60 text-slate-800'
                        }`}
                        placeholder="Ex: tmp/uploads/bg_music.mp3 ou URL de áudio"
                      />
                    </div>
                  </div>

                  {/* Checkboxes parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <label className={`flex items-center gap-3 cursor-pointer select-none border rounded-xl px-4 py-3 transition-colors ${
                      theme === 'dark' ? 'bg-[#0c0d12] border-white/[0.05] hover:bg-white/[0.02]' : 'bg-[#f8f9fa] border-slate-200/40 hover:bg-slate-100'
                    }`}>
                      <input
                        type="checkbox"
                        checked={hwAccel}
                        onChange={(e) => setHwAccel(e.target.checked)}
                        className="w-4 h-4 accent-indigo-650 rounded cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-850'}`}>Aceleração por GPU</span>
                        <span className="text-[9px] text-slate-500">Acelera o processamento com hardware NVENC</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 cursor-pointer select-none border rounded-xl px-4 py-3 transition-colors ${
                      theme === 'dark' ? 'bg-[#0c0d12] border-white/[0.05] hover:bg-white/[0.02]' : 'bg-[#f8f9fa] border-slate-200/40 hover:bg-slate-100'
                    }`}>
                      <input
                        type="checkbox"
                        checked={globalSubtitles}
                        onChange={(e) => setGlobalSubtitles(e.target.checked)}
                        className="w-4 h-4 accent-indigo-650 rounded cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-850'}`}>Habilitar Legendas Globais</span>
                        <span className="text-[9px] text-slate-500">Desenha legendas sincronizadas nas cenas finais</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Footer Navigation */}
                <div className="flex justify-end pt-2">
                  <button
                    id="btn-next-to-cards"
                    onClick={() => setWizardStep(2)}
                    className="py-3 px-6 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    Avançar para Cards &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CARDS & TIMELINE */}
            {wizardStep === 2 && (
              <>

            {/* Active Card */}
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
                subtitlesEnabled={globalSubtitles}
                theme={theme}
              />
            ) : (
              <div className={`text-center py-20 rounded-2xl flex flex-col items-center gap-2 shadow-inner border border-transparent ${
                theme === 'dark' ? 'bg-[#1e2029] text-slate-500' : 'bg-white text-slate-400'
              }`}>
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

            {/* Timeline */}
            {scenes.length > 0 && (
              <div className={`rounded-2xl p-5 flex flex-col gap-4 border border-transparent shadow-xl transition-all ${
                theme === 'dark' ? 'bg-[#1e2029]' : 'bg-white'
              }`}>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Storyboard Timeline ({scenes.length} cena(s))
                  </span>
                  <button 
                    onClick={addScene}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-600 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm shadow-indigo-650/15"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova Cena
                  </button>
                </div>
                
                <div className="flex overflow-x-auto py-4 pl-4 pr-10 -space-x-5 hover:space-x-1.5 transition-all duration-300 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent font-sans">
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
                        className={`flex-shrink-0 w-44 rounded-xl p-2.5 cursor-pointer transition-all flex flex-col gap-2 relative select-none hover:z-30 hover:-translate-y-2 hover:scale-105 shadow-xl ${
                          isActive 
                            ? 'ring-2 ring-indigo-655 shadow-indigo-950/80 scale-102 z-20 translate-y-[-2px]' 
                            : theme === 'dark'
                              ? 'bg-slate-950 hover:ring-1 hover:ring-slate-700'
                              : 'bg-[#f0f2f5] hover:ring-1 hover:ring-slate-300'
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
                          <span className="absolute top-1 left-1 bg-slate-955/95 text-slate-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                            #{String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="absolute bottom-1 right-1 bg-slate-955/95 text-slate-300 text-[8px] font-mono px-1 py-0.5 rounded">
                            {scene.takeDuration.toFixed(1)}s
                          </span>
                        </div>
                        
                        {/* Scene text/info */}
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 truncate">
                            {scene.template === '10_best' ? 'Listicle' : scene.template === 'breaking_news' ? 'Notícias' : 'Personalizado'}
                          </span>
                          <p className={`text-[10px] font-medium truncate h-3.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            {scene.narration || <span className="text-slate-500 italic">Sem narração</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Footer Navigation for Step 2 */}
            <div className="flex justify-between pt-2">
              <button
                id="btn-back-to-config"
                onClick={() => setWizardStep(1)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border active:scale-95 cursor-pointer text-center ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-205' 
                    : 'bg-[#f0f2f5] border-transparent hover:bg-slate-200 text-slate-800'
                }`}
              >
                &larr; Voltar para Configurações
              </button>
              <button
                id="btn-next-to-render"
                onClick={() => setWizardStep(3)}
                className="py-3 px-6 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
              >
                Avançar para Renderizar &rarr;
              </button>
            </div>
          </>
        )}

        {/* STEP 3: RENDERIZAR */}
        {wizardStep === 3 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className={`rounded-2xl p-6 shadow-xl flex flex-col gap-5 border border-transparent ${
              theme === 'dark' ? 'bg-[#161720] text-slate-200' : 'bg-white'
            }`}>
              <div className={`border-b pb-3 flex items-center gap-2 ${theme === 'dark' ? 'border-white/[0.05]' : 'border-slate-100'}`}>
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Revisão & Renderização Final
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Summary statistics info */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Resumo do Projeto
                  </h4>
                  <div className={`rounded-xl p-4 flex flex-col gap-3 text-xs border ${
                    theme === 'dark' ? 'bg-[#0c0d12] border-white/[0.05]' : 'bg-[#f8f9fa] border-slate-200/40'
                  }`}>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Nome do Projeto:</span>
                      <span className="font-mono font-semibold">{projectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Resolução final:</span>
                      <span className="font-semibold">{globalResolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Taxa de Quadros (FPS):</span>
                      <span className="font-semibold">{globalFps} fps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Total de Cenas:</span>
                      <span className="font-semibold">{scenes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Duração Estimada:</span>
                      <span className="font-mono font-semibold">
                        {(scenes.reduce((acc, s) => acc + s.takeDuration, 0)).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions and visual preview triggers */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Ações de Compilação
                  </h4>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={triggerPreview}
                      disabled={!serverConnected || isPreviewLoading}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 ${
                        theme === 'dark' 
                          ? 'bg-[#0c0d12] border-white/[0.05] text-indigo-400 hover:bg-[#12131a]' 
                          : 'bg-white border-slate-200 text-indigo-650 hover:bg-slate-50'
                      }`}
                    >
                      {isPreviewLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Gerando Preview...
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" />
                          Visualizar Primeiro Frame
                        </>
                      )}
                    </button>

                    <button
                      id="btn-trigger-render-wizard"
                      type="button"
                      onClick={() => {
                        triggerRender();
                        // Switch to Render Jobs tab automatically!
                        setCurrentTab('jobs');
                      }}
                      disabled={!serverConnected || scenes.length === 0}
                      className="w-full py-4 px-4 rounded-xl text-xs font-extrabold text-white bg-indigo-650 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer animate-pulse"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      RENDERIZAR VÍDEO COMPLETO
                    </button>
                  </div>
                </div>
              </div>

              {/* Frame Preview container */}
              {previewImage && (
                <div className={`mt-2 p-3.5 rounded-2xl relative group border ${
                  theme === 'dark' ? 'bg-[#0c0d12] border-white/[0.05]' : 'bg-[#f8f9fa] border-slate-200/60'
                }`}>
                  <span className="absolute top-5 left-5 bg-slate-950/90 text-indigo-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/20">
                    PRÉVIA DO FRAME 1
                  </span>
                  <img
                    src={previewImage}
                    alt="Frame preview"
                    className="w-full max-w-lg mx-auto h-auto rounded-xl border border-slate-950 shadow-2xl"
                  />
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-5 right-5 bg-slate-950/90 text-slate-400 hover:text-white p-1 rounded-md text-[8px] cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex justify-between pt-2">
              <button
                id="btn-back-to-cards"
                onClick={() => setWizardStep(2)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border active:scale-95 cursor-pointer text-center ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-205' 
                    : 'bg-[#f0f2f5] border-transparent hover:bg-slate-200 text-slate-800'
                }`}
              >
                &larr; Voltar para Cards
              </button>
            </div>
          </div>
        )}
      </div>
    )}

        {/* PAGE 3: VOICE STUDIO */}
        {currentTab === 'voice-studio' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className={`border-b pb-4 ${theme === 'dark' ? 'border-slate-850' : 'border-slate-100'}`}>
              <h2 className={`text-xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Estúdio de Voz (TTS)
              </h2>
              <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-550'}`}>
                Sintetize, salve e teste vozes narradoras separadamente.
              </p>
            </div>
            <VoiceStudio apiUrl={apiUrl} theme={theme} />
          </div>
        )}

        {/* PAGE 4: JOBS MONITOR */}
        {currentTab === 'jobs' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className={`border-b pb-4 ${theme === 'dark' ? 'border-slate-850' : 'border-slate-100'}`}>
              <h2 className={`text-xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Trabalhos & Fila de Render
              </h2>
              <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-550'}`}>
                Monitore os status de compilação dos seus vídeos.
              </p>
            </div>
            <RenderMonitor
              jobs={jobs}
              onRefresh={fetchJobs}
              onDeleteJob={deleteJob}
              apiUrl={apiUrl}
              isRefreshing={isRefreshingJobs}
              theme={theme}
            />
          </div>
        )}

        {/* GLOBAL JSON EXPORTER (Se visível, renderiza logo abaixo na página) */}
        {isExportVisible && (
          <div className={`mt-4 p-6 rounded-2xl flex flex-col gap-4 shadow-2xl animate-fadeIn border border-transparent ${
            theme === 'dark' ? 'bg-[#1e2029]' : 'bg-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
              <div>
                <h3 className={`text-md font-bold flex items-center gap-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Estrutura JSON Consolidada
                </h3>
                <p className="text-xs text-slate-450">
                  Estrutura enviada em lote para o motor Go.
                </p>
              </div>

              {/* JSON Format Selector Toggle */}
              <div className={`flex items-center rounded-xl p-1 border ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  onClick={() => {
                    setJsonFormat('simplified');
                    handleGenerateJson('simplified');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    jsonFormat === 'simplified'
                      ? 'bg-indigo-650 text-white shadow-md'
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
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    jsonFormat === 'engine'
                      ? 'bg-indigo-650 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Engine (Go)
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <div className={`flex justify-between items-center px-4 py-2.5 rounded-t-xl text-[10px] font-mono border ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-[#f0f2f5] border-slate-200 text-slate-500'
              }`}>
                <span>{projectName}_template.json</span>
                <div className="flex gap-3">
                  <button
                    onClick={downloadJsonFile}
                    className="text-slate-400 hover:text-indigo-400 font-bold transition-colors cursor-pointer"
                  >
                    Salvar Arquivo
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </button>
                </div>
              </div>
              <pre className={`p-4 rounded-b-xl overflow-x-auto text-[11px] font-mono max-h-80 select-all scrollbar border ${
                theme === 'dark' ? 'bg-slate-955 border-slate-800 text-emerald-450' : 'bg-[#f7f8fa] border-slate-200 text-emerald-700'
              }`}>
                <code>{exportOutput}</code>
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* Global Configuration settings drawer sliding overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        />
      )}

      {/* Sliding Drawer Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-l ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } ${theme === 'dark' ? 'bg-[#181920] border-slate-800' : 'bg-white border-slate-100'}`}
      >
        {/* Drawer Header */}
        <div className={`flex items-center justify-between p-5 border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-955/50' : 'border-slate-100 bg-[#f7f8fa]/50'}`}>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className={`text-sm font-extrabold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Ajustes & Produção
            </h2>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className={`p-1 rounded-lg transition-colors text-[10px] font-bold font-mono border px-2 cursor-pointer ${
              theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
            }`}
          >
            Fechar [X]
          </button>
        </div>

        {/* Drawer Body (Scrollable container) */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 scrollbar-thin scrollbar-track-transparent">
          {/* Project Global Configuration */}
          <div className={`rounded-2xl p-5 shadow-xl flex flex-col gap-4 border border-transparent ${
            theme === 'dark' ? 'bg-[#1e2029]' : 'bg-[#f7f8fa]'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider border-b pb-2.5 flex items-center gap-1.5 ${
              theme === 'dark' ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'
            }`}>
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
                className={`w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                  theme === 'dark' ? 'bg-[#12131a] border-transparent text-slate-300' : 'bg-white border-transparent text-slate-800'
                }`}
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
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all ${
                  theme === 'dark' ? 'bg-[#12131a] border-transparent text-slate-300' : 'bg-white border-transparent text-slate-800'
                }`}
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
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all ${
                    theme === 'dark' ? 'bg-[#12131a] border-transparent text-slate-300' : 'bg-white border-transparent text-slate-800'
                  }`}
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
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-550 text-center font-mono transition-all ${
                    theme === 'dark' ? 'bg-[#12131a] border-transparent text-slate-300' : 'bg-white border-transparent text-slate-800'
                  }`}
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
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition-all ${
                  theme === 'dark' ? 'bg-[#12131a] border-transparent text-slate-300' : 'bg-white border-transparent text-slate-800'
                }`}
                placeholder="ex: tmp/uploads/bg_music.mp3"
              />
            </div>

            {/* Hardware Acceleration Checkbox */}
            <label className={`flex items-center gap-2 mt-1 cursor-pointer select-none border border-transparent px-3 py-2.5 rounded-xl transition-colors ${
              theme === 'dark' ? 'bg-[#12131a] hover:bg-slate-850' : 'bg-white hover:bg-slate-100'
            }`}>
              <input
                type="checkbox"
                checked={hwAccel}
                onChange={(e) => setHwAccel(e.target.checked)}
                className="w-4 h-4 accent-indigo-650 rounded cursor-pointer"
              />
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Aceleração por GPU</span>
                <span className="text-[9px] text-slate-500">Usa NVENC (fallback automático p/ CPU)</span>
              </div>
            </label>

            {/* Habilitar Legendas do Vídeo */}
            <label className={`flex items-center gap-2 mt-1 cursor-pointer select-none border border-transparent px-3 py-2.5 rounded-xl transition-colors ${
              theme === 'dark' ? 'bg-[#12131a] hover:bg-slate-850' : 'bg-white hover:bg-slate-100'
            }`}>
              <input
                type="checkbox"
                checked={globalSubtitles}
                onChange={(e) => setGlobalSubtitles(e.target.checked)}
                className="w-4 h-4 accent-indigo-650 rounded cursor-pointer"
              />
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Habilitar Legendas</span>
                <span className="text-[9px] text-slate-500">Desenha legendas sincronizadas no rodapé</span>
              </div>
            </label>
          </div>

          {/* Backend Actions & Production Triggers */}
          <div className={`rounded-2xl p-5 shadow-xl flex flex-col gap-4 border border-transparent ${
            theme === 'dark' ? 'bg-[#1e2029]' : 'bg-[#f7f8fa]'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider border-b pb-2.5 flex items-center gap-1.5 ${
              theme === 'dark' ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'
            }`}>
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Ações de Produção
            </h3>

            <div className="flex flex-col gap-3">
              {/* Visual Preview Trigger */}
              <button
                type="button"
                onClick={triggerPreview}
                disabled={!serverConnected || isPreviewLoading}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-855' 
                    : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'
                }`}
              >
                {isPreviewLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Gerando Preview...
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    Visualizar Primeiro Frame
                  </>
                )}
              </button>

              {/* Render Trigger */}
              <button
                id="btn-trigger-render-sidebar"
                type="button"
                onClick={triggerRender}
                disabled={!serverConnected || scenes.length === 0}
                className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-indigo-605 hover:bg-indigo-550 shadow-lg shadow-indigo-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Renderizar Vídeo Completo
              </button>

              {/* Local JSON compiler */}
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false); // Close drawer to show JSON export panel
                  handleGenerateJson();
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Gerar Estrutura JSON
              </button>
            </div>

            {/* Visual Preview Modal/Viewer */}
            {previewImage && (
              <div className={`mt-2 p-2 rounded-xl relative group border ${
                theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              }`}>
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
                  className="absolute top-3 right-3 bg-slate-955/90 text-slate-400 hover:text-white p-1 rounded-md text-[8px] cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Fila de Jobs Monitor */}
            {serverConnected && (
              <RenderMonitor
                jobs={jobs}
                onRefresh={fetchJobs}
                onDeleteJob={deleteJob}
                apiUrl={apiUrl}
                isRefreshing={isRefreshingJobs}
                theme={theme}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
