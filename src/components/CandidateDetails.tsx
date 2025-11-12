import { useEffect, useState } from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Briefcase,
  GraduationCap,
  Award,
  Star,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Candidate, CandidateScore } from '../types';
import { api } from '../lib/api';

interface CandidateDetailsProps {
  candidate: Candidate;
  onClose: () => void;
}

export function CandidateDetails({ candidate, onClose }: CandidateDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [selectedScore, setSelectedScore] = useState<CandidateScore | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'shortlisted' | 'rejected' | 'maybe' | 'pending'>('pending');

  useEffect(() => {
    loadCandidateScores();
  }, [candidate.id]);

  const loadCandidateScores = async () => {
    setLoading(true);
    try {
      const response = await api.getCandidate(candidate.id);
      if (response.success) {
        if (response.scores.length > 0) {
          setSelectedScore(response.scores[0]);
          setNotes(response.scores[0].recruiter_notes || '');
          setStatus(response.scores[0].recruiter_status);
        }
      }
    } catch (error) {
      console.error('Failed to load scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: typeof status) => {
    if (!selectedScore) return;

    try {
      await api.updateCandidateScore(candidate.id, selectedScore.id, {
        recruiter_status: newStatus,
        recruiter_notes: notes,
      });
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'high') return 'text-red-600 bg-red-50';
    if (severity === 'medium') return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{candidate.name}</h2>
          <div className="mt-2 space-y-1">
            {candidate.email && (
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {candidate.email}
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {candidate.phone}
              </div>
            )}
            {candidate.location && (
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {candidate.location}
              </div>
            )}
          </div>
          {candidate.parsed_data?.links && (
            <div className="mt-2 flex space-x-3">
              {candidate.parsed_data.links.linkedin && (
                <a
                  href={candidate.parsed_data.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {candidate.parsed_data.links.github && (
                <a
                  href={candidate.parsed_data.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-gray-900"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : selectedScore ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                AI Scoring Results
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Overall Score
                  </span>
                  <span
                    className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(
                      selectedScore.total_score
                    )}`}
                  >
                    {selectedScore.total_score}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Required Skills</span>
                      <span className="font-medium">
                        {selectedScore.score_breakdown.required_skills.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${selectedScore.score_breakdown.required_skills}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Experience</span>
                      <span className="font-medium">
                        {selectedScore.score_breakdown.experience.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${selectedScore.score_breakdown.experience}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Good-to-Have Skills</span>
                      <span className="font-medium">
                        {selectedScore.score_breakdown.good_to_have_skills.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${selectedScore.score_breakdown.good_to_have_skills}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Education</span>
                      <span className="font-medium">
                        {selectedScore.score_breakdown.education.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{
                          width: `${selectedScore.score_breakdown.education}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Projects</span>
                      <span className="font-medium">
                        {selectedScore.score_breakdown.projects.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-pink-600 h-2 rounded-full"
                        style={{
                          width: `${selectedScore.score_breakdown.projects}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    AI Explanation
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedScore.ai_explanation}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    ATS Score
                  </h4>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {selectedScore.ats_score}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">/ 100</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedScore.missing_skills && selectedScore.missing_skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Missing Skills
                </h3>
                <div className="space-y-2">
                  {selectedScore.missing_skills.map((ms, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ms.skill}</p>
                        <p className="text-xs text-gray-600">{ms.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedScore.red_flags && selectedScore.red_flags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Red Flags
                </h3>
                <div className="space-y-2">
                  {selectedScore.red_flags.map((rf, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${getSeverityColor(rf.severity)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{rf.type.replace('_', ' ')}</p>
                          <p className="text-xs mt-1">{rf.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recruiter Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleUpdateStatus('shortlisted')}
                  className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    status === 'shortlisted'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Shortlist
                </button>
                <button
                  onClick={() => handleUpdateStatus('maybe')}
                  className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    status === 'maybe'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Maybe
                </button>
                <button
                  onClick={() => handleUpdateStatus('rejected')}
                  className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    status === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={4}
                  placeholder="Add your notes here..."
                />
                <button
                  onClick={() => {
                    if (selectedScore) {
                      api.updateCandidateScore(candidate.id, selectedScore.id, {
                        recruiter_notes: notes,
                      });
                    }
                  }}
                  className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            No scoring data available for this candidate. Score them against a job to see results.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {candidate.parsed_data?.skills && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Skills
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Technical</h4>
                <div className="flex flex-wrap gap-2">
                  {candidate.parsed_data.skills.technical.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              {candidate.parsed_data.skills.soft.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Soft Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.parsed_data.skills.soft.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {candidate.parsed_data?.experience && candidate.parsed_data.experience.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Experience
            </h3>
            <div className="space-y-4">
              {candidate.parsed_data.experience.map((exp, idx) => (
                <div key={idx} className="border-l-2 border-blue-500 pl-4">
                  <h4 className="text-sm font-semibold text-gray-900">{exp.title}</h4>
                  <p className="text-sm text-gray-600">{exp.company}</p>
                  <p className="text-xs text-gray-500">
                    {exp.start} - {exp.end || 'Present'}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {candidate.parsed_data?.education && candidate.parsed_data.education.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2" />
              Education
            </h3>
            <div className="space-y-4">
              {candidate.parsed_data.education.map((edu, idx) => (
                <div key={idx}>
                  <h4 className="text-sm font-semibold text-gray-900">{edu.degree}</h4>
                  <p className="text-sm text-gray-600">{edu.institution}</p>
                  {edu.field && <p className="text-sm text-gray-600">{edu.field}</p>}
                  <p className="text-xs text-gray-500">
                    {edu.start} - {edu.end}
                  </p>
                  {edu.gpa && <p className="text-xs text-gray-500">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {candidate.parsed_data?.certifications && candidate.parsed_data.certifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Certifications
            </h3>
            <ul className="space-y-2">
              {candidate.parsed_data.certifications.map((cert, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                  {cert}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
