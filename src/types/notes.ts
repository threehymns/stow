
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

export interface DatabaseNote {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
  user_id: string;
}

export interface DatabaseFolder {
  id: string;
  name: string;
  created_at: string;
  parent_id: string | null;
  user_id: string;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}
