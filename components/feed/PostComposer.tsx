'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Camera, 
  BarChart3, 
  Link as LinkIcon, 
  Type, 
  Send,
  X,
  Plus
} from 'lucide-react';

type PostType = 'TEXT' | 'IMAGE' | 'POLL' | 'LINK';

interface ComposerState {
  body: string;
  type: PostType;
  images: File[];
  pollOptions: string[];
  linkUrl: string;
  visibility: 'PUBLIC' | 'CONNECTIONS' | 'COLLEGE_ONLY';
}

export function PostComposer() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPollOptions, setShowPollOptions] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [composerState, setComposerState] = useState<ComposerState>({
    body: '',
    type: 'TEXT',
    images: [],
    pollOptions: ['', ''],
    linkUrl: '',
    visibility: 'PUBLIC'
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (composerState.images.length + files.length <= 4) {
      setComposerState(prev => ({
        ...prev,
        type: 'IMAGE',
        images: [...prev.images, ...files]
      }));
    }
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setComposerState(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addPollOption = () => {
    if (composerState.pollOptions.length < 4) {
      setComposerState(prev => ({
        ...prev,
        pollOptions: [...prev.pollOptions, '']
      }));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    setComposerState(prev => ({
      ...prev,
      pollOptions: prev.pollOptions.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removePollOption = (index: number) => {
    if (composerState.pollOptions.length > 2) {
      setComposerState(prev => ({
        ...prev,
        pollOptions: prev.pollOptions.filter((_, i) => i !== index)
      }));
    }
  };

  const setType = (type: PostType) => {
    setComposerState(prev => ({
      ...prev,
      type,
      images: type === 'IMAGE' ? prev.images : [],
      pollOptions: type === 'POLL' ? ['', ''] : ['', ''],
      linkUrl: type === 'LINK' ? prev.linkUrl : ''
    }));
    setShowPollOptions(type === 'POLL');
    setShowLinkInput(type === 'LINK');
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!composerState.body.trim() && composerState.type === 'TEXT') return;
    if (composerState.type === 'POLL' && composerState.pollOptions.filter(opt => opt.trim()).length < 2) return;
    if (composerState.type === 'LINK' && !composerState.linkUrl.trim()) return;
    
    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('body', composerState.body);
      formData.append('type', composerState.type);
      formData.append('visibility', composerState.visibility);
      
      if (composerState.type === 'IMAGE' && composerState.images.length > 0) {
        composerState.images.forEach((image, index) => {
          formData.append(`image${index}`, image);
        });
      }
      
      if (composerState.type === 'POLL') {
        formData.append('pollOptions', JSON.stringify(composerState.pollOptions.filter(opt => opt.trim())));
      }
      
      if (composerState.type === 'LINK') {
        formData.append('linkUrl', composerState.linkUrl);
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Unable to post');
      
      // Reset form
      setComposerState({
        body: '',
        type: 'TEXT',
        images: [],
        pollOptions: ['', ''],
        linkUrl: '',
        visibility: 'PUBLIC'
      });
      setShowPollOptions(false);
      setShowLinkInput(false);
      setMessage('Post published.');
      router.refresh();
    } catch (error) {
      setMessage('Failed to create post.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-600 font-semibold text-white">
          U
        </div>
        <div className="min-w-0 flex-1">
          <Textarea
            value={composerState.body}
            onChange={(e) => setComposerState(prev => ({ ...prev, body: e.target.value }))}
            placeholder="What's on your mind?"
            className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Image Preview Grid */}
      {composerState.type === 'IMAGE' && composerState.images.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {composerState.images.map((image, index) => (
            <div key={index} className="relative group">
              <Image
                src={URL.createObjectURL(image)}
                alt={`Upload ${index + 1}`}
                width={400}
                height={192}
                unoptimized
                className="h-40 w-full rounded-lg object-cover sm:h-32"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Poll Options */}
      {showPollOptions && (
        <div className="mb-4 space-y-2">
          {composerState.pollOptions.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updatePollOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
              />
              {composerState.pollOptions.length > 2 && (
                <button
                  onClick={() => removePollOption(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {composerState.pollOptions.length < 4 && (
            <button
              type="button"
              onClick={addPollOption}
              className="text-muted-foreground text-sm hover:text-foreground"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add option
            </button>
          )}
        </div>
      )}

      {/* Link Input */}
      {showLinkInput && (
        <div className="mb-4">
          <input
            type="url"
            value={composerState.linkUrl}
            onChange={(e) => setComposerState(prev => ({ ...prev, linkUrl: e.target.value }))}
            placeholder="https://example.com"
            className="w-full min-w-0 rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-t border-border pt-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setType('IMAGE');
              fileInputRef.current?.click();
            }}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors ${
              composerState.type === 'IMAGE' 
                ? 'bg-sky-500 text-white' 
                : 'text-muted-foreground hover:bg-slate-100'
            }`}
          >
            <Camera className="h-4 w-4 mr-1" />
            Photo
          </button>
          <button
            type="button"
            onClick={() => setType('POLL')}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors ${
              composerState.type === 'POLL' 
                ? 'bg-sky-500 text-white' 
                : 'text-muted-foreground hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Poll
          </button>
          <button
            type="button"
            onClick={() => setType('LINK')}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors ${
              composerState.type === 'LINK' 
                ? 'bg-sky-500 text-white' 
                : 'text-muted-foreground hover:bg-slate-100'
            }`}
          >
            <LinkIcon className="h-4 w-4 mr-1" />
            Link
          </button>
          <button
            type="button"
            onClick={() => setType('TEXT')}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors ${
              composerState.type === 'TEXT' 
                ? 'bg-sky-500 text-white' 
                : 'text-muted-foreground hover:bg-slate-100'
            }`}
          >
            <Type className="h-4 w-4 mr-1" />
            Format
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <select
            value={composerState.visibility}
            onChange={(e) => setComposerState(prev => ({ 
              ...prev, 
              visibility: e.target.value as 'PUBLIC' | 'CONNECTIONS' | 'COLLEGE_ONLY' 
            }))}
            className="h-9 min-w-0 rounded-lg border border-border px-2 py-1 text-sm"
          >
            <option value="PUBLIC">Public</option>
            <option value="CONNECTIONS">Connections</option>
            <option value="COLLEGE_ONLY">College Only</option>
          </select>
          
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-[10px] bg-sky-500 px-3 text-sm font-semibold text-white shadow-action transition hover:-translate-y-px hover:bg-sky-400 hover:shadow-actionHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? 'Posting...' : 'Post'}
            <Send className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {message && (
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
      )}
    </section>
  );
}
