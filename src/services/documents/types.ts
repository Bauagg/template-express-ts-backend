export interface UploadDocumentInput {
  user_id: string;
  created_by: string;
  updated_by: string;
  ref_id?: string;
  ref_type?: string;
}

export interface UpdateDocumentInput {
  ref_id?: string | null;
  ref_type?: string | null;
  updated_by: string;
}