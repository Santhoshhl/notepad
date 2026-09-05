'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect, useState } from 'react';
import { 
  Table as TableIcon, 
  Plus, 
  Trash2, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered,
  Quote,
  Code2,
  AlignLeft,
  Info
} from 'lucide-react';

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function Editor({ content, onChange }: EditorProps) {
  const [isBlockMenuOpen, setIsBlockMenuOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const insertBlock = (action: () => void) => {
    action();
    setIsBlockMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-zinc-800 bg-zinc-900/50 p-2 px-6">
        <div className="relative">
          <button
            onClick={() => setIsBlockMenuOpen((isOpen) => !isOpen)}
            className="flex items-center gap-1 rounded bg-purple-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-purple-500"
            title="Add a content block"
          >
            <Plus size={15} /> Add block
          </button>

          {isBlockMenuOpen && (
            <div className="absolute left-0 top-full z-30 mt-2 grid w-72 grid-cols-2 gap-1 rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-2xl">
              <BlockOption icon={<AlignLeft size={16} />} label="Text" description="Start writing" onClick={() => insertBlock(() => editor.chain().focus().setParagraph().run())} />
              <BlockOption icon={<Heading1 size={16} />} label="Heading" description="Section title" onClick={() => insertBlock(() => editor.chain().focus().toggleHeading({ level: 1 }).run())} />
              <BlockOption icon={<List size={16} />} label="Bulleted list" description="Key points" onClick={() => insertBlock(() => editor.chain().focus().toggleBulletList().run())} />
              <BlockOption icon={<ListOrdered size={16} />} label="Numbered list" description="Steps" onClick={() => insertBlock(() => editor.chain().focus().toggleOrderedList().run())} />
              <BlockOption icon={<Quote size={16} />} label="Quote" description="Quoted text" onClick={() => insertBlock(() => editor.chain().focus().toggleBlockquote().run())} />
              <BlockOption icon={<Code2 size={16} />} label="Code" description="Code snippet" onClick={() => insertBlock(() => editor.chain().focus().toggleCodeBlock().run())} />
              <BlockOption icon={<Info size={16} />} label="Info note" description="Callout box" onClick={() => insertBlock(() => editor.chain().focus().insertContent('<blockquote><p>Type an important note here…</p></blockquote>').run())} />
              <BlockOption icon={<TableIcon size={16} />} label="Table" description="Rows and columns" onClick={() => insertBlock(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())} />
            </div>
          )}
        </div>

        <div className="mx-1 h-6 w-px self-center bg-zinc-800" />
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-zinc-800 ${editor.isActive('bold') ? 'bg-zinc-800 text-purple-400' : 'text-zinc-300'}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-zinc-800 ${editor.isActive('italic') ? 'bg-zinc-800 text-purple-400' : 'text-zinc-300'}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded hover:bg-zinc-800 ${editor.isActive('heading', { level: 1 }) ? 'bg-zinc-800 text-purple-400' : 'text-zinc-300'}`}
          title="H1"
        >
          <Heading1 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-zinc-800 ${editor.isActive('heading', { level: 2 }) ? 'bg-zinc-800 text-purple-400' : 'text-zinc-300'}`}
          title="H2"
        >
          <Heading2 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-zinc-800 ${editor.isActive('bulletList') ? 'bg-zinc-800 text-purple-400' : 'text-zinc-300'}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-zinc-800 ${editor.isActive('orderedList') ? 'bg-zinc-800 text-purple-400' : 'text-zinc-300'}`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>

        <div className="w-[1px] h-6 bg-zinc-800 mx-2 self-center" />

        {/* Table Management */}
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="flex items-center gap-1 text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-200 hover:bg-zinc-700"
          title="Insert Table"
        >
          <TableIcon size={14} /> Insert Table
        </button>
        
        {editor.isActive('table') && (
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-xs">
            <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="hover:text-purple-400 p-1">+Col</button>
            <button onClick={() => editor.chain().focus().deleteColumn().run()} className="hover:text-rose-400 p-1">-Col</button>
            <span className="text-zinc-600">|</span>
            <button onClick={() => editor.chain().focus().addRowAfter().run()} className="hover:text-purple-400 p-1">+Row</button>
            <button onClick={() => editor.chain().focus().deleteRow().run()} className="hover:text-rose-400 p-1">-Row</button>
            <span className="text-zinc-600">|</span>
            <button onClick={() => editor.chain().focus().deleteTable().run()} className="text-rose-400 hover:text-rose-300 p-1">Delete Table</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function BlockOption({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex items-start gap-2 rounded-md p-2 text-left hover:bg-zinc-800">
      <span className="mt-0.5 text-purple-400">{icon}</span>
      <span>
        <span className="block text-xs font-medium text-zinc-100">{label}</span>
        <span className="block text-[11px] text-zinc-500">{description}</span>
      </span>
    </button>
  );
}
