-- Create datasets table to store uploaded files
CREATE TABLE public.datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  columns TEXT[] NOT NULL,
  numeric_columns TEXT[] NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no authentication yet)
CREATE POLICY "Anyone can view datasets" 
ON public.datasets 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create datasets" 
ON public.datasets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update datasets" 
ON public.datasets 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete datasets" 
ON public.datasets 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_datasets_updated_at
BEFORE UPDATE ON public.datasets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();