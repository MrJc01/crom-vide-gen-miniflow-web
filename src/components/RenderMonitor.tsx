import React from 'react';
import type { RenderJob } from '../types/video';
import { 
  Download, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Clock 
} from 'lucide-react';

interface RenderMonitorProps {
  jobs: Record<string, RenderJob>;
  onRefresh: () => void;
  onDeleteJob: (id: string) => void;
  apiUrl: string;
  isRefreshing: boolean;
}

export const RenderMonitor: React.FC<RenderMonitorProps> = ({
  jobs,
  onRefresh,
  onDeleteJob,
  apiUrl,
  isRefreshing,
}) => {
  const getJobStatusBadge = (status: RenderJob['status']) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" />
            CONCLUÍDO
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            PROCESSANDO
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
            <Clock className="w-3 h-3" />
            NA FILA
          </span>
        );
      case 'error':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/25 px-2 py-0.5 rounded text-[10px] font-bold">
            <AlertCircle className="w-3 h-3" />
            ERRO
          </span>
        );
    }
  };

  const getDownloadUrl = (filePath?: string) => {
    if (!filePath) return '#';
    // The server serves outputs/ under /outputs/*
    // videogen-server maps outputs/ to /outputs/
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

  return (
    <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Fila de Renderização
          </h3>
          <p className="text-[10px] text-slate-500">Jobs disparados no backend</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900 transition-all disabled:opacity-50"
          title="Atualizar status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {sortedJobs.length === 0 ? (
        <div className="text-center py-6 text-slate-600 text-xs border border-dashed border-slate-800 rounded-xl">
          Nenhum job de renderização iniciado.
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
          {sortedJobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-2 p-3 bg-slate-950 border border-slate-800/60 hover:border-slate-800 rounded-xl transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="truncate">
                  <h4 className="text-xs font-mono font-bold text-slate-300 truncate">
                    {job.template_id}
                  </h4>
                  <span className="text-[9px] text-slate-600 font-mono block">
                    ID: {job.id.substring(4, 15)}...
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {getJobStatusBadge(job.status)}
                  <button
                    type="button"
                    onClick={() => onDeleteJob(job.id)}
                    className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                    title="Excluir do histórico"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {job.error && (
                <p className="text-[10px] text-red-400 bg-red-950/10 border border-red-900/30 rounded p-1.5 font-mono">
                  {job.error}
                </p>
              )}

              {job.status === 'done' && job.file_path && (
                <div className="flex items-center justify-between gap-4 mt-1 pt-2 border-t border-slate-900/80">
                  <span className="text-[9px] font-mono text-slate-500">
                    Render {formatDuration(job.render_duration_ms)}
                  </span>
                  <a
                    href={getDownloadUrl(job.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2 py-1 rounded"
                  >
                    <Download className="w-3 h-3" />
                    BAIXAR MP4
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
