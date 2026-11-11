/**
 * Tipos do schema do Supabase (mesmo formato gerado por `supabase gen types`).
 * Mantenha em sincronia com `supabase/migrations`.
 *
 * Obs.: precisam ser `type` (e não `interface`) para satisfazer os genéricos do supabase-js.
 */
export type PantryItemRemoteRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  storage_location: string;
  quantity: number;
  unit: string;
  expiration_date: string;
  notes: string | null;
  barcode: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** `updated_at` é definido pelo servidor (trigger), por isso é opcional no envio. */
export type PantryItemRemoteInsert = Omit<PantryItemRemoteRow, 'updated_at'> & {
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      pantry_items: {
        Row: PantryItemRemoteRow;
        Insert: PantryItemRemoteInsert;
        Update: Partial<PantryItemRemoteInsert>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
