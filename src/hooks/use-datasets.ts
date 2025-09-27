import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Dataset {
  id: string;
  name: string;
  data: any[];
  columns: string[];
  numericColumns: string[];
  fileSize?: number;
  created_at?: string;
  updated_at?: string;
}

export function useDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);

  // Load datasets from Supabase
  const loadDatasets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedDatasets: Dataset[] = data?.map(item => ({
        id: item.id,
        name: item.name,
        data: item.data as any[],
        columns: item.columns,
        numericColumns: item.numeric_columns,
        fileSize: item.file_size,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];

      setDatasets(formattedDatasets);
    } catch (error) {
      console.error('Error loading datasets:', error);
      toast.error('Erreur lors du chargement des datasets');
    } finally {
      setLoading(false);
    }
  };

  // Save dataset to Supabase
  const saveDataset = async (dataset: Omit<Dataset, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .insert({
          name: dataset.name,
          data: dataset.data,
          columns: dataset.columns,
          numeric_columns: dataset.numericColumns,
          file_size: dataset.fileSize
        })
        .select()
        .single();

      if (error) throw error;

      const newDataset: Dataset = {
        id: data.id,
        name: data.name,
        data: data.data as any[],
        columns: data.columns,
        numericColumns: data.numeric_columns,
        fileSize: data.file_size,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setDatasets(prev => [newDataset, ...prev]);
      toast.success('Dataset sauvegardé avec succès');
      return newDataset;
    } catch (error) {
      console.error('Error saving dataset:', error);
      toast.error('Erreur lors de la sauvegarde du dataset');
      throw error;
    }
  };

  // Delete dataset from Supabase
  const deleteDataset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDatasets(prev => prev.filter(dataset => dataset.id !== id));
      toast.success('Dataset supprimé avec succès');
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast.error('Erreur lors de la suppression du dataset');
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  return {
    datasets,
    loading,
    saveDataset,
    deleteDataset,
    refreshDatasets: loadDatasets
  };
}