-- Create nanny_availability table
CREATE TABLE nanny_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nanny_id UUID NOT NULL REFERENCES nannies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nanny_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_nanny_availability_nanny_id ON nanny_availability(nanny_id);
CREATE INDEX idx_nanny_availability_date ON nanny_availability(date);
CREATE INDEX idx_nanny_availability_available ON nanny_availability(available);

-- Enable Row Level Security
ALTER TABLE nanny_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view availability" ON nanny_availability
    FOR SELECT USING (true);

CREATE POLICY "Nannies can manage their own availability" ON nanny_availability
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM nannies WHERE id = nanny_availability.nanny_id
        )
    ); 