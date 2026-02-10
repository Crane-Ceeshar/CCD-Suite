'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import { Button } from '@ccd/ui';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Image as ImageIcon,
  Code2,
} from 'lucide-react';

interface TipTapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function TipTapEditor({
  content = '',
  onChange,
  placeholder = 'Start writing your content...',
  editable = true,
  className,
}: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
      }),
      CharacterCount,
      Typography,
    ],
    content,
    editable,
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[400px] focus:outline-none px-4 py-3',
      },
    },
  });

  if (!editor) return null;

  function addLink() {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }

  function addImage() {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }

  const chars = editor.storage.characterCount.characters();
  const words = editor.storage.characterCount.words();

  return (
    <div className={`rounded-lg border bg-background ${className ?? ''}`}>
      {/* ── Toolbar ──────────────────────────────────────── */}
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b p-1.5">
          <ToolbarButton
            icon={<Bold className="h-4 w-4" />}
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          />
          <ToolbarButton
            icon={<Italic className="h-4 w-4" />}
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          />
          <ToolbarButton
            icon={<Strikethrough className="h-4 w-4" />}
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          />
          <ToolbarButton
            icon={<Code className="h-4 w-4" />}
            active={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Inline Code"
          />

          <div className="mx-1 h-6 w-px bg-border" />

          <ToolbarButton
            icon={<Heading1 className="h-4 w-4" />}
            active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          />
          <ToolbarButton
            icon={<Heading2 className="h-4 w-4" />}
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          />
          <ToolbarButton
            icon={<Heading3 className="h-4 w-4" />}
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          />

          <div className="mx-1 h-6 w-px bg-border" />

          <ToolbarButton
            icon={<List className="h-4 w-4" />}
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          />
          <ToolbarButton
            icon={<ListOrdered className="h-4 w-4" />}
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Ordered List"
          />
          <ToolbarButton
            icon={<Quote className="h-4 w-4" />}
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          />
          <ToolbarButton
            icon={<Code2 className="h-4 w-4" />}
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code Block"
          />
          <ToolbarButton
            icon={<Minus className="h-4 w-4" />}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          />

          <div className="mx-1 h-6 w-px bg-border" />

          <ToolbarButton
            icon={<LinkIcon className="h-4 w-4" />}
            active={editor.isActive('link')}
            onClick={addLink}
            title="Add Link"
          />
          <ToolbarButton
            icon={<ImageIcon className="h-4 w-4" />}
            onClick={addImage}
            title="Add Image"
          />

          <div className="mx-1 h-6 w-px bg-border" />

          <ToolbarButton
            icon={<Undo2 className="h-4 w-4" />}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          />
          <ToolbarButton
            icon={<Redo2 className="h-4 w-4" />}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          />
        </div>
      )}

      {/* ── Editor ───────────────────────────────────────── */}
      <EditorContent editor={editor} />

      {/* ── Footer ───────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t px-3 py-1.5 text-xs text-muted-foreground">
        <span>
          {chars} characters &middot; {words} words
        </span>
      </div>
    </div>
  );
}

// ── Toolbar Button ──────────────────────────────────────────────

function ToolbarButton({
  icon,
  active,
  onClick,
  disabled,
  title,
}: {
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 ${active ? 'bg-accent text-accent-foreground' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
    >
      {icon}
    </Button>
  );
}
