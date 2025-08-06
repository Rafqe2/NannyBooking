-- Function to update nanny rating when a review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_nanny_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the nanny's rating and review count
    UPDATE nannies 
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews 
            WHERE nanny_id = COALESCE(NEW.nanny_id, OLD.nanny_id)
        ),
        reviews_count = (
            SELECT COUNT(*)
            FROM reviews 
            WHERE nanny_id = COALESCE(NEW.nanny_id, OLD.nanny_id)
        )
    WHERE id = COALESCE(NEW.nanny_id, OLD.nanny_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for reviews
CREATE TRIGGER update_nanny_rating_on_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_nanny_rating();

CREATE TRIGGER update_nanny_rating_on_review_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_nanny_rating();

CREATE TRIGGER update_nanny_rating_on_review_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_nanny_rating();

-- Function to check if nanny is available for given dates
CREATE OR REPLACE FUNCTION check_nanny_availability(
    p_nanny_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    unavailable_dates INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unavailable_dates
    FROM nanny_availability
    WHERE nanny_id = p_nanny_id
      AND date BETWEEN p_start_date AND p_end_date
      AND available = FALSE;
    
    RETURN unavailable_dates = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get nannies with availability for given dates and location
CREATE OR REPLACE FUNCTION get_available_nannies(
    p_location VARCHAR,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    nanny_id UUID,
    user_id UUID,
    name VARCHAR,
    surname VARCHAR,
    location VARCHAR,
    hourly_rate DECIMAL,
    experience_years INTEGER,
    languages TEXT[],
    availability VARCHAR,
    verified BOOLEAN,
    rating DECIMAL,
    reviews_count INTEGER,
    bio TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id as nanny_id,
        n.user_id,
        u.name,
        u.surname,
        n.location,
        n.hourly_rate,
        n.experience_years,
        n.languages,
        n.availability,
        n.verified,
        n.rating,
        n.reviews_count,
        n.bio
    FROM nannies n
    JOIN users u ON n.user_id = u.id
    WHERE n.location ILIKE '%' || p_location || '%'
      AND check_nanny_availability(n.id, p_start_date, p_end_date)
    ORDER BY n.rating DESC, n.reviews_count DESC;
END;
$$ LANGUAGE plpgsql; 