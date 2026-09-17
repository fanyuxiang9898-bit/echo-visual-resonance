'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Camera,
  Upload,
  Send,
  X,
  Sparkles,
  Image as ImageIcon,
  Eye,
  Palette,
  Download,
  Search,
  Heart,
  Flame,
  Laugh,
  Moon,
  Paintbrush,
} from 'lucide-react';

type InteractionStyle = 'epic' | 'playful';
type EmotionBranch = 'low' | 'confident' | 'playful' | 'serene';

interface SearchResult {
  identity: string;
  summary: string;
}

interface PerceptionData {
  subject: string;
  pose: string;
  emotion: string;
  emotionBranch: EmotionBranch;
  environment: string;
  styleKeywords: string;
  colorPalette: string;
  rawDescription: string;
  warmCoolTone: string;
  textureStyle: string;
}

interface EchoMessage {
  id: string;
  userImage: string;
  perception: PerceptionData | null;
  searchResult: SearchResult | null;
  style: InteractionStyle;
  emotionBranch: EmotionBranch;
  branchLabel: string;
  persona: string;
  styleLabel: string;
  visualSymbols: string;
  copywriting: string;
  echoImageUrl: string | null;
  isComplete: boolean;
}

const BRANCH_CONFIG: Record<
  EmotionBranch,
  {
    label: string;
    personaName: string;
    color: string;
    bgColor: string;
    icon: typeof Heart;
    textColor: string;
    tone: string;
  }
> = {
  low: {
    label: '无声守候',
    personaName: '无声守候者',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: Heart,
    textColor: '#92400E',
    tone: '文青且深情，侧重于陪伴',
  },
  confident: {
    label: '荣耀见证',
    personaName: '荣耀见证人',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: Flame,
    textColor: '#991B1B',
    tone: '臭屁损友感，放大气场',
  },
  playful: {
    label: '同频捣蛋',
    personaName: '同频捣蛋鬼',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    icon: Laugh,
    textColor: '#5B21B6',
    tone: '毒舌幽默且清醒',
  },
  serene: {
    label: '灵魂知己',
    personaName: '灵魂知己',
    color: '#636E72',
    bgColor: '#F1F2F6',
    icon: Moon,
    textColor: '#2D3436',
    tone: '文学性留白式对话',
  },
};

