import { useState, useEffect } from 'react';
import { Search, Play, Eye, EyeOff, Download, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { Candidate } from '../types';
import { CandidateDetails } from './CandidateDetails';

export function CandidatesView() {
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);

  const {
    candidates,
    setCandidates,
    currentJob,
    blindMode,
    setBlindMode,
    selectedCandidates,
    toggleCandidateSelection,
    clearSelectedCandidates,
    setScores,
  } = useStore();

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const response = await api.getCandidates({
        search: search || undefined,
        skills: skillFilter || undefined,
        location: locationFilter || undefined,
      });
      if (response.success) {
        setCandidates(response.candidates);
      }
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadCandidates();
  };

  const handleScoreCandidates = async () => {
    if (!currentJob || selectedCandidates.length === 0) return;

    setScoring(true);
    try {
      const response = await api.scoreBulk(
        selectedCandidates,
        currentJob.id,
        blindMode,
        `Screening ${new Date().toISOString()}`
      );

      if (response.success) {
        setScores(response.results.map((r: any) => r.score));
        clearSelectedCandidates();
      }
    } catch (error) {
      console.error('Scoring failed:', error);
    } finally {
      setScoring(false);
    }
  };

  const handleExportCSV = () => {
    const csvHeaders = ['Name', 'Email', 'Phone', 'Location', 'Skills', 'Experience Years'];
    const csvRows = candidates.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.location,
      c.parsed_data?.skills?.technical.join('; ') || '',
      c.parsed_data?.experience?.length || 0,
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (selectedCandidate) {
    return (
      <CandidateDetails
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Candidates</h2>
          <p className="mt-2 text-gray-600">{candidates.length} candidates in database</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setBlindMode(!blindMode)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              blindMode
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {blindMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Blind Mode {blindMode ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Name or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills
            </label>
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="e.g., React, Python"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="City or state"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </button>
        </div>
      </div>

      {selectedCandidates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-blue-900">
              {selectedCandidates.length} candidate{selectedCandidates.length > 1 ? 's' : ''} selected
            </p>
            <div className="flex space-x-3">
              <button
                onClick={clearSelectedCandidates}
                className="text-sm text-blue-700 hover:text-blue-800"
              >
                Clear Selection
              </button>
              {currentJob && (
                <button
                  onClick={handleScoreCandidates}
                  disabled={scoring}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center text-sm"
                >
                  {scoring ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scoring...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Score for {currentJob.title}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      useStore.setState({
                        selectedCandidates: candidates.map((c) => c.id),
                      });
                    } else {
                      clearSelectedCandidates();
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Top Skills
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Experience
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {candidates.map((candidate) => (
              <tr
                key={candidate.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(candidate.id)}
                    onChange={() => toggleCandidateSelection(candidate.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {blindMode ? 'Candidate ' + candidate.id.substring(0, 8) : candidate.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {blindMode ? 'masked@email.com' : candidate.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {blindMode ? '' : candidate.location}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {candidate.parsed_data?.skills?.technical.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {candidate.parsed_data?.experience?.length || 0} positions
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => setSelectedCandidate(candidate)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
