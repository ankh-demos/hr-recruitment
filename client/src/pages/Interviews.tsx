import { useEffect, useState } from 'react';
import { interviewsApi, candidatesApi, jobsApi } from '../services/api';
import { Interview, Candidate, Job } from '../types';

export function Interviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [formData, setFormData] = useState({
    candidateId: '',
    jobId: '',
    scheduledAt: '',
    duration: '60',
    type: 'video' as Interview['type'],
    interviewers: '',
    status: 'scheduled' as Interview['status'],
    feedback: '',
    rating: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [interviewsData, candidatesData, jobsData] = await Promise.all([
        interviewsApi.getAll(),
        candidatesApi.getAll(),
        jobsApi.getAll()
      ]);
      setInterviews(interviewsData);
      setCandidates(candidatesData);
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      candidateId: '',
      jobId: '',
      scheduledAt: '',
      duration: '60',
      type: 'video',
      interviewers: '',
      status: 'scheduled',
      feedback: '',
      rating: ''
    });
    setEditingInterview(null);
    setShowForm(false);
  }

  function handleEdit(interview: Interview) {
    setFormData({
      candidateId: interview.candidateId,
      jobId: interview.jobId,
      scheduledAt: interview.scheduledAt.slice(0, 16),
      duration: interview.duration.toString(),
      type: interview.type,
      interviewers: interview.interviewers.join(', '),
      status: interview.status,
      feedback: interview.feedback || '',
      rating: interview.rating?.toString() || ''
    });
    setEditingInterview(interview);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const interviewData = {
        candidateId: formData.candidateId,
        jobId: formData.jobId,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        duration: parseInt(formData.duration),
        type: formData.type,
        interviewers: formData.interviewers.split(',').map(i => i.trim()).filter(Boolean),
        status: formData.status,
        feedback: formData.feedback || undefined,
        rating: formData.rating ? parseInt(formData.rating) : undefined
      };

      if (editingInterview) {
        await interviewsApi.update(editingInterview.id, interviewData);
      } else {
        await interviewsApi.create(interviewData);
      }
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save interview:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this interview?')) return;
    try {
      await interviewsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete interview:', error);
    }
  }

  function getCandidateName(id: string) {
    const candidate = candidates.find(c => c.id === id);
    return candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown';
  }

  function getJobTitle(id: string) {
    const job = jobs.find(j => j.id === id);
    return job ? job.title : 'Unknown';
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Schedule Interview
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">{editingInterview ? 'Edit Interview' : 'Schedule Interview'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Candidate</label>
                <select
                  value={formData.candidateId}
                  onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select candidate</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Job</label>
                <select
                  value={formData.jobId}
                  onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select job</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  min="15"
                  step="15"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Interview['type'] })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="phone">Phone</option>
                  <option value="video">Video</option>
                  <option value="onsite">Onsite</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Interview['status'] })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Interviewers (comma-separated)</label>
              <input
                type="text"
                value={formData.interviewers}
                onChange={(e) => setFormData({ ...formData, interviewers: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="e.g., John Smith, Jane Doe"
              />
            </div>
            {editingInterview && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Feedback</label>
                  <textarea
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating (1-5)</label>
                  <input
                    type="number"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    min="1"
                    max="5"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                {editingInterview ? 'Update' : 'Schedule'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {interviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No interviews scheduled</td>
              </tr>
            ) : (
              interviews.map((interview) => (
                <tr key={interview.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getCandidateName(interview.candidateId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getJobTitle(interview.jobId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(interview.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{interview.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                      interview.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {interview.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(interview)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(interview.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
