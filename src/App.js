import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ALL_ITEMS = [
  "Stave Church",
  "Red Wooden Houses",
  "Fjord",
  "Northern Lights",
  "Troll Statue",
  "Viking Ship",
  "Snowy Mountains",
  "Fishing Village",
  "Waterfall",
  "Bergen Wharf",
  "People in Ski outfits",
  "Red houses",
  "Ear muffs",
  "Norwegian Flag",
  "Lighthouse",
  "Harbor",
  "New Island",
  "Ferry Boat",
  "Rocky Coastline",
  "Traditional Sweater",
  "Kayaking",
  "People swimming",
  "Christmas decorations",
  "Salmon",
  "Big Mountain Dogs",
  "Opera House",
  "Massive Church",
  "Trams",
  "Cable car"
];

function generateRandomBoard() {
  const shuffled = [...ALL_ITEMS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 24);
}

export default function App() {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [board, setBoard] = useState([]);
  const [marked, setMarked] = useState(Array(24).fill(false));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("norwayBingoUser");
    if (savedUser) login(savedUser);
    else setLoading(false);
  }, []);

  const login = async (name) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("norway_bingo_progress")
        .select("*")
        .eq("username", name)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setBoard(data.board);
        setMarked(data.marked);
      } else {
        const newBoard = generateRandomBoard();

        await supabase.from("norway_bingo_progress").insert({
          username: name,
          marked: Array(24).fill(false),
          board: newBoard
        });

        setBoard(newBoard);
      }

      setUser(name);
      localStorage.setItem("norwayBingoUser", name);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSquare = async (index) => {
    if (saving) return;

    const newMarked = [...marked];
    newMarked[index] = !newMarked[index];
    setMarked(newMarked);

    try {
      setSaving(true);

      await supabase
        .from("norway_bingo_progress")
        .update({ marked: newMarked })
        .eq("username", user);
    } catch {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("norwayBingoUser");
    setUser(null);
    setUsername("");
  };

  if (loading) return <div className="center">Loading...</div>;

  if (!user) {
    return (
      <div className="login-container">
        <div className="card">
          <h1>🇳🇴 Norway Bingo</h1>
          <p>Explore Norway, mark what you've seen!</p>
          <input
            placeholder="Choose username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={() => login(username)} disabled={!username}>
            Start
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <h2>🇳🇴 {user}'s Board</h2>
        <button className="logout" onClick={logout}>
          Logout
        </button>
      </header>

      {saving && <div className="saving">Saving...</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="grid">
        {board.map((item, i) => (
          <div
            key={i}
            className={`tile ${marked[i] ? "marked" : ""}`}
            onClick={() => toggleSquare(i)}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}