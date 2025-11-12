import { useState, useEffect } from 'react';
import { Plus, Briefcase, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { Job } from '../types';
import { JobForm } from './JobForm';

export function JobsView() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { jobs, setJobs, setCurrentJob } = useStore();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await api.getJobs();
      if (response.success) {
        setJobs(response.jobs);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = () => {
    setShowForm(false);
    loadJobs();
  };

  const handleSelectJob = (job: Job) => {
    setCurrentJob(job);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Job Descriptions</h2>
          <p className="mt-2 text-gray-600">
            Manage job descriptions and requirements
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Job
        </button>
      </div>

      {showForm && (
        <JobForm onSuccess={handleJobCreated} onCancel={() => setShowForm(false)} />
      )}

      {jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Briefcase className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No jobs yet
          </h3>
          <p className="mt-2 text-gray-600">
            Create your first job description to start screening candidates
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleSelectJob(job)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {job.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {job.parsed_data.location || 'Remote'}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    job.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {job.status}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Required Skills
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.parsed_data.required_skills.slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.parsed_data.required_skills.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{job.parsed_data.required_skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Experience Required
                  </p>
                  <p className="text-sm text-gray-900">
                    {job.parsed_data.min_experience_years}+ years
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Created {new Date(job.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
