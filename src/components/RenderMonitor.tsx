import React, { useState } from 'react';
import type { RenderJob } from '../types/video';
import { 
  Download, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Clock,
  Eye
} from 'lucide-react';

interface RenderMonitorProps {
  jobs: Record<string, RenderJob>;
  onRefresh: () => void;
  onDeleteJob: (id: string) => void;
  apiUrl: string;
  isRefreshing: boolean;
  theme?: 'light' | 'dark';
}

export const RenderMonitor: React.FC<RenderMonitorProps> = ({
  jobs,
  onRefresh,
  onDeleteJob,
  apiUrl,
  isRefreshing,
  theme = 'dark',
}) => {
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const getJobStatusBadge = (status: RenderJob['status']) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" />
            CONCLUÍDO
          </span>
        );
      case 'processing':
      case 'rendering':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            PROCESSANDO
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
            <Clock className="w-3 h-3" />
            NA FILA
          </span>
        );
      case 'error':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">
            <AlertCircle className="w-3 h-3" />
            ERRO
          </span>
        );
    }
  };

  const getDownloadUrl = (filePath?: string) => {
    if (!filePath) return '#';
    const cleanPath = filePath.replace(/^outputs\//, '');
    return `${apiUrl}/outputs/${cleanPath}`;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    return `(${(ms / 1000).toFixed(1)}s)`;
  };

  const sortedJobs = Object.values(jobs).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  // Theme helper classes:
  const isDark = theme === 'dark';
  const containerClass = isDark ? 'bg-[#1e2029] border border-transparent' : 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.02)] border border-transparent';
  const primaryText = isDark ? 'text-white' : 'text-slate-850';
  const secondText = isDark ? 'text-slate-305' : 'text-slate-705';
  const subtextColor = isDark ? 'text-slate-500' : 'text-slate-455';
  const itemBg = isDark ? 'bg-slate-950 border border-transparent' : 'bg-[#f0f2f5] border border-transparent';
  const iconButtonBg = isDark ? 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900' : 'bg-[#f0f2f5] text-slate-550 hover:text-slate-900 hover:bg-slate-200/60';
  const placeholderBg = isDark ? 'bg-slate-950/40 text-slate-600' : 'bg-[#f0f2f5]/50 text-slate-500';
  const borderLine = isDark ? 'border-slate-850' : 'border-slate-100';

  return (
    <div className={`flex flex-col gap-4 rounded-2xl p-5 shadow-xl transition-all duration-200 ${containerClass}`}>
      <div className={`flex items-center justify-between pb-3 border-b ${borderLine}`}>
        <div>
          <h3 className={`text-sm font-bold uppercase tracking-wider ${primaryText}`}>
            Fila de Renderização
          </h3>
          <p className={`text-[10px] ${subtextColor}`}>Jobs disparados no backend</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`p-1.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer ${iconButtonBg}`}
          title="Atualizar status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {sortedJobs.length === 0 ? (
        <div className={`text-center py-6 text-xs rounded-xl ${placeholderBg}`}>
          Nenhum job de renderização iniciado.
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
          {sortedJobs.map((job) => (
            <div
              key={job.id}
              className={`job-item flex flex-col gap-2 p-3 rounded-xl transition-all ${itemBg}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="truncate">
                  <h4 className={`text-xs font-mono font-bold truncate ${secondText}`}>
                    {job.template_id}
                  </h4>
                  <span className="text-[9px] text-slate-500 font-mono block">
                    ID: {job.id.substring(4, 15)}...
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {getJobStatusBadge(job.status)}
                  <button
                    type="button"
                    onClick={() => onDeleteJob(job.id)}
                    className="p-1 rounded text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Excluir do histórico"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {job.error && (
                <p className="text-[10px] text-red-400 bg-red-950/10 rounded p-1.5 font-mono">
                  {job.error}
                </p>
              )}

              {job.status === 'done' && job.file_path && (
                <div className={`flex items-center justify-between gap-4 mt-1 pt-2 border-t ${borderLine}`}>
                  <span className="text-[9px] font-mono text-slate-500">
                    Render {formatDuration(job.render_duration_ms)}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setPreviewVideoUrl(getDownloadUrl(job.file_path))}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded cursor-pointer border border-indigo-500/10 hover:border-indigo-550/30"
                    >
                      <Eye className="w-3 h-3" />
                      PREVIEW
                    </button>
                    <a
                      href={getDownloadUrl(job.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/10"
                    >
                      <Download className="w-3 h-3" />
                      BAIXAR MP4
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Video Preview Popup Modal */}
      {previewVideoUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={() => setPreviewVideoUrl(null)}
        >
          <div 
            className={`relative w-full max-w-2xl border rounded-2xl overflow-hidden shadow-2xl flex flex-col ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'bg-slate-900 border-slate-850' : 'bg-[#f7f8fa] border-slate-100'}`}>
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${primaryText}`}>
                <Eye className="w-4 h-4 text-indigo-400" />
                Player de Prévia
              </span>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className={`text-[10px] font-mono font-bold border px-2 py-0.5 rounded cursor-pointer ${isDark ? 'text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white' : 'text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                Fechar [X]
              </button>
            </div>
            {/* Modal Body */}
            <div className="bg-black flex items-center justify-center p-2 max-h-[70vh]">
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-inner"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
