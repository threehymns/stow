
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  folderId: string | null;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  parentId: string | null;
}
