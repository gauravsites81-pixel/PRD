'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import type { GolfScore } from '@/types/database';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

type Props = {
  userId: string;
  initialScores: GolfScore[];
  disabled?: boolean;
};

type EditingScore = {
  id: string;
  score: number;
  date: string;
};

export function ScoreManager({
  userId,
  initialScores,
  disabled = false,
}: Props) {
  const supabase = createBrowserSupabaseClient();

  const [score, setScore] = useState('');
  const [date, setDate] = useState('');
  const [scores, setScores] = useState<GolfScore[]>(initialScores);
  const [editingScore, setEditingScore] = useState<EditingScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 🔧 Convert dd-mm-yyyy → yyyy-mm-dd
  function formatDateForDB(input: string) {
    const [day, month, year] = input.split('-');
    return `${year}-${month}-${day}`;
  }

  async function handleAddScore() {
    setMessage('');

    if (disabled) {
      setMessage('You need a subscription to add scores');
      return;
    }

    if (!score || !date) {
      setMessage('Please fill all fields');
      return;
    }

    if (Number(score) < 1 || Number(score) > 45) {
      setMessage('Score must be between 1 and 45');
      return;
    }

    // Check if score already exists for this date
    const existingScore = scores.find(s => s.date === formatDateForDB(date));
    if (existingScore) {
      setMessage('Score for this date already exists');
      return;
    }

    setLoading(true);

    try {
      const formattedDate = formatDateForDB(date);

      const { data, error } = await supabase
        .from('golf_scores')
        .insert({
          user_id: userId,
          score: Number(score),
          date: formattedDate,
        })
        .select()
        .single();

      if (error) {
        console.error(error);

        if (error.message.includes('duplicate')) {
          setMessage('Score for this date already exists');
        } else {
          setMessage(error.message);
        }

        return;
      }

      // Add new score and maintain max 5
      const newScores = [data, ...scores].slice(0, 5);
      setScores(newScores);

      setScore('');
      setDate('');
      setMessage('Score added successfully');

    } catch (err) {
      console.error(err);
      setMessage('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleEditScore(scoreId: string, newScore: number, newDate: string) {
    setMessage('');
    setLoading(true);

    try {
      const formattedDate = formatDateForDB(newDate);
      const { data, error } = await supabase
        .from('golf_scores')
        .update({
          score: newScore,
          date: formattedDate,
        })
        .eq('id', scoreId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        setMessage('Failed to update score');
        return;
      }

      // Update local state
      setScores(scores.map(s => 
        s.id === scoreId ? { ...s, score: newScore, date: newDate } : s
      ));
      
      setEditingScore(null);
      setMessage('Score updated successfully');
    } catch (err) {
      console.error(err);
      setMessage('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteScore(scoreId: string) {
    if (!confirm('Are you sure you want to delete this score?')) {
      return;
    }

    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase
        .from('golf_scores')
        .delete()
        .eq('id', scoreId)
        .eq('user_id', userId);

      if (error) {
        setMessage('Failed to delete score');
        return;
      }

      // Remove from local state
      setScores(scores.filter(s => s.id !== scoreId));
      setMessage('Score deleted successfully');
    } catch (err) {
      console.error(err);
      setMessage('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(score: GolfScore) {
    setEditingScore({
      id: score.id,
      score: score.score || 0,
      date: score.date,
    });
    setScore((score.score || 0).toString());
    setDate(score.date);
  }

  function cancelEdit() {
    setEditingScore(null);
    setScore('');
    setDate('');
  }

  return (
    <section className="mt-8 grid gap-6 md:grid-cols-2">
      {/* LEFT - ADD SCORE */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <p className="text-sm font-bold text-emerald-700">Add score</p>

        <h2 className="text-2xl font-extrabold mt-2">
          Stableford score
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Enter score (1–45). One score per date.
        </p>

        <input
          type="number"
          placeholder="Score"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          disabled={disabled}
          className="mt-4 w-full border rounded-md p-3 disabled:bg-gray-100"
        />

        <input
          type="text"
          placeholder="dd-mm-yyyy"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={disabled}
          className="mt-3 w-full border rounded-md p-3 disabled:bg-gray-100"
        />

        <Button
          onClick={handleAddScore}
          disabled={disabled || loading}
          loading={loading}
          variant="primary"
          size="md"
        >
          {loading ? 'Adding...' : 'Add score'}
        </Button>

        {/* MESSAGE */}
        {message && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            message.includes('success') 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* LOCK MESSAGE */}
        {disabled && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">🔒 Subscribe to add scores</p>
          </div>
        )}
      </div>

      {/* RIGHT - SCORE LIST */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-2xl font-extrabold">
          Your scores ({scores.length}/5)
        </h2>

        {scores.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No scores yet</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {scores.map((s) => (
              <li
                key={s.id}
                className="flex justify-between items-center border-b pb-2 text-sm"
              >
                {editingScore?.id === s.id ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="number"
                      value={editingScore.score}
                      onChange={(e) => setEditingScore({...editingScore, score: Number(e.target.value)})}
                      className="border rounded px-2 py-1 w-20"
                      min="1"
                      max="45"
                    />
                    <input
                      type="text"
                      value={editingScore.date}
                      onChange={(e) => setEditingScore({...editingScore, date: e.target.value})}
                      className="border rounded px-2 py-1 w-28"
                      placeholder="dd-mm-yyyy"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => handleEditScore(editingScore.id, editingScore.score, editingScore.date)}
                        variant="success"
                        size="sm"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={cancelEdit}
                        variant="secondary"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{s.score}</span>
                      <span className="text-gray-500">{s.date}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEdit(s)}
                        variant="secondary"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteScore(s.id)}
                        variant="danger"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}