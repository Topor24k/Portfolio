import { useSyncExternalStore } from 'react'
import { projects as bundledProjects } from '../projects'

const CACHE_KEY = 'kc_projects_cache_v1'

// ── Row ⇄ project mapping ─────────────────────────────────────
// The site components were written against projects.js; rows are reshaped to match it.
export function rowToProject(row) {
  const gallery = Array.isArray(row.gallery) ? row.gallery : []
  return {
    id: row.id,
    sortOrder: row.sort_order ?? 0,
    published: row.published ?? true,
    tab: row.tab || row.name?.split(' ')[0]?.toUpperCase() || '',
    name: row.name,
    projectType: row.project_type,
    category: row.category,
    archiveDate: row.archive_date,
    breadcrumbs: row.breadcrumbs,
    description: row.description,
    details: row.details,
    overview: row.overview || { p1: '', p2: '' },
    teamLabel: row.team_label,
    team: Array.isArray(row.team) ? row.team : [],
    disciplines: row.disciplines || [],
    cover: row.cover,
    alt: row.alt,
    gallery: gallery.map((item) => item.src),
    images: gallery.map((item, i) => ({
      src: item.src,
      alt: item.alt || `${row.name} preview ${i + 1}`,
      caption: item.caption || `${String(i + 1).padStart(2, '0')} / ${row.name}`,
    })),
    link: row.link,
    artifacts: Array.isArray(row.artifacts) ? row.artifacts : [],
    updatedAt: row.updated_at,
  }
}

export function projectToRow(project, sortOrder = project.sortOrder ?? 0) {
  const images = project.images?.length
    ? project.images
    : (project.gallery || []).map((src) => ({ src }))
  return {
    id: project.id,
    sort_order: sortOrder,
    published: project.published ?? true,
    name: project.name,
    tab: project.tab || '',
    project_type: project.projectType === 'client' ? 'client' : 'personal',
    category: project.category || '',
    archive_date: project.archiveDate || '',
    breadcrumbs: project.breadcrumbs || '',
    description: project.description || '',
    details: project.details || '',
    overview: { p1: project.overview?.p1 || '', p2: project.overview?.p2 || '' },
    team_label: project.teamLabel || '',
    team: (project.team || []).map(({ name, role, image, alt }) => ({ name, role, image, alt: alt || name })),
    disciplines: project.disciplines || [],
    cover: project.cover || '',
    alt: project.alt || project.name,
    gallery: images.map(({ src, alt, caption }) => ({ src, alt: alt || '', caption: caption || '' })),
    link: project.link || '',
    artifacts: project.artifacts || [],
  }
}

// ── Public store ──────────────────────────────────────────────
// Starts from the last good copy (or the bundled list) so pages render instantly,
// then refreshes from Supabase in the background.
function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY))
    return Array.isArray(cached) && cached.length ? cached : null
  } catch { return null }
}

let state = { projects: readCache() || bundledProjects, source: readCache() ? 'cache' : 'bundled' }
const listeners = new Set()
let inflight = null

const emit = (next) => {
  state = next
  listeners.forEach((fn) => fn())
}

export async function refreshProjects() {
  if (inflight) return inflight
  inflight = (async () => {
    // Loaded on demand so the Supabase client never delays the first paint.
    const { supabase } = await import('./supabase')
    if (!supabase) { inflight = null; return state.projects }
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true })
    inflight = null
    // A missing table or network error keeps whatever we already show.
    if (error || !data?.length) return state.projects
    const projects = data.map(rowToProject)
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(projects)) } catch {}
    emit({ projects, source: 'supabase' })
    return projects
  })()
  return inflight
}

const subscribe = (fn) => {
  listeners.add(fn)
  if (listeners.size === 1) refreshProjects()
  return () => listeners.delete(fn)
}

export function useProjects() {
  return useSyncExternalStore(subscribe, () => state).projects
}

export { bundledProjects }
