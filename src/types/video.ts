export interface Scene {
  id: string;
  template: string; // "1" | "2" | "3"
  resolution: string; // e.g. "1920x1080" | "1080x1920" | "1280x720" | "720x1280"
  mediaFiles: string[]; // Blob URLs or remote server paths
  narration: string;
  audioDuration: number;
  takeDuration: number;
  bgVolume: number; // 0 - 100
  voiceLang?: string;
}

export interface CardElement {
  type: 'text' | 'image' | 'video' | 'rect' | 'circle' | 'polygon' | 'frame';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string; // HEX or gradient:#HEX1,#HEX2
  rotation?: number;
  content?: string; // text or image/video URL path
  font_size?: number;
  text_align?: 'left' | 'center' | 'right';
  points?: [number, number][];
  shadow_color?: string;
  shadow_blur?: number;
  shadow_offset_x?: number;
  shadow_offset_y?: number;
}

export interface Card {
  id: string;
  duration_ms: number;
  background_color: string;
  elements: CardElement[];
}

export interface VideoTemplate {
  template_id: string;
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
  audio_url?: string;
  hwaccel?: boolean;
  jpeg_quality?: number;
  cards: Card[];
}

export interface RenderJob {
  id: string;
  template_id: string;
  status: 'pending' | 'processing' | 'rendering' | 'done' | 'error';
  file_path?: string;
  render_duration_ms?: number;
  created_at: string;
  updated_at: string;
  error?: string;
}
