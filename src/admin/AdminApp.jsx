import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { STORAGE_BUCKET, supabase } from '../lib/supabase'
import { bundledProjects, projectToRow, refreshProjects, rowToProject } from '../lib/projectStore'
import './admin.css'

const OWNER_EMAIL = 'kayeencampana@gmail.com'

const slugify = (value) => value.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

const blankProject = () => ({
  id: '', published: true, name: '', tab: '', projectType: 'client', category: 'CLIENT PROJECT · ',
  archiveDate: `Archive Assemblage · ${new Date().getFullYear()}`, breadcrumbs: '', description: '', details: '',
  overview: { p1: '', p2: '' }, teamLabel: 'Native Legacy', team: [], disciplines: [], cover: '', alt: '',
  images: [], link: '', artifacts: [],
})

// ── Storage helpers ───────────────────────────────────────────
async function uploadFile(file, folder) {
  const extension = (file.name?.split('.').pop() || file.type.split('/')[1] || 'png').toLowerCase()
  const base = slugify(file.name?.replace(/\.[^.]+$/, '') || 'image') || 'image'
  const path = `${folder}/${Date.now().toString(36)}-${base}.${extension}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

// Copies an image that ships with the site (/public) into Supabase Storage.
async function uploadBundledImage(src, folder, cache) {
  if (!src || /^https?:/.test(src)) return src
  if (cache.has(src)) return cache.get(src)
  const response = await fetch(src)
  if (!response.ok) throw new Error(`Could not read ${decodeURIComponent(src)}`)
  const blob = await response.blob()
  const name = decodeURIComponent(src.split('/').pop())
  const extension = name.split('.').pop().toLowerCase()
  const path = `${folder}/${slugify(name.replace(/\.[^.]+$/, ''))}.${extension}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, { contentType: blob.type || `image/${extension}`, upsert: true })
  if (error) throw error
  const url = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl
  cache.set(src, url)
  return url
}

// ── Small building blocks ─────────────────────────────────────
function Field({ label, hint, children, wide }) {
  return (
    <label className={`studio-field${wide ? ' is-wide' : ''}`}>
      <span className="studio-field-label">{label}{hint && <em>{hint}</em>}</span>
      {children}
    </label>
  )
}

