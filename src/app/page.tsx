'use client';

import { useState, useEffect } from 'react';
import Editor from '@/components/Editor';
import { 
  Folder, 
  FolderPlus, 
  FileText, 
  FilePlus, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Search,
  Save,
  Menu,
  X,
  Pencil,
  FolderInput,
  RotateCcw
} from 'lucide-react';

interface NoteItem {
  id: string;
  name: string;
  type: 'folder' | 'note';
  content?: string;
  children?: NoteItem[];
}

const DEFAULT_TREE: NoteItem[] = [
  {
    id: '1',
    name: 'Personal Vault',
    type: 'folder',
    children: [
      {
        id: '2',
        name: 'Work',
        type: 'folder',
        children: [
          { id: '3', name: 'Sprint Roadmap.md', type: 'note', content: '<h1>Sprint Tasks</h1><p>Notes here...</p>' },
        ]
      },
      { id: '4', name: 'Ideas.md', type: 'note', content: '<h1>Project Ideas</h1><p>Start brainstorm...</p>' }
    ]
  }
];

export default function App() {
  const [tree, setTree] = useState<NoteItem[]>(DEFAULT_TREE);
  const [trash, setTrash] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>('3');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  useEffect(() => {
    const loadVault = async () => {
      try {
        const response = await fetch('/api/vault', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load vault');

        const savedVault = await response.json();
        if (Array.isArray(savedVault.tree)) {
          setTree(savedVault.tree);
          setTrash(Array.isArray(savedVault.trash) ? savedVault.trash : []);
          const firstNote = findFirstNote(savedVault.tree);
          if (firstNote) setActiveNoteId(firstNote.id);
        } else {
          const legacyVault = localStorage.getItem('obsidian_tree');
          if (legacyVault) {
            setTree(JSON.parse(legacyVault));
            setIsDirty(true);
          }
        }
      } catch {
        setSaveError('Could not load the shared vault.');
      } finally {
        setIsLoading(false);
      }
    };

    loadVault();
  }, []);

  const updateTree = (newTree: NoteItem[]) => {
    setTree(newTree);
    setIsDirty(true);
    setSaveError('');
  };

  // Helper to find note content
  const findNote = (items: NoteItem[], id: string): NoteItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findNote(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Update content of current note
  const updateContent = (content: string) => {
    const updateRecursive = (items: NoteItem[]): NoteItem[] => {
      return items.map((item) => {
        if (item.id === activeNoteId) return { ...item, content };
        if (item.children) return { ...item, children: updateRecursive(item.children) };
        return item;
      });
    };
    updateTree(updateRecursive(tree));
  };

  // Add a new note or folder inside a topic/subtopic
  const addItem = (parentId: string, type: 'folder' | 'note') => {
    const title = prompt(`Enter ${type} name:`);
    if (!title) return;

    const newItem: NoteItem = {
      id: Date.now().toString(),
      name: type === 'note' && !title.endsWith('.md') ? `${title}.md` : title,
      type,
      content: type === 'note' ? '<h1>' + title + '</h1>' : undefined,
      children: type === 'folder' ? [] : undefined,
    };

    const addRecursive = (items: NoteItem[]): NoteItem[] => {
      return items.map((item) => {
        if (item.id === parentId && item.type === 'folder') {
          return { ...item, children: [...(item.children || []), newItem] };
        }
        if (item.children) {
          return { ...item, children: addRecursive(item.children) };
        }
        return item;
      });
    };

    updateTree(addRecursive(tree));
  };

  const saveVault = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tree, trash }),
      });
      if (!response.ok) throw new Error('Unable to save vault');
      localStorage.removeItem('obsidian_tree');
      setIsDirty(false);
    } catch {
      setSaveError('Save failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeFromTree = (items: NoteItem[], id: string): NoteItem[] =>
    items
      .filter((item) => item.id !== id)
      .map((item) => ({
        ...item,
        children: item.children ? removeFromTree(item.children, id) : undefined,
      }));

  const addToFolder = (items: NoteItem[], folderId: string, itemToAdd: NoteItem): NoteItem[] =>
    items.map((item) => {
      if (item.id === folderId && item.type === 'folder') {
        return { ...item, children: [...(item.children || []), itemToAdd] };
      }
      return item.children ? { ...item, children: addToFolder(item.children, folderId, itemToAdd) } : item;
    });

  const renameItem = (id: string) => {
    const item = findNote(tree, id);
    if (!item) return;
    const name = prompt(`Rename ${item.type}:`, item.name)?.trim();
    if (!name) return;

    const renameRecursive = (items: NoteItem[]): NoteItem[] =>
      items.map((entry) => entry.id === id
        ? { ...entry, name: entry.type === 'note' && !name.endsWith('.md') ? `${name}.md` : name }
        : { ...entry, children: entry.children ? renameRecursive(entry.children) : undefined });
    updateTree(renameRecursive(tree));
  };

  const moveItem = (id: string) => {
    const item = findNote(tree, id);
    if (!item) return;
    const folders = getFolders(tree);
    const destinationId = prompt(`Move to which folder?\n\n${folders.map((folder) => `${folder.id}: ${folder.name}`).join('\n')}`, '1')?.trim();
    if (!destinationId || !folders.some((folder) => folder.id === destinationId)) return;
    if (destinationId === id || (item.children && findNote(item.children, destinationId))) {
      setSaveError('A folder cannot be moved into itself.');
      return;
    }

    updateTree(addToFolder(removeFromTree(tree, id), destinationId, item));
  };

  const moveToTrash = (id: string) => {
    if (id === '1') return;
    const item = findNote(tree, id);
    if (!item) return;
    const newTree = removeFromTree(tree, id);
    updateTree(newTree);
    setTrash((current) => [...current, item]);
    if (!findNote(newTree, activeNoteId)) {
      setActiveNoteId(findFirstNote(newTree)?.id || '');
    }
  };

  const restoreItem = (id: string) => {
    const item = trash.find((entry) => entry.id === id);
    if (!item) return;
    updateTree(addToFolder(tree, '1', item));
    setTrash((current) => current.filter((entry) => entry.id !== id));
  };

  const permanentlyDeleteItem = (id: string) => {
    if (!confirm('Permanently delete this item? This cannot be undone.')) return;
    setTrash((current) => current.filter((entry) => entry.id !== id));
    setIsDirty(true);
  };

  const activeNote = findNote(tree, activeNoteId);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 antialiased">
      {/* Sidebar: Topics & Subtopics */}
      <div className={`fixed inset-y-0 left-0 z-40 flex w-[82vw] max-w-xs flex-col border-r border-zinc-800 bg-zinc-900 shadow-2xl transition-transform duration-200 md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 md:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <span className="font-bold text-sm tracking-wide text-zinc-200 uppercase">Vault</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => addItem('1', 'folder')} 
              className="text-zinc-400 hover:text-white" 
              title="New Subtopic"
            >
              <FolderPlus size={16} />
            </button>
            <button
              onClick={saveVault}
              disabled={isSaving || !isDirty}
              className="flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-xs font-medium text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              title="Save shared vault"
            >
              <Save size={14} /> {isSaving ? 'Saving' : isDirty ? 'Save' : 'Saved'}
            </button>
            <button
              onClick={() => setIsTrashOpen((open) => !open)}
              className={`rounded p-1 ${isTrashOpen ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
              title="Open trash"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white md:hidden"
              title="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-2">
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs">
            <Search size={14} className="text-zinc-500" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-full text-zinc-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {isTrashOpen ? (
            <>
              <p className="px-2 py-1 text-xs font-medium text-zinc-400">Trash</p>
              {trash.length === 0 ? <p className="px-2 text-xs text-zinc-600">Trash is empty</p> : trash.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800">
                  {item.type === 'folder' ? <Folder size={14} /> : <FileText size={14} />}
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <button onClick={() => restoreItem(item.id)} className="p-1 text-purple-300 hover:text-purple-100" title="Restore"><RotateCcw size={13} /></button>
                  <button onClick={() => permanentlyDeleteItem(item.id)} className="p-1 text-rose-400 hover:text-rose-300" title="Delete permanently"><Trash2 size={13} /></button>
                </div>
              ))}
            </>
          ) : tree.map((item) => (
            <TreeItemNode 
              key={item.id} 
              item={item} 
              activeId={activeNoteId} 
              onSelect={(id) => {
                setActiveNoteId(id);
                setIsSidebarOpen(false);
              }}
              onAdd={addItem}
              onDelete={moveToTrash}
              onRename={renameItem}
              onMove={moveItem}
            />
          ))}
        </div>
      </div>

      {isSidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-3 top-3 z-30 rounded-md border border-zinc-700 bg-zinc-900 p-2 text-zinc-200 shadow-lg hover:bg-zinc-800 md:hidden"
          title="Open sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Main Workspace Editor */}
      <div className="flex-1 flex flex-col h-full bg-zinc-950">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">Loading vault...</div>
        ) : activeNote ? (
          <>
            <header className="flex items-center justify-between border-b border-zinc-800 py-3 pl-14 pr-4 text-xs text-zinc-500 md:px-8">
              <span>{activeNote.name}</span>
              <button
                onClick={() => moveToTrash(activeNote.id)}
                className="flex items-center gap-1 rounded px-2 py-1 text-rose-400 hover:bg-rose-400/10 hover:text-rose-300"
                title="Delete note"
              >
                <Trash2 size={14} /> Delete
              </button>
            </header>
            <div className="flex-1 overflow-hidden">
              <Editor content={activeNote.content || ''} onChange={updateContent} />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
            Select or create a note to start editing
          </div>
        )}
      </div>
      {saveError && <div className="fixed bottom-4 right-4 rounded-md bg-rose-950 px-3 py-2 text-sm text-rose-200 shadow-lg">{saveError}</div>}
    </div>
  );
}

