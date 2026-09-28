'use client';

import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

interface RoomCodeProps {
  code: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RoomCode({ code, size = 'md' }: RoomCodeProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/game/${code}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const codeTextSize = size === 'lg' ? 'text-2xl md:text-3xl' : size === 'sm' ? 'text-base md:text-lg' : 'text-xl md:text-2xl';

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <div className="flex items-center gap-3 bg-slate-100/90 dark:bg-slate-900/80 border border-slate-300 dark:border-indigo-500/30 rounded-xl px-4 py-2 shadow-inner">
        <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Room Code:</span>
        <span className={`font-mono font-black tracking-widest text-violet-700 dark:text-indigo-400 drop-shadow-sm ${codeTextSize}`}>
          {code}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-3 py-2 bg-violet-100 hover:bg-violet-200 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-violet-800 dark:text-indigo-300 border border-violet-300 dark:border-indigo-500/40 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
          title="Copy room code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
          title="Copy invite link"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
        </button>
      </div>
    </div>
  );
}
