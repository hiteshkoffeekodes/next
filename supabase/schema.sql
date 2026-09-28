-- ==============================================================================
-- BINGO MULTIPLAYER DATABASE SCHEMA FOR SUPABASE
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Games Table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(10) NOT NULL UNIQUE,
    host_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    winner_id UUID NULL,
    winner_name VARCHAR(100) NULL,
    current_turn_player_id UUID NULL,
    turn_order UUID[] NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ NULL,
    finished_at TIMESTAMPTZ NULL
);

-- 3. Create Players Table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    board JSONB NOT NULL, -- Array of 25 numbers (1-25) in unique random order
    completed_lines INT NOT NULL DEFAULT 0,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Called Numbers Table
CREATE TABLE IF NOT EXISTS public.called_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    number INT NOT NULL CHECK (number >= 1 AND number <= 25),
    called_by UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    called_by_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_number_per_game UNIQUE (game_id, number)
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_games_room_code ON public.games(room_code);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON public.players(game_id);
CREATE INDEX IF NOT EXISTS idx_called_numbers_game_id ON public.called_numbers(game_id);

-- Enable Supabase Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.called_numbers;

-- 5. Row Level Security (RLS)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.called_numbers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads for active games
CREATE POLICY "Allow public read on games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Allow public insert on games" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on games" ON public.games FOR UPDATE USING (true);

CREATE POLICY "Allow public read on players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public insert on players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on players" ON public.players FOR DELETE USING (true);

CREATE POLICY "Allow public read on called_numbers" ON public.called_numbers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on called_numbers" ON public.called_numbers FOR INSERT WITH CHECK (true);

-- 6. Helper Function: Count completed lines for a board given a list of called numbers
CREATE OR REPLACE FUNCTION public.calculate_board_lines(p_board JSONB, p_called_numbers INT[])
RETURNS INT AS $$
DECLARE
    v_lines INT := 0;
    v_b INT[];
    i INT;
    v_called_set INT[];
BEGIN
    SELECT array_agg(x::INT) INTO v_b FROM jsonb_array_elements_text(p_board) AS x;
    IF array_length(v_b, 1) != 25 THEN
        RETURN 0;
    END IF;

    -- 5 Rows
    FOR i IN 0..4 LOOP
        IF v_b[i*5 + 1] = ANY(p_called_numbers) AND
           v_b[i*5 + 2] = ANY(p_called_numbers) AND
           v_b[i*5 + 3] = ANY(p_called_numbers) AND
           v_b[i*5 + 4] = ANY(p_called_numbers) AND
           v_b[i*5 + 5] = ANY(p_called_numbers) THEN
            v_lines := v_lines + 1;
        END IF;
    END LOOP;

    -- 5 Columns
    FOR i IN 1..5 LOOP
        IF v_b[i] = ANY(p_called_numbers) AND
           v_b[i + 5] = ANY(p_called_numbers) AND
           v_b[i + 10] = ANY(p_called_numbers) AND
           v_b[i + 15] = ANY(p_called_numbers) AND
           v_b[i + 20] = ANY(p_called_numbers) THEN
            v_lines := v_lines + 1;
        END IF;
    END LOOP;

    -- Main Diagonal: [0, 6, 12, 18, 24] -> indices 1, 7, 13, 19, 25 in 1-based SQL
    IF v_b[1] = ANY(p_called_numbers) AND
       v_b[7] = ANY(p_called_numbers) AND
       v_b[13] = ANY(p_called_numbers) AND
       v_b[19] = ANY(p_called_numbers) AND
       v_b[25] = ANY(p_called_numbers) THEN
        v_lines := v_lines + 1;
    END IF;

    -- Anti Diagonal: [4, 8, 12, 16, 20] -> indices 5, 9, 13, 17, 21 in 1-based SQL
    IF v_b[5] = ANY(p_called_numbers) AND
       v_b[9] = ANY(p_called_numbers) AND
       v_b[13] = ANY(p_called_numbers) AND
       v_b[17] = ANY(p_called_numbers) AND
       v_b[21] = ANY(p_called_numbers) THEN
        v_lines := v_lines + 1;
    END IF;

    RETURN v_lines;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. ATOMIC RPC: Call a Bingo number with Race Condition handling and Server-Side Winner Validation
