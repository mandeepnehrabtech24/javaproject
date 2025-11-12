import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Award, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { Analytics } from '../types';

export function AnalyticsView() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentJob } = useStore();

  useEffect(() => {
    if (currentJob) {
      loadAnalytics();
    }
  }, [currentJob]);

  const loadAnalytics = async () => {
    if (!currentJob) return;

    setLoading(true);
    try {
      const response = await api.getAnalytics(currentJob.id);
      if (response.success) {
        setAnalytics(response.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentJob) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Analytics</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No job selected
          </h3>
          <p className="mt-2 text-gray-600">
            Select a job from the Jobs page to view analytics
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Analytics</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  const scoreDistributionData = [
    { name: 'Excellent (80+)', value: analytics.score_distribution.excellent, color: '#10b981' },
    { name: 'Good (60-79)', value: analytics.score_distribution.good, color: '#3b82f6' },
    { name: 'Average (40-59)', value: analytics.score_distribution.average, color: '#f59e0b' },
    { name: 'Poor (<40)', value: analytics.score_distribution.poor, color: '#ef4444' },
  ];

  const statusData = [
    { name: 'Shortlisted', value: analytics.status_breakdown.shortlisted, color: '#10b981' },
    { name: 'Maybe', value: analytics.status_breakdown.maybe, color: '#f59e0b' },
    { name: 'Rejected', value: analytics.status_breakdown.rejected, color: '#ef4444' },
    { name: 'Pending', value: analytics.status_breakdown.pending, color: '#6b7280' },
  ];

  const missingSkillsData = Object.entries(analytics.missing_skills_frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Analytics</h2>
        <p className="mt-2 text-gray-600">
          Screening insights for {currentJob.title}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Candidates</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics.total_candidates}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics.average_score.toFixed(1)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Shortlisted</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics.status_breakdown.shortlisted}
              </p>
            </div>
            <Award className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Red Flags</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics.red_flags_summary.job_hopping +
                  analytics.red_flags_summary.career_gap +
                  analytics.red_flags_summary.incomplete_contact}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scoreDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {scoreDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recruiter Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {missingSkillsData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Missing Skills
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={missingSkillsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Red Flags Summary
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {analytics.red_flags_summary.job_hopping}
            </p>
            <p className="text-sm text-gray-600">Job Hopping</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {analytics.red_flags_summary.career_gap}
            </p>
            <p className="text-sm text-gray-600">Career Gaps</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {analytics.red_flags_summary.incomplete_contact}
            </p>
            <p className="text-sm text-gray-600">Incomplete Contact</p>
          </div>
        </div>
      </div>
    </div>
  );
}
