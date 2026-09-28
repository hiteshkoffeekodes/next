# 🎯 BINGO LIVE — Real-Time Multiplayer Web Game

A modern, production-grade real-time multiplayer Bingo web game built with **Next.js**, **React**, **TypeScript**, **Tailwind CSS**, and **Supabase** (with an integrated zero-config local real-time fallback engine).

---

## 🌟 Game Highlights

- **Multiplayer Room Architecture**: Host creates a room with a 6-character room code (e.g. `AB7K92`). Friends join from any browser or device.
- **Independently Randomized Boards**: Every player receives their own uniquely shuffled 5×5 board containing numbers 1–25.
- **Turn-Based Calling (One Click Per Player Per Turn)**: Players take turns calling numbers sequentially. Only the active player can click a number on their turn; once clicked, the turn automatically advances to the next player. Out-of-turn clicks are strictly prevented.
- **Synchronized Global Calling**: When the active player selects a number on their board, it is instantly called globally and marked across all connected players' screens.
- **12-Line Bingo Detection**: Automatically detects complete horizontal rows (5), columns (5), main diagonal, and anti-diagonal.
- **B-I-N-G-O Letter Progress**:
  - 1 line complete: `✕ I N G O`
  - 2 lines complete: `✕ ✕ N G O`
  - 3 lines complete: `✕ ✕ ✕ G O`
  - 4 lines complete: `✕ ✕ ✕ ✕ O`
  - 5 lines complete: `✕ ✕ ✕ ✕ ✕` → **WINNER!**
- **Server-Side Atomic Winner Validation**: Race conditions are prevented; duplicate numbers are rejected; winner is verified server-side.
- **Reconnection Support**: If a player refreshes their browser, their player identity, unique board, called numbers, and line progress are immediately restored without restarting the game.
- **Celebration Modal & Play Again**: Confetti animations (`canvas-confetti`), synthesized procedural audio (Web Audio API), and seamless Play Again round resets with newly shuffled boards.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **UI & Components**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend / Database**: Supabase PostgreSQL with Row Level Security (RLS) and stored procedure (`rpc_call_bingo_number`)
- **Real-Time Engine**: Supabase Realtime Channels + native Server-Sent Events (SSE) stream (`/api/rooms/[roomCode]/events`)
- **Testing**: Vitest (`npm test`)

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional privileged server key (never exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> **Note**: If Supabase variables are left empty, the application automatically runs in zero-setup Local Development mode with full multi-browser real-time synchronization, so you can test immediately!

---

## 🗄️ Supabase Configuration & Database Migration

To run with your remote Supabase project:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in the Supabase dashboard.
3. Paste the contents of [`supabase/schema.sql`](file:///Users/banna/Documents/bingo/supabase/schema.sql) and click **Run**.
4. The script creates:
   - `games` table with room codes and game statuses.
   - `players` table with individual randomized `board` arrays.
   - `called_numbers` table with `UNIQUE(game_id, number)` to enforce duplicate prevention.
   - `calculate_board_lines()` PostgreSQL function.
   - `rpc_call_bingo_number()` atomic stored procedure.
   - Realtime publication on all tables.
   - Row Level Security (RLS) policies.
5. In your Supabase Project Settings, copy the **Project URL** and **anon public key** into `.env.local`.

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Tests
```bash
npm test
```
All 13 unit tests verify board generation (Fisher-Yates 1-25), duplicate checking, row/column/diagonal completion, B-I-N-G-O letter progression, and winner thresholds.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Multi-Browser Manual Testing Checklist

Open multiple browser windows or private/incognito tabs:

### Step 1: Host Creates Game (Browser 1)
1. Open `http://localhost:3000`.
2. Click **Create Game**.
3. Enter Player Name: `Hitesh`.
4. Click **Create Room**.
5. Copy the 6-character room code displayed in the lobby (e.g. `AB7K92`).

### Step 2: Players Join (Browser 2 & Browser 3)
1. In Browser 2 (or Incognito window), go to `http://localhost:3000/join`.
2. Enter Name: `Rahul`, Room Code: `AB7K92`, click **Join Game**.
3. In Browser 3, go to `http://localhost:3000/join`.
4. Enter Name: `Jay`, Room Code: `AB7K92`, click **Join Game**.
5. Verify: All 3 browsers immediately update their lobby player list in real-time showing:
   - 🟢 Hitesh (Host Crown)
   - 🟢 Rahul
   - 🟢 Jay

### Step 3: Start the Game
1. In Browser 1 (Host), click **Start Game**.
2. All 3 browsers simultaneously transition to the active 5×5 Bingo Board!
3. **Verify Boards**: Compare Browser 1, Browser 2, and Browser 3. Notice that all numbers are between 1 and 25, but every player has a different arrangement!

### Step 4: Call Numbers
1. In Browser 1, click number `17` on Hitesh's board.
2. **Observe**:
   - Number 17 glows with an amber highlight and "LAST" badge on all 3 screens.
   - In Browser 1, 17 is marked where it is on Hitesh's board.
   - In Browser 2, 17 is marked where it is on Rahul's board.
   - In Browser 3, 17 is marked where it is on Jay's board.
   - The cell is disabled from being clicked again.
   - The "Called Numbers" panel and tracker update in real-time.

### Step 5: Complete Lines & Win Game
1. Call numbers that complete rows or diagonals for one of the players.
2. Watch the `B I N G O` letters cross off:
   - 1 line: `✕ I N G O`
   - 2 lines: `✕ ✕ N G O`
   - 3 lines: `✕ ✕ ✕ G O`
   - 4 lines: `✕ ✕ ✕ ✕ O`
   - 5 lines: `✕ ✕ ✕ ✕ ✕`
3. When any player hits 5 lines, the **Celebration Winner Modal** triggers for all players with confetti and sounds!
4. Clicking **Play Again** resets the room with brand new randomized boards for another round.
