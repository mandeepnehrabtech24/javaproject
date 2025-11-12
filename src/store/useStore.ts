import { create } from 'zustand';
import { Candidate, Job, CandidateScore, ScreeningSession } from '../types';

interface Store {
  candidates: Candidate[];
  jobs: Job[];
  currentJob: Job | null;
  currentSession: ScreeningSession | null;
  scores: CandidateScore[];
  blindMode: boolean;
  selectedCandidates: string[];

  setCandidates: (candidates: Candidate[]) => void;
  addCandidate: (candidate: Candidate) => void;
  setJobs: (jobs: Job[]) => void;
  setCurrentJob: (job: Job | null) => void;
  setCurrentSession: (session: ScreeningSession | null) => void;
  setScores: (scores: CandidateScore[]) => void;
  setBlindMode: (enabled: boolean) => void;
  setSelectedCandidates: (ids: string[]) => void;
  toggleCandidateSelection: (id: string) => void;
  clearSelectedCandidates: () => void;
}

export const useStore = create<Store>((set) => ({
  candidates: [],
  jobs: [],
  currentJob: null,
  currentSession: null,
  scores: [],
  blindMode: false,
  selectedCandidates: [],

  setCandidates: (candidates) => set({ candidates }),
  addCandidate: (candidate) => set((state) => ({
    candidates: [...state.candidates, candidate]
  })),
  setJobs: (jobs) => set({ jobs }),
  setCurrentJob: (job) => set({ currentJob: job }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setScores: (scores) => set({ scores }),
  setBlindMode: (enabled) => set({ blindMode: enabled }),
  setSelectedCandidates: (ids) => set({ selectedCandidates: ids }),
  toggleCandidateSelection: (id) => set((state) => ({
    selectedCandidates: state.selectedCandidates.includes(id)
      ? state.selectedCandidates.filter((cid) => cid !== id)
      : [...state.selectedCandidates, id],
  })),
  clearSelectedCandidates: () => set({ selectedCandidates: [] }),
}));
