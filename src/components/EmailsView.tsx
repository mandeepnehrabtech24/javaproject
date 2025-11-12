import { useState } from 'react';
import { Mail, Send, Loader2, Copy, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';

export function EmailsView() {
  const [templateType, setTemplateType] = useState<'shortlisted' | 'rejected' | 'assessment_request'>('shortlisted');
  const [generating, setGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { selectedCandidates, currentJob, candidates } = useStore();

  const handleGenerateEmails = async () => {
    if (!currentJob || selectedCandidates.length === 0) return;

    setGenerating(true);
    try {
      if (selectedCandidates.length === 1) {
        const response = await api.generateEmail(
          selectedCandidates[0],
          currentJob.id,
          templateType
        );

        if (response.success) {
          setGeneratedTemplate({
            subject: response.template.subject,
            body: response.template.body,
          });
        }
      } else {
        const response = await api.generateBulkEmails(
          selectedCandidates,
          currentJob.id,
          templateType
        );

        if (response.success) {
          setGeneratedTemplate({
            subject: response.templates[0]?.subject || '',
            body: `${response.count} emails generated successfully`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate emails:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyTemplate = () => {
    if (generatedTemplate) {
      const fullTemplate = `Subject: ${generatedTemplate.subject}\n\n${generatedTemplate.body}`;
      navigator.clipboard.writeText(fullTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedCandidateDetails = candidates.filter((c) =>
    selectedCandidates.includes(c.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Email Templates</h2>
        <p className="mt-2 text-gray-600">
          Generate personalized emails for candidates
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Generate Email
        </h3>

        {!currentJob ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Please select a job from the Jobs page first
            </p>
          </div>
        ) : selectedCandidates.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              Please select candidates from the Candidates page
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Selected Candidates ({selectedCandidates.length})
              </p>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                {selectedCandidateDetails.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="text-sm text-gray-600 py-1"
                  >
                    {candidate.name} ({candidate.email})
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTemplateType('shortlisted')}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                    templateType === 'shortlisted'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-sm font-medium">Shortlisted</p>
                </button>
                <button
                  onClick={() => setTemplateType('rejected')}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                    templateType === 'rejected'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Mail className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-sm font-medium">Rejection</p>
                </button>
                <button
                  onClick={() => setTemplateType('assessment_request')}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                    templateType === 'assessment_request'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Send className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-sm font-medium">Assessment</p>
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerateEmails}
              disabled={generating}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Generate Email{selectedCandidates.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {generatedTemplate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Generated Email Template
            </h3>
            <button
              onClick={handleCopyTemplate}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-900">{generatedTemplate.subject}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body
              </label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {generatedTemplate.body}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              You can copy this template and paste it into your email client or ATS system.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Email Template Examples
        </h3>
        <div className="grid gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Shortlisted Email</h4>
            </div>
            <p className="text-sm text-gray-600">
              Congratulates the candidate and invites them to the next stage of the hiring process.
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-gray-900">Rejection Email</h4>
            </div>
            <p className="text-sm text-gray-600">
              Politely informs the candidate that they were not selected, with professional feedback.
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Send className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Assessment Request</h4>
            </div>
            <p className="text-sm text-gray-600">
              Requests the candidate to complete a technical assessment or coding challenge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
