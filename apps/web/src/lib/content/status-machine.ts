type ContentStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'archived';

const transitions: Record<ContentStatus, ContentStatus[]> = {
  draft: ['review', 'scheduled', 'archived'],
  review: ['draft', 'approved', 'archived'],
  approved: ['draft', 'scheduled', 'published', 'archived'],
  scheduled: ['draft', 'published', 'archived'],
  published: ['archived'],
  archived: ['draft'],
};

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export function getValidNextStatuses(from: ContentStatus): ContentStatus[] {
  return transitions[from] ?? [];
}

export type { ContentStatus };
