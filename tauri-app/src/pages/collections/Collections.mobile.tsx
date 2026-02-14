import { useState } from "react";
import { Plus } from "lucide-react";
import CollectionCard from "../../components/ui/CollectionCard";
import type { CollectionsPageProps } from "./Collections";

export default function CollectionsMobile({ collections, onCreate }: CollectionsPageProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
    setShowCreate(false);
  };

  return (
    <div className="min-h-screen bg-black pt-2 pb-24 px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-serif font-black text-white">Collections</h1>
        <button onClick={() => setShowCreate(true)} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/50">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showCreate && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none"
            autoFocus
          />
          <button onClick={handleCreate} className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold">Create</button>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-white/30 text-xs mb-3">No collections yet</p>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold">Create One</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {collections.map(c => <CollectionCard key={c.id} collection={c} />)}
        </div>
      )}
    </div>
  );
}
