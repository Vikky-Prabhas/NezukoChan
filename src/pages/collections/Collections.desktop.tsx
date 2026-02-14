import { useState } from "react";
import { Plus, FolderPlus, X } from "lucide-react";
import CollectionCard from "../../components/ui/CollectionCard";
import type { CollectionsPageProps } from "./Collections";

export default function CollectionsDesktop({ collections, onCreate }: CollectionsPageProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), desc.trim());
    setName("");
    setDesc("");
    setShowCreate(false);
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-[1920px] mx-auto px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-serif font-black text-white mb-2">My Collections</h1>
            <p className="text-white/40 text-sm font-medium">Curate your personal anime libraries.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="group flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
          >
            <Plus className="w-4 h-4" /> Create New
          </button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => setShowCreate(false)} />
            <div className="relative bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-lg space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <button onClick={() => setShowCreate(false)} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                  <FolderPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-white">New Collection</h2>
                  <p className="text-white/40 text-sm">Give your library a name.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Weekend Binges"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-base font-bold text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Description <span className="text-white/20">(Optional)</span></label>
                  <input
                    type="text"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="What's this collection about?"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-3.5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreate} className="flex-1 py-3.5 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50" disabled={!name.trim()}>
                  Create Collection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
            <FolderPlus className="w-12 h-12 text-white/10 mb-4" />
            <p className="text-white/40 text-lg font-bold mb-6">No collections found</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-8 py-3 bg-white text-black rounded-lg text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Start Curating
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collections.map(c => <CollectionCard key={c.id} collection={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