CREATE OR REPLACE FUNCTION public.rpc_call_bingo_number(
    p_room_code VARCHAR,
    p_player_id UUID,
    p_number INT
)
RETURNS JSONB AS $$
DECLARE
    v_game RECORD;
    v_player RECORD;
    v_called_numbers INT[];
    v_p RECORD;
    v_lines INT;
    v_winner_id UUID := NULL;
    v_winner_name VARCHAR := NULL;
BEGIN
    -- Validate number range
    IF p_number < 1 OR p_number > 25 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Number must be between 1 and 25');
    END IF;

    -- Lock the game row for update to prevent concurrent race condition mutations
    SELECT * INTO v_game FROM public.games WHERE room_code = UPPER(p_room_code) FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Room not found');
    END IF;

    IF v_game.status != 'playing' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Game is not in playing state');
    END IF;

    IF v_game.winner_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Game has already concluded', 'winner_id', v_game.winner_id);
    END IF;

    -- Strict turn validation
    IF v_game.current_turn_player_id IS NOT NULL AND v_game.current_turn_player_id != p_player_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'It is not your turn to call a number');
    END IF;

    -- Get calling player
    SELECT * INTO v_player FROM public.players WHERE id = p_player_id AND game_id = v_game.id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found in this game');
    END IF;

    -- Insert called number atomically. If already called, returns duplicate error.
    BEGIN
        INSERT INTO public.called_numbers (game_id, number, called_by, called_by_name)
        VALUES (v_game.id, p_number, p_player_id, v_player.name);
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'Number has already been called');
    END;

    -- Retrieve all called numbers including the new one
    SELECT COALESCE(array_agg(number), ARRAY[]::INT[]) INTO v_called_numbers
    FROM public.called_numbers WHERE game_id = v_game.id;

    -- Recalculate completed lines for all players in this game
    FOR v_p IN SELECT * FROM public.players WHERE game_id = v_game.id FOR UPDATE LOOP
        v_lines := public.calculate_board_lines(v_p.board, v_called_numbers);
        
        UPDATE public.players SET completed_lines = v_lines WHERE id = v_p.id;

        -- First player reaching >= 5 lines becomes the winner
        IF v_lines >= 5 AND v_winner_id IS NULL THEN
            v_winner_id := v_p.id;
            v_winner_name := v_p.name;
        END IF;
    END LOOP;

    -- If there is a winner, update game status atomically
    IF v_winner_id IS NOT NULL THEN
        UPDATE public.games
        SET winner_id = v_winner_id,
            winner_name = v_winner_name,
            status = 'finished',
            finished_at = NOW()
        WHERE id = v_game.id;
    ELSE
        -- Rotate turn to next player in turn_order
        IF v_game.turn_order IS NOT NULL AND array_length(v_game.turn_order, 1) > 1 THEN
            DECLARE
                v_idx INT;
                v_next_idx INT;
            BEGIN
                FOR v_idx IN 1..array_length(v_game.turn_order, 1) LOOP
                    IF v_game.turn_order[v_idx] = p_player_id THEN
                        v_next_idx := (v_idx % array_length(v_game.turn_order, 1)) + 1;
                        UPDATE public.games SET current_turn_player_id = v_game.turn_order[v_next_idx] WHERE id = v_game.id;
                        EXIT;
                    END IF;
                END LOOP;
            END;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'number', p_number,
        'called_by', p_player_id,
        'called_by_name', v_player.name,
        'winner_id', v_winner_id,
        'winner_name', v_winner_name,
        'game_status', CASE WHEN v_winner_id IS NOT NULL THEN 'finished' ELSE 'playing' END
    );
END;
$$ LANGUAGE plpgsql;