function DropZone({ onFiles, multiple, children, busy }) {
  const [over, setOver] = useState(false)
  const inputRef = useRef(null)
  const accept = (files) => {
    const images = [...files].filter((file) => file.type.startsWith('image/'))
    if (images.length) onFiles(multiple ? images : images.slice(0, 1))
  }
  return (
    <div
      className={`studio-drop${over ? ' is-over' : ''}${busy ? ' is-busy' : ''}`}
      onDragOver={(event) => { event.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => { event.preventDefault(); setOver(false); accept(event.dataTransfer.files) }}
    >
      {children}
      <button type="button" className="studio-ghost" disabled={busy} onClick={() => inputRef.current.click()}>
        {busy ? 'Uploading…' : multiple ? 'Add images' : 'Choose image'}
      </button>
      <span className="studio-drop-hint">or drop {multiple ? 'files' : 'a file'} here</span>
      <input ref={inputRef} type="file" accept="image/*" multiple={multiple} hidden
        onChange={(event) => { accept(event.target.files); event.target.value = '' }} />
    </div>
  )
}

// ── Sign in ───────────────────────────────────────────────────
function SignIn({ notice }) {
  const [email, setEmail] = useState(OWNER_EMAIL)
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState({ busy: false, message: notice || '' })

  const signIn = async (event) => {
    event.preventDefault()
    setStatus({ busy: true, message: '' })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setStatus({ busy: false, message: error ? error.message : '' })
  }

  const magicLink = async () => {
    setStatus({ busy: true, message: '' })
    const { error } = await supabase.auth.signInWithOtp({
      email, options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/admin` },
    })
    setStatus({ busy: false, message: error ? error.message : `Check ${email} for a sign-in link.` })
  }

  return (
    <main className="studio-gate">
      <form className="studio-gate-card" onSubmit={signIn}>
        <p className="studio-kicker"><i /> KC / Devspace — Studio</p>
        <h1>Owner<br /><span>access.</span></h1>
        <p className="studio-muted">This area manages the projects shown on the portfolio. It isn't linked anywhere on the site.</p>
        <Field label="Email">
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="studio-row">
          <button className="studio-primary" type="submit" disabled={status.busy || !password}>Sign in ↗</button>
          <button className="studio-ghost" type="button" disabled={status.busy || !email} onClick={magicLink}>Email me a link</button>
        </div>
        {status.message && <p className="studio-message" role="status">{status.message}</p>}
        <a className="studio-link" href="/">← Back to the portfolio</a>
      </form>
    </main>
  )
}

// ── Editor ────────────────────────────────────────────────────
function ProjectEditor({ initial, isNew, teamPresets, onCancel, onSaved, onDelete }) {
  const [draft, setDraft] = useState(initial)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [disciplinesText, setDisciplinesText] = useState(initial.disciplines.join(', '))
  const [uploading, setUploading] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dirty = useRef(false)

  useEffect(() => {
    const warn = (event) => { if (dirty.current) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const update = (patch) => {
    dirty.current = true
    setDraft((current) => {
      const next = { ...current, ...patch }
      if (isNew && !slugTouched && 'name' in patch) {
        next.id = slugify(patch.name)
        next.tab = patch.name.split(' ')[0]?.toUpperCase() || ''
      }
      return next
    })
  }
  const folder = `projects/${draft.id || 'draft'}`

  const upload = async (key, files, apply) => {
    setUploading(key)
    setError('')
    try {
      const urls = []
      for (const file of files) urls.push(await uploadFile(file, folder))
      apply(urls)
    } catch (err) {
      setError(`Upload failed: ${err.message}`)
    } finally {
      setUploading('')
    }
  }

  const moveImage = (index, direction) => {
    const images = [...draft.images]
    const target = index + direction
    if (target < 0 || target >= images.length) return
    ;[images[index], images[target]] = [images[target], images[index]]
    update({ images })
  }

  const save = async (event) => {
    event.preventDefault()
    if (!draft.name.trim()) return setError('Give the project a name.')
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.id)) return setError('The URL slug may only use lowercase letters, numbers and single hyphens.')
    if (!draft.cover) return setError('Add a cover image — it is used on the cards and the home reel.')
    setSaving(true)
    setError('')
    const row = projectToRow({ ...draft, breadcrumbs: draft.breadcrumbs || `INDEX / REGISTRY / ARCHIVE / ${draft.tab}` }, draft.sortOrder)
    const query = isNew
      ? supabase.from('projects').insert(row).select().single()
      : supabase.from('projects').update(row).eq('id', draft.id).select().single()
    const { data, error: saveError } = await query
    setSaving(false)
    if (saveError) {
      setError(saveError.code === '23505' ? 'A project with this URL slug already exists.' : saveError.message)
      return
    }
    dirty.current = false
    onSaved(rowToProject(data))
  }

  const unusedPresets = teamPresets.filter((preset) => !draft.team.some((member) => member.name === preset.name))

  return (
    <form className="studio-editor" onSubmit={save}>
      <header className="studio-editor-head">
        <div>
          <p className="studio-kicker"><i /> {isNew ? 'New project' : 'Editing'}</p>
          <h2>{draft.name || 'Untitled project'}</h2>
        </div>
        <div className="studio-row">
          <label className="studio-switch">
            <input type="checkbox" checked={draft.published} onChange={(e) => update({ published: e.target.checked })} />
            <span aria-hidden="true" />{draft.published ? 'Published' : 'Hidden'}
          </label>
          <button type="button" className="studio-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="studio-primary" disabled={saving || Boolean(uploading)}>{saving ? 'Saving…' : 'Save project'}</button>
        </div>
      </header>

      {error && <p className="studio-error" role="alert">{error}</p>}

      <section className="studio-section">
        <h3><span>01</span> Basics</h3>
        <div className="studio-grid">
          <Field label="Project name"><input value={draft.name} onChange={(e) => update({ name: e.target.value })} required /></Field>
          <Field label="URL slug" hint={isNew ? 'auto from name' : 'fixed after creation'}>
            <input value={draft.id} disabled={!isNew} onChange={(e) => { setSlugTouched(true); update({ id: slugify(e.target.value) }) }} />
          </Field>
          <Field label="Folder tab label"><input value={draft.tab} onChange={(e) => update({ tab: e.target.value.toUpperCase() })} /></Field>
          <Field label="Type">
            <select value={draft.projectType} onChange={(e) => update({ projectType: e.target.value })}>
              <option value="client">Client project</option>
              <option value="personal">Personal project</option>
            </select>
          </Field>
          <Field label="Category line" hint="e.g. CLIENT PROJECT · WEB PLATFORM"><input value={draft.category} onChange={(e) => update({ category: e.target.value.toUpperCase() })} /></Field>
          <Field label="Archive date"><input value={draft.archiveDate} onChange={(e) => update({ archiveDate: e.target.value })} /></Field>
          <Field label="Live site / repository link"><input type="url" value={draft.link} onChange={(e) => update({ link: e.target.value })} placeholder="https://" /></Field>
          <Field label="Disciplines" hint="comma separated">
            <input value={disciplinesText} placeholder="React, UI/UX, Full-stack" onChange={(e) => {
              setDisciplinesText(e.target.value)
              update({ disciplines: e.target.value.split(',').map((d) => d.trim()).filter(Boolean) })
            }} />
          </Field>
        </div>
      </section>

      <section className="studio-section">
        <h3><span>02</span> Story</h3>
        <div className="studio-grid">
          <Field label="Card description" hint="shown on the project cards" wide>
            <textarea rows={3} value={draft.description} onChange={(e) => update({ description: e.target.value })} />
          </Field>
          <Field label="Overview — paragraph 1" wide>
            <textarea rows={5} value={draft.overview.p1} onChange={(e) => update({ overview: { ...draft.overview, p1: e.target.value } })} />
          </Field>
          <Field label="Overview — paragraph 2" wide>
            <textarea rows={5} value={draft.overview.p2} onChange={(e) => update({ overview: { ...draft.overview, p2: e.target.value }, details: e.target.value })} />
          </Field>
        </div>
      </section>

      <section className="studio-section">
        <h3><span>03</span> Cover</h3>
        <div className="studio-cover">
          <DropZone busy={uploading === 'cover'} onFiles={(files) => upload('cover', files, ([url]) => update({ cover: url }))}>
            {draft.cover ? <img src={draft.cover} alt="" /> : <span className="studio-drop-empty">16 : 9 cover</span>}
          </DropZone>
          <Field label="Cover alt text"><input value={draft.alt} onChange={(e) => update({ alt: e.target.value })} placeholder={`${draft.name || 'Project'} website design`} /></Field>
        </div>
      </section>

      <section className="studio-section">
        <h3><span>04</span> Gallery <em>{draft.images.length} images</em></h3>
        <div className="studio-gallery">
          {draft.images.map((image, index) => (
            <figure className="studio-shot" key={`${image.src}-${index}`}>
              <img src={image.src} alt="" />
              <input aria-label={`Caption for image ${index + 1}`} value={image.caption}
                placeholder={`${String(index + 1).padStart(2, '0')} / Caption`}
                onChange={(e) => update({ images: draft.images.map((item, i) => (i === index ? { ...item, caption: e.target.value } : item)) })} />
              <div className="studio-shot-tools">
                <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Move earlier">←</button>
                <button type="button" onClick={() => moveImage(index, 1)} disabled={index === draft.images.length - 1} aria-label="Move later">→</button>
                <button type="button" onClick={() => update({ cover: image.src })} aria-label="Use as cover">Cover</button>
                <button type="button" className="is-danger" onClick={() => update({ images: draft.images.filter((_, i) => i !== index) })} aria-label="Remove image">✕</button>
              </div>
            </figure>
          ))}
          <DropZone multiple busy={uploading === 'gallery'} onFiles={(files) => upload('gallery', files, (urls) => update({
            images: [...draft.images, ...urls.map((src, i) => ({ src, alt: '', caption: `${String(draft.images.length + i + 1).padStart(2, '0')} / ` }))],
          }))}>
            <span className="studio-drop-empty">Screens & details</span>
          </DropZone>
        </div>
      </section>

      <section className="studio-section">
        <h3><span>05</span> Credits</h3>
        <Field label="Team label" hint="e.g. Native Legacy"><input value={draft.teamLabel} onChange={(e) => update({ teamLabel: e.target.value })} /></Field>
        <div className="studio-team">
          {draft.team.map((member, index) => (
            <div className="studio-member" key={index}>
              <DropZone busy={uploading === `team-${index}`} onFiles={(files) => upload(`team-${index}`, files, ([url]) => update({
                team: draft.team.map((m, i) => (i === index ? { ...m, image: url } : m)),
              }))}>
                {member.image ? <img src={member.image} alt="" /> : <span className="studio-drop-empty">Photo</span>}
              </DropZone>
              <input aria-label="Name" placeholder="Name" value={member.name} onChange={(e) => update({ team: draft.team.map((m, i) => (i === index ? { ...m, name: e.target.value, alt: `${e.target.value}, ${m.role}` } : m)) })} />
              <input aria-label="Role" placeholder="Role" value={member.role} onChange={(e) => update({ team: draft.team.map((m, i) => (i === index ? { ...m, role: e.target.value, alt: `${m.name}, ${e.target.value}` } : m)) })} />
              <button type="button" className="studio-ghost is-danger" onClick={() => update({ team: draft.team.filter((_, i) => i !== index) })}>Remove</button>
            </div>
          ))}
        </div>
        <div className="studio-row">
          {unusedPresets.map((preset) => (
            <button type="button" className="studio-chip" key={preset.name} onClick={() => update({ team: [...draft.team, preset] })}>+ {preset.name}</button>
          ))}
          <button type="button" className="studio-chip" onClick={() => update({ team: [...draft.team, { name: '', role: '', image: '', alt: '' }] })}>+ New person</button>
        </div>
      </section>

      {!isNew && (
        <section className="studio-section studio-danger-zone">
          <h3><span>06</span> Danger zone</h3>
          <p className="studio-muted">Deleting removes the project from the site. Uploaded images stay in storage.</p>
          <button type="button" className="studio-ghost is-danger" onClick={() => onDelete(draft)}>Delete this project</button>
        </section>
      )}
    </form>
  )
}

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard({ session }) {
  const [rows, setRows] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(null) // { project, isNew }
  const [importState, setImportState] = useState(null)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('projects').select('*').order('sort_order')
    if (error) {
      setLoadError(error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message)
        ? 'The projects table does not exist yet. Run the SQL in supabase/migrations first (see the setup notes).'
        : error.message)
      setRows([])
      return
    }
    setLoadError('')
    setRows(data.map(rowToProject))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const teamPresets = useMemo(() => {
    const seen = new Map()
    ;[...(rows || []), ...bundledProjects].forEach((project) => project.team?.forEach((member) => {
      if (member.name && !seen.has(member.name)) seen.set(member.name, member)
    }))
    return [...seen.values()]
  }, [rows])

  const reorder = async (index, direction) => {
    const list = [...rows]
    const target = index + direction
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    setRows(list)
    await Promise.all(list.map((project, i) => supabase.from('projects').update({ sort_order: i }).eq('id', project.id)))
    refreshProjects()
  }

  const togglePublished = async (project) => {
    const { error } = await supabase.from('projects').update({ published: !project.published }).eq('id', project.id)
    if (error) return setToast(error.message)
    setRows((list) => list.map((p) => (p.id === project.id ? { ...p, published: !p.published } : p)))
    refreshProjects()
  }

  const remove = async (project) => {
    if (!window.confirm(`Delete “${project.name}” from the portfolio? This cannot be undone.`)) return
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (error) return setToast(error.message)
    setEditing(null)
    setToast(`Deleted ${project.name}`)
    load()
    refreshProjects()
  }

  // One-time move of the projects that ship with the site — including every picture — into Supabase.
  const importBundled = async () => {
    const existing = new Set((rows || []).map((p) => p.id))
    const pending = bundledProjects.filter((p) => !existing.has(p.id))
    if (!pending.length) return
    const cache = new Map()
    const total = pending.reduce((sum, p) => sum + 1 + (p.images?.length || p.gallery?.length || 0) + (p.team?.length || 0), 0)
    let done = 0
    const step = (label) => { done += 1; setImportState({ label, progress: done / total }) }
    try {
      for (const [offset, project] of pending.entries()) {
        const folder = `projects/${project.id}`
        const cover = await uploadBundledImage(project.cover, folder, cache)
        step(`${project.name} — cover`)
        const sources = project.images?.length ? project.images : (project.gallery || []).map((src) => ({ src }))
        const images = []
        for (const image of sources) {
          images.push({ ...image, src: await uploadBundledImage(image.src, folder, cache) })
          step(`${project.name} — gallery`)
        }
        const team = []
        for (const member of project.team || []) {
          team.push({ ...member, image: await uploadBundledImage(member.image, 'team', cache) })
          step(`${project.name} — credits`)
        }
        const artifacts = await Promise.all((project.artifacts || []).map(async (artifact) => (
          artifact.image ? { ...artifact, image: await uploadBundledImage(artifact.image, folder, cache) } : artifact
        )))
        const row = projectToRow({ ...project, cover, images, team, artifacts }, (rows?.length || 0) + offset)
        const { error } = await supabase.from('projects').upsert(row)
        if (error) throw error
      }
      setImportState(null)
      setToast(`Imported ${pending.length} project${pending.length > 1 ? 's' : ''} and their images`)
      load()
      refreshProjects()
    } catch (error) {
      setImportState({ label: `Import stopped: ${error.message}`, progress: done / total, failed: true })
    }
  }

  const missingBundled = rows ? bundledProjects.filter((p) => !rows.some((r) => r.id === p.id)) : []

  return (
    <div className="studio">
      <header className="studio-bar">
        <a className="studio-brand" href="/admin"><b>KC</b> Studio</a>
        <div className="studio-row">
          <span className="studio-who">{session.user.email}</span>
          <a className="studio-ghost" href="/" target="_blank" rel="noreferrer">View site ↗</a>
          <button className="studio-ghost" type="button" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>

      {editing ? (
        <ProjectEditor
          key={editing.project.id || 'new'}
          initial={editing.project}
          isNew={editing.isNew}
          teamPresets={teamPresets}
          onCancel={() => setEditing(null)}
          onDelete={remove}
          onSaved={(project) => {
            setEditing(null)
            setToast(`Saved ${project.name}`)
            load()
            refreshProjects()
          }}
        />
      ) : (
        <main className="studio-main">
          <div className="studio-head">
            <div>
              <p className="studio-kicker"><i /> Portfolio archive</p>
              <h1>Projects <span>{rows ? String(rows.length).padStart(2, '0') : '—'}</span></h1>
            </div>
            <button className="studio-primary" type="button" disabled={Boolean(loadError)}
              onClick={() => setEditing({ isNew: true, project: { ...blankProject(), sortOrder: rows?.length || 0 } })}>
              + New project
            </button>
          </div>

          {loadError && <p className="studio-error">{loadError}</p>}

          {!loadError && missingBundled.length > 0 && (
            <div className="studio-callout">
              <div>
                <h3>Move your existing projects into Supabase</h3>
                <p className="studio-muted">
                  {missingBundled.map((p) => p.name).join(', ')} still live in the site’s code. Importing uploads their
                  covers, gallery and team photos to Supabase Storage and creates editable records.
                </p>
              </div>
              <button className="studio-primary" type="button" onClick={importBundled} disabled={Boolean(importState && !importState.failed)}>
                {importState && !importState.failed ? 'Importing…' : `Import ${missingBundled.length} project${missingBundled.length > 1 ? 's' : ''}`}
              </button>
              {importState && (
                <div className="studio-progress">
                  <i style={{ transform: `scaleX(${importState.progress})` }} />
                  <span className={importState.failed ? 'is-failed' : ''}>{importState.label}</span>
                </div>
              )}
            </div>
          )}

          {rows === null ? <p className="studio-muted">Loading projects…</p> : (
            <ol className="studio-list">
              {rows.map((project, index) => (
                <li className={`studio-item${project.published ? '' : ' is-hidden'}`} key={project.id}>
                  <span className="studio-index">{String(index + 1).padStart(2, '0')}</span>
                  <img src={project.cover} alt="" />
                  <div className="studio-item-copy">
                    <p>{project.category}</p>
                    <h2>{project.name}</h2>
                    <span>/{project.id} · {project.images.length} images · {project.team.length} credits</span>
                  </div>
                  <div className="studio-item-tools">
                    <button type="button" onClick={() => reorder(index, -1)} disabled={index === 0} aria-label={`Move ${project.name} up`}>↑</button>
                    <button type="button" onClick={() => reorder(index, 1)} disabled={index === rows.length - 1} aria-label={`Move ${project.name} down`}>↓</button>
                    <button type="button" className={`studio-pill${project.published ? ' is-on' : ''}`} onClick={() => togglePublished(project)}>
                      {project.published ? 'Live' : 'Hidden'}
                    </button>
                    <button type="button" className="studio-primary" onClick={() => setEditing({ isNew: false, project })}>Edit</button>
                  </div>
                </li>
              ))}
              {!rows.length && !loadError && <li className="studio-empty">No projects in Supabase yet.</li>}
            </ol>
          )}
        </main>
      )}

      {toast && <p className="studio-toast" role="status">{toast}</p>}
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────
export default function AdminApp() {
  const [session, setSession] = useState(undefined)
  const [isOwner, setIsOwner] = useState(null)

  useEffect(() => {
    document.title = 'Studio — Kayeen Devspace'
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    if (!supabase) return () => robots.remove()
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => { listener.subscription.unsubscribe(); robots.remove() }
  }, [])

  useEffect(() => {
    if (!session) { setIsOwner(null); return }
    supabase.rpc('is_portfolio_admin').then(({ data, error }) => setIsOwner(error ? 'error' : Boolean(data)))
  }, [session])

  if (!supabase) {
    return <main className="studio-gate"><div className="studio-gate-card">
      <h1>Not<br /><span>connected.</span></h1>
      <p className="studio-muted">Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local (and to Vercel), then restart.</p>
    </div></main>
  }
  if (session === undefined) return <main className="studio-gate"><p className="studio-muted">Loading…</p></main>
  if (!session) return <SignIn />
  if (isOwner === null) return <main className="studio-gate"><p className="studio-muted">Checking access…</p></main>
  if (isOwner !== true) {
    return <main className="studio-gate"><div className="studio-gate-card">
      <h1>No<br /><span>access.</span></h1>
      <p className="studio-muted">
        {isOwner === 'error'
          ? 'The database isn’t set up yet — run the SQL in supabase/migrations, then sign in again.'
          : `${session.user.email} isn’t the portfolio owner account (or its email isn’t confirmed yet).`}
      </p>
      <button className="studio-ghost" type="button" onClick={() => supabase.auth.signOut()}>Sign out</button>
    </div></main>
  }
  return <Dashboard session={session} />
}