export default function Home() {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [statusLabel, setStatusLabel] = useState('');
  const [echoMessages, setEchoMessages] = useState<EchoMessage[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [echoMessages, streamingText, statusLabel, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, []);

  const handleImageSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUserImage(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageSelect(file);
      }
    },
    [handleImageSelect]
  );

  const handleCameraCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageSelect(file);
        setIsCameraOpen(false);
      }
    },
    [handleImageSelect]
  );

  const openCamera = useCallback(async () => {
    try {
      setIsCameraOpen(true);
      setTimeout(async () => {
        if (videoRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      cameraInputRef.current?.click();
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setUserImage(dataUrl);
    setIsCameraOpen(false);

    if (videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
  }, []);

  const closeCamera = useCallback(() => {
    setIsCameraOpen(false);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
  }, []);

  const removeImage = useCallback(() => {
    setUserImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, []);

  const downloadImage = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('下载失败:', err);
    }
  }, []);

  const sendEcho = useCallback(async () => {
    if (!userImage || isSending) return;

    setIsSending(true);
    setStreamingText('');
    setStatusLabel('深度感知画面...');

    const currentImage = userImage;

    try {
      const response = await fetch('/api/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentImage,
          triggerWord: '开启次元呼应',
        }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      let perception: PerceptionData | null = null;
      let searchResult: SearchResult | null = null;
      let style: InteractionStyle = 'epic';
      let emotionBranch: EmotionBranch = 'serene';
      let branchLabel = '';
      let persona = '';
      let styleLabel = '';
      let visualSymbols = '';
      let copywriting = '';
      let echoImageUrl: string | null = null;
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
            continue;
          }
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            try {
              const parsed = JSON.parse(data);
              switch (currentEvent) {
                case 'status':
                  setStatusLabel(parsed.label || '');
                  break;
                case 'perception':
                  perception = {
                    subject: parsed.subject || '',
                    pose: parsed.pose || '',
                    emotion: parsed.emotion || '',
                    emotionBranch: parsed.emotionBranch || 'serene',
                    environment: parsed.environment || '',
                    styleKeywords: parsed.styleKeywords || '',
                    colorPalette: parsed.colorPalette || '',
                    rawDescription: parsed.rawDescription || '',
                    warmCoolTone: parsed.warmCoolTone || '',
                    textureStyle: parsed.textureStyle || '',
                  };
                  break;
                case 'search':
                  searchResult = {
                    identity: parsed.identity || '',
                    summary: parsed.summary || '',
                  };
                  break;
                case 'decision':
                  style = parsed.style === 'playful' ? 'playful' : 'epic';
                  emotionBranch = parsed.emotionBranch || 'serene';
                  branchLabel = parsed.branchLabel || '';
                  persona = parsed.persona || '';
                  styleLabel = parsed.styleLabel || '';
                  copywriting = parsed.copywriting || '';
                  visualSymbols = parsed.visualSymbols || '';
                  break;
                case 'text':
                  fullText += parsed.content || '';
                  setStreamingText(fullText);
                  break;
                case 'image':
                  echoImageUrl = parsed.url || null;
                  break;
                case 'done':
                  break;
                case 'error':
                  throw new Error(parsed.message || '处理失败');
              }
            } catch (e) {
              if (
                e instanceof Error &&
                e.message !== '处理失败' &&
                !e.message.includes('JSON')
              ) {
                throw e;
              }
            }
            currentEvent = '';
          }
        }
      }

      const newMessage: EchoMessage = {
        id: Date.now().toString(),
        userImage: currentImage,
        perception,
        searchResult,
        style,
        emotionBranch,
        branchLabel,
        persona,
        styleLabel,
        visualSymbols,
        copywriting: copywriting || fullText,
        echoImageUrl,
        isComplete: true,
      };

      setEchoMessages((prev) => [...prev, newMessage]);
      setUserImage(null);
      setStreamingText('');
      setStatusLabel('');
    } catch (error) {
      console.error('Echo failed:', error);
      setStatusLabel('');
    } finally {
      setIsSending(false);
    }
  }, [userImage, isSending]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />

      {/* Banner */}
      <header className="w-full flex justify-center pt-10 pb-6 px-4">
        <div className="glass-banner rounded-2xl px-10 py-8 md:px-16 md:py-10 text-center max-w-lg">
          <h1
            className="text-3xl md:text-4xl tracking-widest mb-3"
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontWeight: 300,
              color: '#2D3436',
              letterSpacing: '0.15em',
            }}
          >
            Echo：视觉回响
          </h1>
          <p
            className="text-sm md:text-base"
            style={{ color: '#636E72', fontWeight: 300, letterSpacing: '0.05em' }}
          >
            在同频的画卷里，回赠你一份懂得
          </p>
        </div>
      </header>

      {/* Main content area */}
      <main className="w-full max-w-lg px-4 pb-20 flex flex-col gap-6">
        {/* Camera dialog */}
        {isCameraOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md shadow-xl">
              <div className="relative bg-black aspect-[3/4] w-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-center gap-6 py-4 px-6">
                <button
                  onClick={closeCamera}
                  className="w-12 h-12 rounded-full bg-[#F1F2F6] flex items-center justify-center hover:bg-[#E8EAED] transition-colors"
                >
                  <X className="w-5 h-5 text-[#636E72]" />
                </button>
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-white border-4 border-[#636E72] flex items-center justify-center hover:bg-[#F8F9FA] transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#636E72]" />
                </button>
                <div className="w-12 h-12" />
              </div>
            </div>
          </div>
        )}

        {/* Input area - initial state */}
        {!userImage && !isSending && echoMessages.length === 0 && (
          <div className="flex flex-col items-center gap-4 pt-8 fade-in-up">
            <p className="text-sm text-[#B2BEC3] tracking-wide">
              选择一张图片，开启视觉回响
            </p>
            <div className="flex gap-6">
              <button
                onClick={openCamera}
                className="group flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-white hover:bg-[#FAFAFA] transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F1F2F6] flex items-center justify-center group-hover:bg-[#E8EAED] transition-colors">
                  <Camera className="w-5 h-5 text-[#636E72]" />
                </div>
                <span className="text-xs text-[#636E72] font-light tracking-wide">
                  开启摄像头
                </span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-white hover:bg-[#FAFAFA] transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F1F2F6] flex items-center justify-center group-hover:bg-[#E8EAED] transition-colors">
                  <Upload className="w-5 h-5 text-[#636E72]" />
                </div>
                <span className="text-xs text-[#636E72] font-light tracking-wide">
                  上传图片
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Image preview */}
        {userImage && (
          <div className="flex flex-col items-center gap-4 fade-in-up">
            <div className="relative image-preview-container rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
              <img
                src={userImage}
                alt="预览图片"
                className="w-full max-h-80 object-cover"
              />
              <button
                onClick={removeImage}
                disabled={isSending}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors backdrop-blur-sm"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <button
              onClick={sendEcho}
              disabled={isSending}
              className="group flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#636E72] hover:bg-[#4A5568] text-white transition-all duration-300 shadow-[0_4px_16px_rgba(99,110,114,0.25)] hover:shadow-[0_6px_24px_rgba(99,110,114,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-light tracking-widest">发送共鸣</span>
            </button>
          </div>
        )}

        {/* Loading animation */}
        {isSending && (
          <div className="flex flex-col items-center gap-4 py-6 fade-in-up">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#B2BEC3] breathe-animation" />
              <div
                className="w-2.5 h-2.5 rounded-full bg-[#636E72] breathe-animation"
                style={{ animationDelay: '0.4s' }}
              />
              <div
                className="w-2.5 h-2.5 rounded-full bg-[#B2BEC3] breathe-animation"
                style={{ animationDelay: '0.8s' }}
              />
            </div>
            <p className="text-sm text-[#B2BEC3] tracking-widest font-light">
              {statusLabel || 'Echoing'}
              <span className="typewriter-cursor" />
            </p>
          </div>
        )}

        {/* Streaming text preview during processing */}
        {isSending && streamingText && (
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] fade-in-up">
            <p
              className="text-sm leading-relaxed text-[#2D3436] font-light typewriter-cursor"
              style={{ fontFamily: "'Noto Serif SC', serif", lineHeight: '1.9' }}
            >
              {streamingText}
            </p>
          </div>
        )}

        {/* Echo messages */}
        {echoMessages.map((msg) => {
          const branchConfig = BRANCH_CONFIG[msg.emotionBranch] || BRANCH_CONFIG.serene;
          const BranchIcon = branchConfig.icon;

          return (
            <div key={msg.id} className="flex flex-col gap-4 fade-in-up">
              {/* User's image card */}
              <div className="echo-card bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                  <div className="w-5 h-5 rounded-full bg-[#F1F2F6] flex items-center justify-center">
                    <ImageIcon className="w-3 h-3 text-[#B2BEC3]" />
                  </div>
                  <span className="text-xs text-[#B2BEC3] font-light tracking-wide">
                    你的画面
                  </span>
                </div>
                <img
                  src={msg.userImage}
                  alt="用户上传"
                  className="w-full max-h-72 object-cover"
                />
              </div>

              {/* Perception card - enhanced with OCR & style anchoring */}
              {msg.perception && (
                <div className="echo-card bg-white rounded-2xl px-5 py-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#F1F2F6] flex items-center justify-center">
                      <Eye className="w-3 h-3 text-[#636E72]" />
                    </div>
                    <span className="text-xs text-[#636E72] font-light tracking-wide">
                      Echo 深度感知
                    </span>
                  </div>
                  {/* Emotion branch tag */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide"
                      style={{
                        backgroundColor: branchConfig.bgColor,
                        color: branchConfig.textColor,
                      }}
                    >
                      <BranchIcon className="w-3 h-3" />
                      {branchConfig.label}
                    </span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-light tracking-wide"
                      style={{
                        backgroundColor: branchConfig.bgColor,
                        color: branchConfig.textColor,
                      }}
                    >
                      {branchConfig.personaName}
                    </span>
                  </div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {msg.perception.subject && msg.perception.subject !== '未知主体' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F1F2F6] text-[10px] text-[#636E72] font-light tracking-wide">
                        {msg.perception.subject}
                      </span>
                    )}
                    {msg.perception.emotion && msg.perception.emotion !== '未知' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F1F2F6] text-[10px] text-[#636E72] font-light tracking-wide">
                        {msg.perception.emotion}
                      </span>
                    )}
                    {msg.perception.pose && msg.perception.pose !== '未知' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F1F2F6] text-[10px] text-[#636E72] font-light tracking-wide">
                        {msg.perception.pose}
                      </span>
                    )}
                    {msg.perception.environment && msg.perception.environment !== '未知' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F1F2F6] text-[10px] text-[#636E72] font-light tracking-wide">
                        {msg.perception.environment}
                      </span>
                    )}
                  </div>
                  {/* Style anchor tags */}
                  {(msg.perception.styleKeywords || msg.perception.colorPalette || msg.perception.warmCoolTone || msg.perception.textureStyle) && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {msg.perception.styleKeywords && (
                        <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-[#F1F2F6] text-[10px] text-[#B2BEC3] font-light tracking-wide italic">
                          <Paintbrush className="w-2.5 h-2.5" />
                          {msg.perception.styleKeywords}
                        </span>
                      )}
                      {msg.perception.colorPalette && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F1F2F6] text-[10px] text-[#B2BEC3] font-light tracking-wide">
                          {msg.perception.colorPalette}
                        </span>
                      )}
                      {msg.perception.warmCoolTone && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F1F2F6] text-[10px] text-[#B2BEC3] font-light tracking-wide">
                          {msg.perception.warmCoolTone}
                        </span>
                      )}
                      {msg.perception.textureStyle && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F1F2F6] text-[10px] text-[#B2BEC3] font-light tracking-wide">
                          {msg.perception.textureStyle}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-[#B2BEC3] font-light italic">
                    {msg.perception.rawDescription}
                  </p>
                </div>
              )}

              {/* Search trace card */}
              {msg.searchResult && (
                <div className="echo-card bg-white rounded-2xl px-5 py-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#EDE9FE] flex items-center justify-center">
                      <Search className="w-3 h-3 text-[#7C3AED]" />
                    </div>
                    <span className="text-xs text-[#7C3AED] font-light tracking-wide">
                      联网溯源
                    </span>
                  </div>
                  <p className="text-xs text-[#2D3436] font-medium mb-1.5">
                    {msg.searchResult.identity}
                  </p>
                  <p className="text-[11px] text-[#636E72] font-light leading-relaxed line-clamp-3">
                    {msg.searchResult.summary}
                  </p>
                </div>
              )}

              {/* Echo response card - resonance monologue */}
              <div className="echo-card bg-white rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: branchConfig.bgColor }}
                  >
                    <BranchIcon className="w-3 h-3" style={{ color: branchConfig.textColor }} />
                  </div>
                  <span className="text-xs font-light tracking-wide" style={{ color: branchConfig.textColor }}>
                    {msg.persona || branchConfig.personaName}
                  </span>
                  {msg.branchLabel && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-light tracking-wide"
                      style={{
                        backgroundColor: branchConfig.bgColor,
                        color: branchConfig.textColor,
                      }}
                    >
                      {msg.branchLabel}
                    </span>
                  )}
                  {msg.styleLabel && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-light tracking-wide ${
                        msg.style === 'playful'
                          ? 'bg-[#FEF3C7] text-[#92400E]'
                          : 'bg-[#F1F2F6] text-[#636E72]'
                      }`}
                    >
                      <Palette className="w-2.5 h-2.5 mr-1" />
                      {msg.styleLabel}
                    </span>
                  )}
                </div>
                <p
                  className="text-base leading-loose text-[#2D3436] font-light"
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    lineHeight: '2',
                  }}
                >
                  {msg.copywriting}
                </p>
                {msg.visualSymbols && (
                  <p className="mt-3 text-[10px] text-[#B2BEC3] font-light italic">
                    视觉符号：{msg.visualSymbols}
                  </p>
                )}
                {/* Tone indicator */}
                <p className="mt-1 text-[10px] text-[#B2BEC3] font-light">
                  语调：{branchConfig.tone}
                </p>
              </div>

              {/* Echo image card */}
              {msg.echoImageUrl && (
                <div className="echo-card bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: branchConfig.bgColor }}
                    >
                      <BranchIcon className="w-3 h-3" style={{ color: branchConfig.textColor }} />
                    </div>
                    <span className="text-xs text-[#636E72] font-light tracking-wide">
                      次元呼应
                    </span>
                    {msg.branchLabel && (
                      <span
                        className="text-[10px] font-light tracking-wide"
                        style={{ color: branchConfig.color }}
                      >
                        {msg.branchLabel}
                      </span>
                    )}
                  </div>
                  <img
                    src={msg.echoImageUrl}
                    alt="Echo 生成的呼应图片"
                    className="w-full object-cover"
                  />
                  <div className="px-5 py-4">
                    <button
                      onClick={() =>
                        downloadImage(msg.echoImageUrl!, `echo-${msg.emotionBranch}-${msg.id}.png`)
                      }
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F1F2F6] hover:bg-[#E8EAED] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#636E72]" />
                      <span className="text-xs text-[#636E72] font-light tracking-wide">
                        保存这波共鸣
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Continue prompt after messages */}
        {(echoMessages.length > 0 || userImage) && !isSending && !userImage && (
          <div className="flex flex-col items-center gap-3 pt-4 fade-in-up">
            <p className="text-xs text-[#B2BEC3] tracking-wide font-light">
              继续探索？
            </p>
            <div className="flex gap-4">
              <button
                onClick={openCamera}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#FAFAFA] transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
              >
                <Camera className="w-4 h-4 text-[#636E72]" />
                <span className="text-xs text-[#636E72] font-light">拍摄</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#FAFAFA] transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
              >
                <Upload className="w-4 h-4 text-[#636E72]" />
                <span className="text-xs text-[#636E72] font-light">上传</span>
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>
    </div>
  );
}
