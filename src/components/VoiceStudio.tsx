import React, { useState } from 'react';
import { Play, Loader2, Music, Download, Trash2, Mic } from 'lucide-react';

interface VoiceStudioProps {
  apiUrl: string;
  theme?: 'light' | 'dark';
}

interface GeneratedClip {
  id: string;
  text: string;
  voice: string;
  audioUrl: string;
  createdAt: string;
}

export const VoiceStudio: React.FC<VoiceStudioProps> = ({ apiUrl, theme = 'dark' }) => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('pt-BR-FranciscaNeural');
  const [isLoading, setIsLoading] = useState(false);
  const [clips, setClips] = useState<GeneratedClip[]>([]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      alert('Por favor, digite algum texto para sintetizar!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/tts-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice })
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const newClip: GeneratedClip = {
          id: 'clip_' + Math.random().toString(36).substring(2, 9),
          text: text.trim(),
          voice,
          audioUrl,
          createdAt: new Date().toLocaleTimeString()
        };
        setClips(prev => [newClip, ...prev]);
        setText('');
      } else {
        alert('Falha ao sintetizar áudio.');
      }
    } catch (err) {
      alert('Erro na conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
  };

  const getFriendlyVoiceName = (val: string) => {
    switch (val) {
      case 'pt-BR-FranciscaNeural': return 'Francisca (Feminino Online)';
      case 'pt-BR-AntonioNeural': return 'Antonio (Masculino Online)';
      case 'pt-BR-ThalitaMultilingualNeural': return 'Thalita (Multilíngue)';
      case 'pt_BR-faber-medium.onnx': return 'Faber (Voz Local Piper)';
      case 'en-US-GuyNeural': return 'Guy (Inglês Masculino)';
      case 'en-US-JennyNeural': return 'Jenny (Inglês Feminino)';
      case 'es-ES-AlvaroNeural': return 'Alvaro (Espanhol)';
      default: return val;
    }
  };

  // Theme helper classes:
  const isDark = theme === 'dark';
  const containerClass = isDark ? 'bg-[#1e2029] border border-transparent' : 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.02)] border border-transparent';
  const labelColor = isDark ? 'text-slate-400' : 'text-slate-600';
  const primaryText = isDark ? 'text-white' : 'text-slate-850';
  const subtextColor = isDark ? 'text-slate-500' : 'text-slate-450';
  const textareaBg = isDark ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-[#f0f2f5] border-transparent text-slate-800';
  const secondText = isDark ? 'text-slate-300' : 'text-slate-700';
  const selectBg = isDark ? 'bg-[#12131a] border-slate-850 text-slate-300' : 'bg-[#f0f2f5] border-transparent text-slate-800';
  const innerCardBg = isDark ? 'bg-slate-950/20 border-slate-850/60' : 'bg-slate-50 border-slate-100';
  const borderLine = isDark ? 'border-slate-800' : 'border-slate-100';
  const rowItemBg = isDark ? 'bg-slate-950 border-slate-850/80' : 'bg-slate-50 border-slate-100/80';
  const downloadBtn = isDark ? 'bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-750' : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-100';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full animate-fadeIn">
      {/* Input panel (Left) */}
      <div className={`lg:col-span-7 rounded-2xl p-6 shadow-xl flex flex-col gap-4 transition-all duration-200 ${containerClass}`}>
        <div className={`flex items-center gap-2 border-b pb-3 ${borderLine}`}>
          <Mic className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className={`text-md font-bold ${primaryText}`}>Criar Narração Personalizada</h3>
            <p className={`text-[10px] ${subtextColor}`}>Gere locuções realistas usando inteligência artificial</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>
            Roteiro / Texto
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`w-full border rounded-xl p-4 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[160px] resize-y leading-relaxed ${textareaBg}`}
            placeholder="Escreva aqui o que o narrador deve falar..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={`text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>
              Voz do Locutor (TTS)
            </label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className={`w-full border rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${selectBg}`}
            >
              <option value="pt-BR-FranciscaNeural">Francisca (Mulher - Edge-TTS Online)</option>
              <option value="pt-BR-AntonioNeural">Antonio (Homem - Edge-TTS Online)</option>
              <option value="pt-BR-ThalitaMultilingualNeural">Thalita (Multilíngue - Edge-TTS Online)</option>
              <option value="pt_BR-faber-medium.onnx">Faber (Voz Local - Piper Offline)</option>
              <option value="en-US-GuyNeural">Guy (Inglês Masculino - Edge-TTS Online)</option>
              <option value="en-US-JennyNeural">Jenny (Inglês Feminino - Edge-TTS Online)</option>
              <option value="es-ES-AlvaroNeural">Alvaro (Espanhol Masculino - Edge-TTS Online)</option>
              <option value="es-ES-ElviraNeural">Elvira (Espanhol Feminino - Edge-TTS Online)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !text.trim()}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-600 shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sintetizando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Gerar Áudio da Locução
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Audio List (Right) */}
      <div className={`lg:col-span-5 rounded-2xl p-6 shadow-xl flex flex-col gap-4 transition-all duration-200 ${containerClass}`}>
        <div>
          <h3 className={`text-md font-bold flex items-center gap-2 ${primaryText}`}>
            <Music className="w-5 h-5 text-indigo-400" />
            Minhas Amostras
          </h3>
          <p className={`text-[10px] ${subtextColor}`}>Histórico de locuções geradas nesta sessão</p>
        </div>

        {clips.length === 0 ? (
          <div className={`flex-1 flex flex-col items-center justify-center text-center py-20 rounded-xl border border-dashed ${innerCardBg}`}>
            <Music className="w-8 h-8 text-slate-500/60 mb-2" />
            <p className={`text-xs ${primaryText}`}>Nenhum áudio gerado ainda.</p>
            <p className={`text-[10px] ${subtextColor} mt-1`}>Escreva e clique em Gerar ao lado!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
            {clips.map(clip => (
              <div key={clip.id} className={`p-3.5 border rounded-xl flex flex-col gap-2 ${rowItemBg}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="text-[8px] bg-indigo-650/15 text-indigo-500 font-extrabold px-1.5 py-0.5 rounded mr-1.5 uppercase tracking-wider">
                      {getFriendlyVoiceName(clip.voice)}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">{clip.createdAt}</span>
                  </div>
                  <button
                    onClick={() => deleteClip(clip.id)}
                    className="p-1 rounded text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className={`text-[11px] italic font-medium truncate ${secondText}`}>
                  "{clip.text}"
                </p>

                <div className="flex items-center gap-3 mt-1.5">
                  <audio src={clip.audioUrl} controls className="flex-1 h-7 accent-indigo-500" />
                  <a
                    href={clip.audioUrl}
                    download={`tts_voice_${clip.id}.mp3`}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${downloadBtn}`}
                    title="Download MP3"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
