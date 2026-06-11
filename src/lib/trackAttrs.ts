import type { SiteTrackGroup } from './siteAnalytics'

export type TrackAttrs = {
  'data-track': string
  'data-track-label'?: string
  'data-track-group'?: SiteTrackGroup
}

export function trackAttrs(id: string, label: string, group: SiteTrackGroup): TrackAttrs {
  return {
    'data-track': id,
    'data-track-label': label,
    'data-track-group': group,
  }
}
