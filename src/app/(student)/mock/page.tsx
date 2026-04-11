"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

type Topic = {
  id: string;
  name: string;
  slug: string;
  section: string;
};

type MockType = 'topic' | 'section' | 'full';

const MOCK_TYPES: { type: MockType; title: string; meta: string }[] = [
  { type: 'topic', title: 'Topic Mini-Mock', meta: '10 questions · 15 min' },
  { type: 'section', title: 'Section Mock', meta: '30 questions · 40 min' },
  { type: 'full', title: 'Full Paper Mock', meta: '80 questions · 120 min' },
];

const SECTIONS = [
  { value: 'rc', label: 'Reading Comprehension' },
  { value: 'lr', label: 'Logical Reasoning' },
  { value: 'math', label: 'Mathematics' },
];

export default function MockSelectionPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  const [selectedMockType, setSelectedMockType] = useState<MockType>('topic');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('rc');

  const [creatingMock, setCreatingMock] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/topics')
      .then((r) => r.json())
      .then((data) => {
        setTopics(data.topics || []);
        if (data.topics?.length > 0) setSelectedTopicId(data.topics[0].id);
      })
      .finally(() => setLoadingTopics(false));
  }, []);

  const handleStartMock = async () => {
    setCreatingMock(true);
    setCreateError(null);
    try {
      const body: { type: string; topicId?: string; section?: string } = { type: selectedMockType };
      if (selectedMockType === 'topic') {
        if (!selectedTopicId) throw new Error('Please select a topic');
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
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to create mock');
      }
      const data = await res.json();
      router.push(`/mock/${data.mockId}`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create mock');
      setCreatingMock(false);
    }
  };

  return (
    <div className="space-y-0">
      <h1 className="text-page-title mb-1">Mock Tests</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Choose a format and test your preparation with ABC methodology.
      </p>

      {/* Mock type cards */}
      <div className="space-y-3 mb-6">
        {MOCK_TYPES.map(({ type, title, meta }) => {
          const isSelected = selectedMockType === type;
          return (
            <div
              key={type}
              onClick={() => setSelectedMockType(type)}
              className="rounded-xl cursor-pointer transition-colors"
              style={{
                border: isSelected
                  ? '2px solid var(--text-primary)'
                  : '1px solid var(--border-default)',
                backgroundColor: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                padding: isSelected ? '19px 19px' : '20px',
              }}
            >
              {/* Card header row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {meta}
                  </p>
                </div>
                {/* Custom selection indicator */}
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: isSelected ? '2px solid var(--text-primary)' : '2px solid var(--border-default)',
                    backgroundColor: isSelected ? 'var(--text-primary)' : 'transparent',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--bg-primary)' }} />
                  )}
                </div>
              </div>

              {/* Expanded controls */}
              {isSelected && type === 'topic' && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Select topic
                  </label>
                  {loadingTopics ? (
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>
                  ) : topics.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No topics available</p>
                  ) : (
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {isSelected && type === 'section' && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <label className="block text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Select section
                  </label>
                  <div className="flex flex-col gap-2">
                    {SECTIONS.map((sec) => (
                      <label
                        key={sec.value}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                        style={{
                          border: selectedSection === sec.value
                            ? '1px solid var(--text-primary)'
                            : '1px solid var(--border-default)',
                          backgroundColor: selectedSection === sec.value
                            ? 'var(--bg-primary)'
                            : 'transparent',
                        }}
                      >
                        <input
                          type="radio"
                          name="section"
                          value={sec.value}
                          checked={selectedSection === sec.value}
                          onChange={(e) => setSelectedSection(e.target.value)}
                          className="sr-only"
                        />
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            border: selectedSection === sec.value
                              ? '2px solid var(--text-primary)'
                              : '2px solid var(--border-default)',
                            backgroundColor: selectedSection === sec.value
                              ? 'var(--text-primary)'
                              : 'transparent',
                            flexShrink: 0,
                          }}
                        />
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {sec.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {createError && (
        <div
          className="mb-4 p-4 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--color-wrong-bg)',
            border: '1px solid var(--color-wrong)',
            color: 'var(--color-wrong)',
          }}
        >
          {createError}
        </div>
      )}

      {/* Start button */}
      <Button
        variant="primary"
        onClick={handleStartMock}
        disabled={creatingMock || (selectedMockType === 'topic' && (!selectedTopicId || loadingTopics))}
        className="w-full px-6 py-3 text-sm font-semibold"
      >
        {creatingMock ? 'Starting…' : 'Start Mock →'}
      </Button>

      {/* ABC info note */}
      <p className="mt-4 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
        Tag each question A · B · C during the test. Review B-tagged questions after your first pass.
      </p>

      {/* History link */}
      <div className="mt-6 text-center">
        <Link href="/mock/history" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          View past mocks →
        </Link>
      </div>
    </div>
  );
}
