import { useResponsive } from "../../hooks/useResponsive";
import { useLibrary } from "../../hooks/useLibrary";
import type { Collection } from "../../types";
import CollectionsDesktop from "./Collections.desktop";
import CollectionsMobile from "./Collections.mobile";

export interface CollectionsPageProps {
  collections: Collection[];
  onCreate: (name: string, description?: string) => void;
  onDelete: (id: string) => void;
}

export default function Collections() {
  const { isMobile } = useResponsive();
  const { collections, createCollection, deleteCollection } = useLibrary();

  const props: CollectionsPageProps = {
    collections,
    onCreate: createCollection,
    onDelete: deleteCollection,
  };

  return isMobile ? <CollectionsMobile {...props} /> : <CollectionsDesktop {...props} />;
}
