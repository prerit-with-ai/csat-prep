"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Topic = {
  id: string;
  name: string;
  slug: string;
  section: string;
};

type MockType = 'topic' | 'section' | 'full';

export default function MockSelectionPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [selectedMockType, setSelectedMockType] = useState<MockType>('topic');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('rc');

  const [creatingMock, setCreatingMock] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch('/api/topics');
        if (!res.ok) throw new Error('Failed to fetch topics');
        const data = await res.json();
        setTopics(data.topics || []);
        if (data.topics?.length > 0) {
          setSelectedTopicId(data.topics[0].id);
        }
      } catch (error) {
        setTopicsError(error instanceof Error ? error.message : 'Failed to fetch topics');
      } finally {
        setLoadingTopics(false);
      }
    }
    fetchTopics();
  }, []);

  const handleStartMock = async () => {
    setCreatingMock(true);
    setCreateError(null);

    try {
      const body: {
        type: string;
        topicId?: string;
        section?: string;
      } = { type: selectedMockType };

      if (selectedMockType === 'topic') {
        if (!selectedTopicId) {
          throw new Error('Please select a topic');
        }
        body.topicId = selectedTopicId;
      } else if (selectedMockType === 'section') {
        body.section = selectedSection;
      }

      const res = await fetch('/api/mock/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to create mock');
      }

      const data = await res.json();
      router.push(`/mock/${data.mockId}`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create mock');
      setCreatingMock(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-[24px] font-semibold mb-2">Start a Mock Test</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Choose a mock type and test your preparation
          </p>
        </div>

        {/* Mock Type Cards */}
        <div className="space-y-4">
          {/* Topic Mini-Mock */}
          <div
            className={`border rounded-xl p-5 transition-colors cursor-pointer ${
              selectedMockType === 'topic'
                ? 'border-[var(--text-primary)] bg-[var(--bg-secondary)]'
                : 'border-[var(--border-default)] hover:border-[var(--border-subtle)]'
            }`}
            onClick={() => setSelectedMockType('topic')}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-[18px] font-semibold mb-1">Topic Mini-Mock</h2>
                <p className="text-[13px] text-[var(--text-secondary)]">
                  10 questions • 15 minutes
                </p>
              </div>
              <input
                type="radio"
                checked={selectedMockType === 'topic'}
                onChange={() => setSelectedMockType('topic')}
                className="mt-1"
              />
            </div>

            {selectedMockType === 'topic' && (
              <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                <label className="block text-[13px] font-medium mb-2">Select Topic</label>
                {loadingTopics ? (
                  <div className="text-[13px] text-[var(--text-secondary)]">
                    Loading topics...
                  </div>
                ) : topicsError ? (
                  <div className="text-[13px] text-[var(--color-wrong)]">
                    {topicsError}
                  </div>
                ) : topics.length === 0 ? (
                  <div className="text-[13px] text-[var(--text-secondary)]">
                    No topics available
                  </div>
                ) : (
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-4 py-2 text-[15px] bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg focus:outline-none focus:border-[var(--text-primary)]"
                  >
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Section Mock */}
          <div
            className={`border rounded-xl p-5 transition-colors cursor-pointer ${
              selectedMockType === 'section'
                ? 'border-[var(--text-primary)] bg-[var(--bg-secondary)]'
                : 'border-[var(--border-default)] hover:border-[var(--border-subtle)]'
            }`}
            onClick={() => setSelectedMockType('section')}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-[18px] font-semibold mb-1">Section Mock</h2>
                <p className="text-[13px] text-[var(--text-secondary)]">
                  30 questions • 40 minutes
                </p>
              </div>
              <input
                type="radio"
                checked={selectedMockType === 'section'}
                onChange={() => setSelectedMockType('section')}
                className="mt-1"
              />
            </div>

            {selectedMockType === 'section' && (
              <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                <label className="block text-[13px] font-medium mb-3">Select Section</label>
                <div className="space-y-2">
                  {[
                    { value: 'rc', label: 'Reading Comprehension' },
                    { value: 'lr', label: 'Logical Reasoning' },
                    { value: 'math', label: 'Mathematics' },
                  ].map((section) => (
                    <label
                      key={section.value}
                      className="flex items-center gap-3 p-3 border border-[var(--border-default)] rounded-lg cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <input
                        type="radio"
                        name="section"
                        value={section.value}
                        checked={selectedSection === section.value}
                        onChange={(e) => setSelectedSection(e.target.value)}
                      />
                      <span className="text-[15px]">{section.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full Paper Mock */}
          <div
            className={`border rounded-xl p-5 transition-colors cursor-pointer ${
              selectedMockType === 'full'
                ? 'border-[var(--text-primary)] bg-[var(--bg-secondary)]'
                : 'border-[var(--border-default)] hover:border-[var(--border-subtle)]'
            }`}
            onClick={() => setSelectedMockType('full')}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[18px] font-semibold mb-1">Full Paper Mock</h2>
                <p className="text-[13px] text-[var(--text-secondary)]">
                  80 questions • 120 minutes
                </p>
              </div>
              <input
                type="radio"
                checked={selectedMockType === 'full'}
                onChange={() => setSelectedMockType('full')}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {createError && (
          <div className="mt-4 p-4 bg-[var(--color-wrong-bg)] border border-[var(--color-wrong)] rounded-lg">
            <p className="text-[13px] text-[var(--color-wrong)]">{createError}</p>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStartMock}
          disabled={creatingMock || (selectedMockType === 'topic' && (!selectedTopicId || loadingTopics))}
          className="mt-6 w-full px-6 py-3 text-[15px] font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {creatingMock ? 'Creating...' : 'Start Mock →'}
        </button>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg">
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            All mock tests follow the ABC methodology. Tag each question as A (answer now), B (review later), or C (skip). You&apos;ll get a chance to review B-tagged questions after the first pass.
          </p>
        </div>
      </div>
    </div>
  );
}
