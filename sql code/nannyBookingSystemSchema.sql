-- Create bookings table
CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nanny_id UUID NOT NULL REFERENCES nannies(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_nanny_id ON bookings(nanny_id);
CREATE INDEX idx_bookings_parent_id ON bookings(parent_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (
        auth.uid() = parent_id OR 
        auth.uid() IN (SELECT user_id FROM nannies WHERE id = nanny_id)
    );

CREATE POLICY "Parents can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Users can update their own bookings" ON bookings
    FOR UPDATE USING (
        auth.uid() = parent_id OR 
        auth.uid() IN (SELECT user_id FROM nannies WHERE id = nanny_id)
    );

-- Create trigger for updated_at
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 