import { useState, useEffect } from 'react';
import { matchService, Match } from '@/services/match.service';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await matchService.getAllMatches();
      setMatches(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  return { matches, loading, error, refetch: loadMatches };
}

export function useMyMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await matchService.getMyMatches();
      setMatches(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  return { matches, loading, error, refetch: loadMatches };
}

export function useMatch(id: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatch = async () => {
    try {
      setLoading(true);
      const data = await matchService.getMatchById(id);
      setMatch(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadMatch();
    }
  }, [id]);

  return { match, loading, error, refetch: loadMatch };
}