function findFirstNote(items: NoteItem[]): NoteItem | null {
  for (const item of items) {
    if (item.type === 'note') return item;
    if (item.children) {
      const found = findFirstNote(item.children);
      if (found) return found;
    }
  }
  return null;
}

function getFolders(items: NoteItem[]): NoteItem[] {
  return items.flatMap((item) => item.type === 'folder' ? [item, ...getFolders(item.children || [])] : []);
}

function TreeItemNode({ 
  item, 
  activeId, 
  onSelect, 
  onAdd,
  onDelete,
  onRename,
  onMove
}: { 
  item: NoteItem; 
  activeId: string; 
  onSelect: (id: string) => void;
  onAdd: (parentId: string, type: 'folder' | 'note') => void;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
  onMove: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (item.type === 'folder') {
    return (
      <div>
        <div className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-zinc-800 text-xs text-zinc-300 font-medium cursor-pointer">
          <div className="flex items-center gap-1.5 flex-1" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={14} className="text-purple-400" />
            <span>{item.name}</span>
          </div>
          <div className="flex items-center gap-1 md:hidden md:group-hover:flex">
            <button onClick={() => onAdd(item.id, 'note')} title="New Note"><FilePlus size={12} /></button>
            <button onClick={() => onAdd(item.id, 'folder')} title="New Folder"><FolderPlus size={12} /></button>
            {item.id !== '1' && <button onClick={() => onRename(item.id)} title="Rename Folder"><Pencil size={12} /></button>}
            {item.id !== '1' && <button onClick={() => onMove(item.id)} title="Move Folder"><FolderInput size={12} /></button>}
            {item.id !== '1' && <button onClick={() => onDelete(item.id)} title="Delete Folder"><Trash2 size={12} /></button>}
          </div>
        </div>
        {isOpen && item.children && (
          <div className="pl-4 border-l border-zinc-800 ml-2 space-y-0.5 mt-0.5">
            {item.children.map((child) => (
              <TreeItemNode key={child.id} item={child} activeId={activeId} onSelect={onSelect} onAdd={onAdd} onDelete={onDelete} onRename={onRename} onMove={onMove} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer ${
        activeId === item.id ? 'bg-purple-600/20 text-purple-300 font-medium' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
      }`}
    >
      <button onClick={() => onSelect(item.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left"><FileText size={14} /><span className="truncate">{item.name}</span></button>
      <div className="flex items-center gap-1 md:hidden md:group-hover:flex">
        <button onClick={() => onRename(item.id)} title="Rename Note"><Pencil size={12} /></button>
        <button onClick={() => onMove(item.id)} title="Move Note"><FolderInput size={12} /></button>
        <button onClick={() => onDelete(item.id)} title="Move to Trash"><Trash2 size={12} /></button>
      </div>
    </div>
  );
}
