import { useState, useEffect } from 'react';
import { tournamentService, Tournament } from '@/services/tournament.service';

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await tournamentService.getAllTournaments();
      setTournaments(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  return { tournaments, loading, error, refetch: loadTournaments };
}

export function useTournament(id: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTournament = async () => {
    try {
      setLoading(true);
      const data = await tournamentService.getTournamentById(id);
      setTournament(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadTournament();
    }
  }, [id]);

  return { tournament, loading, error, refetch: loadTournament };
}
