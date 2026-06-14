import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import './App.css'

type CaseStatus = 'Active' | 'Awaiting Order' | 'Drafting' | 'Billing'
type Priority = 'High' | 'Medium' | 'Low'

type Client = {
  id: string
  name: string
  type: string
  phone: string
  email: string
  city: string
}

type DbClient = {
  city: string | null
  client_type: string
  email: string | null
  id: string
  name: string
  phone: string | null
}

type LegalCase = {
  id: string
  title: string
  client: string
  court: string
  caseNo: string
  status: CaseStatus
  nextDate: string
  owner: string
  balance: string
}

type Hearing = {
  id: string
  time: string
  caseTitle: string
  court: string
  purpose: string
}

type Task = {
  id: string
  title: string
  matter: string
  due: string
  priority: Priority
  completed?: boolean
}

type TimelineCategory = 'Note' | 'Hearing' | 'Filing' | 'Document' | 'Invoice' | 'Client Update'

type TimelineEvent = {
  id: string
  matterId: string
  date: string
  category: TimelineCategory
  title: string
  body: string
  author: string
}

type DocumentCategory = 'Petition' | 'Affidavit' | 'Order' | 'Notice' | 'Invoice' | 'Vakalatnama' | 'Evidence' | 'Other'

type MatterDocument = {
  id: string
  matterId: string
  name: string
  category: DocumentCategory
  filedOn: string
  owner: string
  fileName: string
  note: string
}

type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue'

type Invoice = {
  id: string
  matterId: string
  invoiceNo: string
  client: string
  issueDate: string
  dueDate: string
  professionalFee: number
  gstRate: number
  tds: number
  status: InvoiceStatus
  note: string
}

type CommunicationChannel = 'WhatsApp' | 'SMS' | 'Email'
type CommunicationStatus = 'Draft' | 'Sent' | 'Scheduled'

type Communication = {
  id: string
  matterId: string
  client: string
  channel: CommunicationChannel
  status: CommunicationStatus
  subject: string
  message: string
  date: string
  sender: string
}

type AuditEvent = {
  id: string
  action: string
  actorRole: UserRole
  target: string
  detail: string
  time: string
}

type CauseListEntry = {
  id: string
  matterId: string
  date: string
  court: string
  bench: string
  courtroom: string
  itemNo: string
  stage: string
  nextAction: string
}

type DeadlineStatus = 'Open' | 'Filed' | 'Delayed'

type Deadline = {
  id: string
  matterId: string
  title: string
  dueDate: string
  basis: string
  status: DeadlineStatus
}

type TemplateDraft = {
  id: string
  matterId: string
  templateType: string
  title: string
  content: string
  createdBy: string
}

type PrivateNote = {
  id: string
  matterId: string
  title: string
  note: string
  author: string
  sensitivity: 'Normal' | 'Sensitive' | 'Privileged'
}

type CourtDirectoryEntry = {
  id: string
  name: string
  city: string
  type: string
  contact: string
  filingNotes: string
}

type TeamMember = {
  id: string
  name: string
  role: string
  location: string
  activeMatters: number
  openTasks: number
}

type UserRole = 'Admin' | 'Lawyer' | 'Staff' | 'Client'
type WorkspaceView = 'Overview' | 'Portal' | 'Intake' | 'Matter Hub' | 'Advanced' | 'Admin'

type AuthProfile = {
  email: string
  firmId: string
  fullName: string
  id: string
  role: UserRole
}

type FormKind =
  | 'client'
  | 'matter'
  | 'hearing'
  | 'task'
  | 'timeline'
  | 'document'
  | 'invoice'
  | 'communication'
  | 'cause'
  | 'deadline'
  | 'template'
  | 'privateNote'
  | 'court'
  | 'team'

const initialClients: Client[] = [
  {
    id: 'CLI-1001',
    name: 'Mehta Realty LLP',
    type: 'Corporate',
    phone: '+91 98765 43210',
    email: 'legal@mehtarealty.in',
    city: 'Mumbai',
  },
  {
    id: 'CLI-1002',
    name: 'Arora Foods Pvt Ltd',
    type: 'Corporate',
    phone: '+91 99887 76655',
    email: 'accounts@arorafoods.in',
    city: 'Delhi',
  },
  {
    id: 'CLI-1003',
    name: 'R. Singh',
    type: 'Individual',
    phone: '+91 91234 56780',
    email: 'rsingh@example.com',
    city: 'New Delhi',
  },
]

const initialCases: LegalCase[] = [
  {
    id: 'MAT-1024',
    title: 'Mehta Realty v. State Revenue Dept.',
    client: 'Mehta Realty LLP',
    court: 'Bombay High Court',
    caseNo: 'WP 4182/2026',
    status: 'Active',
    nextDate: '24 May',
    owner: 'A. Sharma',
    balance: 'Rs 1,42,000',
  },
  {
    id: 'MAT-1025',
    title: 'Arora Foods GST Appeal',
    client: 'Arora Foods Pvt Ltd',
    court: 'GST Appellate Authority',
    caseNo: 'APL 77/2026',
    status: 'Drafting',
    nextDate: '27 May',
    owner: 'N. Rao',
    balance: 'Rs 58,500',
  },
  {
    id: 'MAT-1026',
    title: 'Singh Family Partition Suit',
    client: 'R. Singh',
    court: 'District Court, Saket',
    caseNo: 'CS 903/2025',
    status: 'Awaiting Order',
    nextDate: '31 May',
    owner: 'P. Iyer',
    balance: 'Rs 22,000',
  },
  {
    id: 'MAT-1027',
    title: 'NCLT Vendor Recovery',
    client: 'Kaveri Components',
    court: 'NCLT Bengaluru',
    caseNo: 'CP(IB) 112/2026',
    status: 'Billing',
    nextDate: '04 Jun',
    owner: 'S. Khan',
    balance: 'Rs 2,10,000',
  },
]

const initialHearings: Hearing[] = [
  {
    id: 'HEA-2001',
    time: '10:30',
    caseTitle: 'Mehta Realty v. State Revenue Dept.',
    court: 'Court 4, Bombay HC',
    purpose: 'Admission',
  },
  {
    id: 'HEA-2002',
    time: '12:15',
    caseTitle: 'Singh Family Partition Suit',
    court: 'Saket District Court',
    purpose: 'Evidence',
  },
  {
    id: 'HEA-2003',
    time: '15:00',
    caseTitle: 'NCLT Vendor Recovery',
    court: 'NCLT Bengaluru',
    purpose: 'Reply filing',
  },
]

const initialTasks: Task[] = [
  {
    id: 'TSK-3001',
    title: 'Finalize writ petition annexures',
    matter: 'Mehta Realty',
    due: 'Today',
    priority: 'High',
  },
  {
    id: 'TSK-3002',
    title: 'Send GST invoice with TDS note',
    matter: 'Arora Foods',
    due: 'Tomorrow',
    priority: 'Medium',
  },
  {
    id: 'TSK-3003',
    title: 'Upload signed vakalatnama',
    matter: 'Singh Family',
    due: '24 May',
    priority: 'High',
  },
  {
    id: 'TSK-3004',
    title: 'Prepare WhatsApp hearing update',
    matter: 'NCLT Vendor Recovery',
    due: '25 May',
    priority: 'Low',
  },
]

const initialTimelineEvents: TimelineEvent[] = [
  {
    id: 'TL-4001',
    matterId: 'MAT-1024',
    date: '21 May',
    category: 'Filing',
    title: 'Draft writ petition reviewed',
    body: 'Senior counsel requested a tighter chronology and updated annexure references before filing.',
    author: 'A. Sharma',
  },
  {
    id: 'TL-4002',
    matterId: 'MAT-1024',
    date: '20 May',
    category: 'Client Update',
    title: 'Client briefing sent',
    body: 'Shared hearing preparation note and expected admission-stage questions with Mehta Realty.',
    author: 'N. Rao',
  },
  {
    id: 'TL-4003',
    matterId: 'MAT-1025',
    date: '19 May',
    category: 'Document',
    title: 'GST order uploaded',
    body: 'Added assessment order and payment challan copies to the matter file.',
    author: 'S. Khan',
  },
]

const initialDocuments: MatterDocument[] = [
  {
    id: 'DOC-5001',
    matterId: 'MAT-1024',
    name: 'Draft writ petition',
    category: 'Petition',
    filedOn: '21 May',
    owner: 'A. Sharma',
    fileName: 'mehta-writ-draft.pdf',
    note: 'Internal review draft before filing.',
  },
  {
    id: 'DOC-5002',
    matterId: 'MAT-1025',
    name: 'GST assessment order',
    category: 'Order',
    filedOn: '19 May',
    owner: 'S. Khan',
    fileName: 'gst-assessment-order.pdf',
    note: 'Impugned order for appeal drafting.',
  },
]

const initialInvoices: Invoice[] = [
  {
    id: 'INV-6001',
    matterId: 'MAT-1024',
    invoiceNo: 'INV-2026-001',
    client: 'Mehta Realty LLP',
    issueDate: '21 May',
    dueDate: '31 May',
    professionalFee: 120000,
    gstRate: 18,
    tds: 12000,
    status: 'Sent',
    note: 'Filing and conference fee for writ admission stage.',
  },
  {
    id: 'INV-6002',
    matterId: 'MAT-1025',
    invoiceNo: 'INV-2026-002',
    client: 'Arora Foods Pvt Ltd',
    issueDate: '18 May',
    dueDate: '28 May',
    professionalFee: 50000,
    gstRate: 18,
    tds: 5000,
    status: 'Draft',
    note: 'GST appeal drafting and consultation.',
  },
]

const initialCommunications: Communication[] = [
  {
    id: 'COM-7001',
    matterId: 'MAT-1024',
    client: 'Mehta Realty LLP',
    channel: 'WhatsApp',
    status: 'Sent',
    subject: 'Admission hearing preparation',
    message: 'Your writ matter is listed for admission. Please keep the signed board resolution and annexure originals ready.',
    date: '21 May',
    sender: 'A. Sharma',
  },
  {
    id: 'COM-7002',
    matterId: 'MAT-1025',
    client: 'Arora Foods Pvt Ltd',
    channel: 'Email',
    status: 'Draft',
    subject: 'GST appeal documents pending',
    message: 'Please share purchase register extracts and challan copies for the disputed period.',
    date: '22 May',
    sender: 'N. Rao',
  },
]

const initialAuditEvents: AuditEvent[] = [
  {
    id: 'AUD-8001',
    action: 'System initialized',
    actorRole: 'Admin',
    target: 'Workspace',
    detail: 'Initial legal CRM prototype data loaded into local workspace.',
    time: '21 May, 13:00',
  },
  {
    id: 'AUD-8002',
    action: 'Client update sent',
    actorRole: 'Lawyer',
    target: 'Mehta Realty v. State Revenue Dept.',
    detail: 'WhatsApp hearing preparation update recorded for client portal visibility.',
    time: '21 May, 13:15',
  },
]

const initialCauseList: CauseListEntry[] = [
  {
    id: 'CL-9001',
    matterId: 'MAT-1024',
    date: '24 May',
    court: 'Bombay High Court',
    bench: 'Justice Deshmukh',
    courtroom: 'Court 4',
    itemNo: 'Item 37',
    stage: 'Admission',
    nextAction: 'Carry annexure index and board resolution.',
  },
  {
    id: 'CL-9002',
    matterId: 'MAT-1026',
    date: '31 May',
    court: 'District Court, Saket',
    bench: 'ADJ-02',
    courtroom: 'Room 214',
    itemNo: 'Item 12',
    stage: 'Evidence',
    nextAction: 'Prepare witness file and exhibit list.',
  },
]

const initialDeadlines: Deadline[] = [
  {
    id: 'DL-9101',
    matterId: 'MAT-1024',
    title: 'File rejoinder affidavit',
    dueDate: '28 May',
    basis: 'Court direction from admission hearing',
    status: 'Open',
  },
  {
    id: 'DL-9102',
    matterId: 'MAT-1025',
    title: 'GST appeal compilation',
    dueDate: '30 May',
    basis: 'Internal filing target',
    status: 'Open',
  },
]

const initialTemplates: TemplateDraft[] = [
  {
    id: 'TPL-9201',
    matterId: 'MAT-1024',
    templateType: 'Petition Index',
    title: 'Writ petition index',
    content: 'Synopsis, list of dates, memo of parties, writ petition, affidavit, annexures, vakalatnama.',
    createdBy: 'A. Sharma',
  },
  {
    id: 'TPL-9202',
    matterId: 'MAT-1026',
    templateType: 'Affidavit',
    title: 'Evidence affidavit skeleton',
    content: 'Deponent details, facts within knowledge, exhibit references, verification.',
    createdBy: 'P. Iyer',
  },
]

const initialPrivateNotes: PrivateNote[] = [
  {
    id: 'PN-9301',
    matterId: 'MAT-1024',
    title: 'Admission strategy',
    note: 'Lead with maintainability and urgency; keep alternate remedy answer ready.',
    author: 'A. Sharma',
    sensitivity: 'Privileged',
  },
]

const initialCourts: CourtDirectoryEntry[] = [
  {
    id: 'CRT-9401',
    name: 'Bombay High Court',
    city: 'Mumbai',
    type: 'High Court',
    contact: 'Registry counter 3',
    filingNotes: 'Check objections before 16:00; urgent circulation requires praecipe.',
  },
  {
    id: 'CRT-9402',
    name: 'NCLT Bengaluru',
    city: 'Bengaluru',
    type: 'Tribunal',
    contact: 'Filing section',
    filingNotes: 'Upload soft copy and carry defect curing checklist.',
  },
]

const initialTeamMembers: TeamMember[] = [
  {
    id: 'TM-9501',
    name: 'A. Sharma',
    role: 'Partner',
    location: 'Mumbai',
    activeMatters: 12,
    openTasks: 5,
  },
  {
    id: 'TM-9502',
    name: 'N. Rao',
    role: 'Associate',
    location: 'Delhi',
    activeMatters: 9,
    openTasks: 7,
  },
]

const navItems = ['Dashboard', 'Matters', 'Clients', 'Calendar', 'Billing']
const userRoles: UserRole[] = ['Admin', 'Lawyer', 'Staff', 'Client']
const workspaceViews: WorkspaceView[] = ['Overview', 'Portal', 'Intake', 'Matter Hub', 'Advanced', 'Admin']
const statuses: CaseStatus[] = ['Active', 'Awaiting Order', 'Drafting', 'Billing']
const priorities: Priority[] = ['High', 'Medium', 'Low']
const deadlineStatuses: DeadlineStatus[] = ['Open', 'Filed', 'Delayed']
const timelineCategories: TimelineCategory[] = ['Note', 'Hearing', 'Filing', 'Document', 'Invoice', 'Client Update']
const invoiceStatuses: InvoiceStatus[] = ['Draft', 'Sent', 'Paid', 'Overdue']
const communicationChannels: CommunicationChannel[] = ['WhatsApp', 'SMS', 'Email']
const communicationStatuses: CommunicationStatus[] = ['Draft', 'Sent', 'Scheduled']
const documentCategories: DocumentCategory[] = [
  'Petition',
  'Affidavit',
  'Order',
  'Notice',
  'Invoice',
  'Vakalatnama',
  'Evidence',
  'Other',
]

function readStoredList<T>(key: string, fallback: T[]) {
  if (typeof window === 'undefined') return fallback

  try {
    const stored = window.localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T[]) : fallback
  } catch {
    return fallback
  }
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-6)}`
}

function formatInr(value: number) {
  return new Intl.NumberFormat('en-IN', {
    currency: 'INR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function invoiceTotal(invoice: Invoice) {
  const gst = (invoice.professionalFee * invoice.gstRate) / 100
  return invoice.professionalFee + gst - invoice.tds
}

function toUserRole(role: string): UserRole {
  const normalized = role.toLowerCase()
  if (normalized === 'admin') return 'Admin'
  if (normalized === 'lawyer') return 'Lawyer'
  if (normalized === 'staff') return 'Staff'
  return 'Client'
}

function mapClientFromDb(client: DbClient): Client {
  return {
    city: client.city ?? '',
    email: client.email ?? '',
    id: client.id,
    name: client.name,
    phone: client.phone ?? '',
    type: client.client_type,
  }
}

function App() {
  const [activeRole, setActiveRole] = useState<UserRole>('Admin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null)
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceView>('Overview')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error' | 'local'>(
    isSupabaseConfigured ? 'checking' : 'local',
  )
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [activeForm, setActiveForm] = useState<FormKind>('matter')
  const [clients, setClients] = useState(() => readStoredList('ilcrm-clients', initialClients))
  const [cases, setCases] = useState(() => readStoredList('ilcrm-cases', initialCases))
  const [hearings, setHearings] = useState(() => readStoredList('ilcrm-hearings', initialHearings))
  const [tasks, setTasks] = useState(() => readStoredList('ilcrm-tasks', initialTasks))
  const [timelineEvents, setTimelineEvents] = useState(() =>
    readStoredList('ilcrm-timeline-events', initialTimelineEvents),
  )
  const [documents, setDocuments] = useState(() => readStoredList('ilcrm-documents', initialDocuments))
  const [invoices, setInvoices] = useState(() => readStoredList('ilcrm-invoices', initialInvoices))
  const [communications, setCommunications] = useState(() =>
    readStoredList('ilcrm-communications', initialCommunications),
  )
  const [auditEvents, setAuditEvents] = useState(() => readStoredList('ilcrm-audit-events', initialAuditEvents))
  const [causeList, setCauseList] = useState(() => readStoredList('ilcrm-cause-list', initialCauseList))
  const [deadlines, setDeadlines] = useState(() => readStoredList('ilcrm-deadlines', initialDeadlines))
  const [templates, setTemplates] = useState(() => readStoredList('ilcrm-templates', initialTemplates))
  const [privateNotes, setPrivateNotes] = useState(() => readStoredList('ilcrm-private-notes', initialPrivateNotes))
  const [courts, setCourts] = useState(() => readStoredList('ilcrm-courts', initialCourts))
  const [teamMembers, setTeamMembers] = useState(() => readStoredList('ilcrm-team-members', initialTeamMembers))
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.id ?? '')
  const [matterSearch, setMatterSearch] = useState('')
  const [matterStatusFilter, setMatterStatusFilter] = useState<CaseStatus | 'All'>('All')
  const [clientSearch, setClientSearch] = useState('')
  const [globalSearch, setGlobalSearch] = useState('')
  const [portalClientId, setPortalClientId] = useState(clients[0]?.id ?? '')
  const [editingMatterId, setEditingMatterId] = useState<string | null>(null)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)

  useEffect(() => {
    window.localStorage.setItem('ilcrm-clients', JSON.stringify(clients))
  }, [clients])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-cases', JSON.stringify(cases))
  }, [cases])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-hearings', JSON.stringify(hearings))
  }, [hearings])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-timeline-events', JSON.stringify(timelineEvents))
  }, [timelineEvents])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-documents', JSON.stringify(documents))
  }, [documents])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-invoices', JSON.stringify(invoices))
  }, [invoices])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-communications', JSON.stringify(communications))
  }, [communications])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-audit-events', JSON.stringify(auditEvents))
  }, [auditEvents])

  useEffect(() => {
    async function checkBackend() {
      if (!supabase) return

      const { error } = await supabase.from('firms').select('id', { count: 'exact', head: true })
      setBackendStatus(error ? 'error' : 'connected')
    }

    void checkBackend()
  }, [])

  useEffect(() => {
    async function loadProfile(userId: string) {
      if (!supabase) return

      const { data, error } = await supabase
        .from('profiles')
        .select('id, firm_id, full_name, role, email')
        .eq('id', userId)
        .single()

      if (error || !data) {
        setAuthMessage('Login found, but no profile is linked yet.')
        setAuthProfile(null)
        return
      }

      const profile: AuthProfile = {
        email: data.email,
        firmId: data.firm_id,
        fullName: data.full_name,
        id: data.id,
        role: toUserRole(data.role),
      }

      setAuthProfile(profile)
      setActiveRole(profile.role)
      setAuthMessage('')
    }

    async function initializeAuth() {
      if (!supabase) return

      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        await loadProfile(data.session.user.id)
      }

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          void loadProfile(session.user.id)
        } else {
          setAuthProfile(null)
        }
      })

      return () => listener.subscription.unsubscribe()
    }

    void initializeAuth()
  }, [])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-cause-list', JSON.stringify(causeList))
  }, [causeList])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-deadlines', JSON.stringify(deadlines))
  }, [deadlines])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-templates', JSON.stringify(templates))
  }, [templates])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-private-notes', JSON.stringify(privateNotes))
  }, [privateNotes])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-courts', JSON.stringify(courts))
  }, [courts])

  useEffect(() => {
    window.localStorage.setItem('ilcrm-team-members', JSON.stringify(teamMembers))
  }, [teamMembers])

  useEffect(() => {
    async function loadSupabaseClients() {
      if (!supabase || !authProfile) return

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, client_type, phone, email, city')
        .eq('firm_id', authProfile.firmId)
        .order('created_at', { ascending: false })

      if (error) {
        setAuthMessage(`Could not load Supabase clients: ${error.message}`)
        return
      }

      setClients((data ?? []).map((client) => mapClientFromDb(client as DbClient)))
    }

    void loadSupabaseClients()
  }, [authProfile])

  async function saveClientToSupabase(client: Omit<Client, 'id'>, id?: string) {
    if (!supabase || !authProfile) return null

    const payload = {
      city: client.city,
      client_type: client.type,
      email: client.email,
      firm_id: authProfile.firmId,
      name: client.name,
      phone: client.phone,
    }

    const query = id
      ? supabase
          .from('clients')
          .update(payload)
          .eq('id', id)
          .eq('firm_id', authProfile.firmId)
          .select('id, name, client_type, phone, email, city')
          .single()
      : supabase
          .from('clients')
          .insert(payload)
          .select('id, name, client_type, phone, email, city')
          .single()

    const { data, error } = await query

    if (error) {
      setAuthMessage(`Supabase client save failed: ${error.message}`)
      return null
    }

    return mapClientFromDb(data as DbClient)
  }

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? cases[0],
    [cases, selectedCaseId],
  )

  const editingMatter = cases.find((item) => item.id === editingMatterId)
  const editingClient = clients.find((item) => item.id === editingClientId)

  const filteredCases = useMemo(() => {
    const query = matterSearch.trim().toLowerCase()

    return cases.filter((item) => {
      const matchesStatus = matterStatusFilter === 'All' || item.status === matterStatusFilter
      const searchable = [
        item.title,
        item.client,
        item.court,
        item.caseNo,
        item.owner,
        item.status,
      ].join(' ').toLowerCase()

      return matchesStatus && (!query || searchable.includes(query))
    })
  }, [cases, matterSearch, matterStatusFilter])

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase()

    return clients.filter((item) => {
      const searchable = [item.name, item.type, item.phone, item.email, item.city].join(' ').toLowerCase()
      return !query || searchable.includes(query)
    })
  }, [clients, clientSearch])

  const selectedTimelineEvents = useMemo(
    () => timelineEvents.filter((item) => item.matterId === selectedCase?.id),
    [selectedCase?.id, timelineEvents],
  )

  const selectedDocuments = useMemo(
    () => documents.filter((item) => item.matterId === selectedCase?.id),
    [documents, selectedCase?.id],
  )

  const selectedInvoices = useMemo(
    () => invoices.filter((item) => item.matterId === selectedCase?.id),
    [invoices, selectedCase?.id],
  )
  const selectedCommunications = useMemo(
    () => communications.filter((item) => item.matterId === selectedCase?.id),
    [communications, selectedCase?.id],
  )
  const selectedCauseList = useMemo(
    () => causeList.filter((item) => item.matterId === selectedCase?.id),
    [causeList, selectedCase?.id],
  )
  const selectedDeadlines = useMemo(
    () => deadlines.filter((item) => item.matterId === selectedCase?.id),
    [deadlines, selectedCase?.id],
  )
  const selectedTemplates = useMemo(
    () => templates.filter((item) => item.matterId === selectedCase?.id),
    [templates, selectedCase?.id],
  )
  const selectedPrivateNotes = useMemo(
    () => privateNotes.filter((item) => item.matterId === selectedCase?.id),
    [privateNotes, selectedCase?.id],
  )

  const portalClient = clients.find((client) => client.id === portalClientId) ?? clients[0]
  const portalMatters = useMemo(
    () => cases.filter((matter) => matter.client === portalClient?.name),
    [cases, portalClient?.name],
  )
  const portalMatterIds = useMemo(() => new Set(portalMatters.map((matter) => matter.id)), [portalMatters])
  const portalDocuments = documents.filter((document) => portalMatterIds.has(document.matterId))
  const portalInvoices = invoices.filter((invoice) => portalMatterIds.has(invoice.matterId))
  const portalCommunications = communications.filter((communication) => portalMatterIds.has(communication.matterId))
  const portalUpdates = timelineEvents.filter((event) => portalMatterIds.has(event.matterId)).slice(0, 4)
  const portalHearings = hearings.filter((hearing) =>
    portalMatters.some((matter) => matter.title === hearing.caseTitle),
  )

  const activeMatterCount = cases.filter((item) => item.status === 'Active').length
  const openTasks = tasks.filter((item) => !item.completed)
  const highPriorityTasks = openTasks.filter((item) => item.priority === 'High').length
  const unpaidInvoiceValue = invoices
    .filter((item) => item.status !== 'Paid')
    .reduce((total, item) => total + invoiceTotal(item), 0)
  const pendingCommunications = communications.filter((item) => item.status !== 'Sent').length
  const openDeadlineCount = deadlines.filter((item) => item.status !== 'Filed').length
  const globalResults = useMemo(() => {
    const query = globalSearch.trim().toLowerCase()
    if (!query) return []

    return [
      ...cases.map((item) => ({ type: 'Matter', title: item.title, detail: `${item.client} | ${item.caseNo}` })),
      ...clients.map((item) => ({ type: 'Client', title: item.name, detail: `${item.city} | ${item.email}` })),
      ...documents.map((item) => ({ type: 'Document', title: item.name, detail: item.fileName })),
      ...invoices.map((item) => ({ type: 'Invoice', title: item.invoiceNo, detail: `${item.client} | ${item.status}` })),
      ...communications.map((item) => ({ type: 'Message', title: item.subject, detail: `${item.channel} | ${item.status}` })),
      ...courts.map((item) => ({ type: 'Court', title: item.name, detail: `${item.city} | ${item.type}` })),
    ].filter((item) => `${item.type} ${item.title} ${item.detail}`.toLowerCase().includes(query)).slice(0, 8)
  }, [cases, clients, communications, courts, documents, globalSearch, invoices])
  const canViewAudit = activeRole === 'Admin' || activeRole === 'Staff'

  function logAudit(action: string, target: string, detail: string) {
    const event: AuditEvent = {
      id: makeId('AUD'),
      action,
      actorRole: activeRole,
      target,
      detail,
      time: new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
      }).format(new Date()),
    }

    setAuditEvents((current) => [event, ...current].slice(0, 80))
  }
  const isClientRole = activeRole === 'Client'
  const canEditRecords = activeRole === 'Admin' || activeRole === 'Lawyer' || activeRole === 'Staff'
  const canDeleteRecords = activeRole === 'Admin'
  const canManageBilling = activeRole === 'Admin' || activeRole === 'Staff'
  const canUseInternalWorkspace = !isClientRole
  const visibleWorkspaceViews = isClientRole
    ? (['Portal'] as WorkspaceView[])
    : workspaceViews.filter((view) => view !== 'Admin' || canViewAudit)

  function openForm(kind: FormKind) {
    setActiveForm(kind)
    setEditingMatterId(null)
    setEditingClientId(null)
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setAuthMessage('Supabase is not configured.')
      return
    }

    setAuthMessage('Signing in...')
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    })

    if (error) {
      setAuthMessage(error.message)
      return
    }

    setAuthPassword('')
    setAuthMessage('Signed in.')
  }

  async function handleSignOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setAuthProfile(null)
    setAuthMessage('Signed out.')
  }

  async function handleClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const clientInput: Omit<Client, 'id'> = {
      name: String(data.get('name')),
      type: String(data.get('type')),
      phone: String(data.get('phone')),
      email: String(data.get('email')),
      city: String(data.get('city')),
    }

    if (editingClientId) {
      const savedClient = authProfile
        ? await saveClientToSupabase(clientInput, editingClientId)
        : { ...clientInput, id: editingClientId }

      if (!savedClient) return

      setClients((current) => current.map((item) => (item.id === editingClientId ? savedClient : item)))
      setEditingClientId(null)
      logAudit('Client updated', savedClient.name, `${savedClient.type} client details were updated.`)
      if (authProfile) setAuthMessage('Client updated in Supabase.')
    } else {
      const savedClient = authProfile
        ? await saveClientToSupabase(clientInput)
        : { ...clientInput, id: makeId('CLI') }

      if (!savedClient) return

      setClients((current) => [savedClient, ...current])
      logAudit('Client created', savedClient.name, `${savedClient.type} client record created for ${savedClient.city}.`)
      if (authProfile) setAuthMessage('Client saved to Supabase.')
    }

    event.currentTarget.reset()
  }

  function handleMatterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const matter: LegalCase = {
      id: makeId('MAT'),
      title: String(data.get('title')),
      client: String(data.get('client')),
      court: String(data.get('court')),
      caseNo: String(data.get('caseNo')),
      status: String(data.get('status')) as CaseStatus,
      nextDate: String(data.get('nextDate')),
      owner: String(data.get('owner')),
      balance: String(data.get('balance')),
    }

    if (editingMatterId) {
      setCases((current) => current.map((item) => (item.id === editingMatterId ? { ...matter, id: item.id } : item)))
      setSelectedCaseId(editingMatterId)
      setEditingMatterId(null)
      logAudit('Matter updated', matter.title, `${matter.caseNo} updated for ${matter.court}.`)
    } else {
      setCases((current) => [matter, ...current])
      setSelectedCaseId(matter.id)
      logAudit('Matter created', matter.title, `${matter.caseNo} opened for ${matter.client}.`)
      setTimelineEvents((current) => [
        {
          id: makeId('TL'),
          matterId: matter.id,
          date: matter.nextDate,
          category: 'Note',
          title: 'Matter opened',
          body: `${matter.client} matter created for ${matter.court}.`,
          author: matter.owner,
        },
        ...current,
      ])
    }

    event.currentTarget.reset()
  }

  function handleHearingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const hearing: Hearing = {
      id: makeId('HEA'),
      time: String(data.get('time')),
      caseTitle: String(data.get('caseTitle')),
      court: String(data.get('court')),
      purpose: String(data.get('purpose')),
    }

    setHearings((current) => [hearing, ...current])
    logAudit('Hearing scheduled', hearing.caseTitle, `${hearing.purpose} at ${hearing.time}, ${hearing.court}.`)
    const linkedMatter = cases.find((matter) => matter.title === hearing.caseTitle)
    if (linkedMatter) {
      setTimelineEvents((current) => [
        {
          id: makeId('TL'),
          matterId: linkedMatter.id,
          date: 'Scheduled',
          category: 'Hearing',
          title: hearing.purpose,
          body: `${hearing.time} at ${hearing.court}.`,
          author: 'System',
        },
        ...current,
      ])
    }
    event.currentTarget.reset()
  }

  function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const task: Task = {
      id: makeId('TSK'),
      title: String(data.get('title')),
      matter: String(data.get('matter')),
      due: String(data.get('due')),
      priority: String(data.get('priority')) as Priority,
    }

    setTasks((current) => [task, ...current])
    logAudit('Task created', task.matter, `${task.priority} priority task: ${task.title}.`)
    const linkedMatter = cases.find((matter) => matter.title === task.matter)
    if (linkedMatter) {
      setTimelineEvents((current) => [
        {
          id: makeId('TL'),
          matterId: linkedMatter.id,
          date: task.due,
          category: 'Note',
          title: `Task added: ${task.title}`,
          body: `${task.priority} priority work item added to the matter queue.`,
          author: 'System',
        },
        ...current,
      ])
    }
    event.currentTarget.reset()
  }

  function handleTimelineSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCase) return

    const data = new FormData(event.currentTarget)
    const entry: TimelineEvent = {
      id: makeId('TL'),
      matterId: selectedCase.id,
      date: String(data.get('date')),
      category: String(data.get('category')) as TimelineCategory,
      title: String(data.get('title')),
      body: String(data.get('body')),
      author: String(data.get('author')),
    }

    setTimelineEvents((current) => [entry, ...current])
    logAudit('Timeline entry added', selectedCase.title, `${entry.category}: ${entry.title}.`)
    event.currentTarget.reset()
  }

  function handleDocumentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCase) return

    const data = new FormData(event.currentTarget)
    const file = data.get('file') as File | null
    const document: MatterDocument = {
      id: makeId('DOC'),
      matterId: selectedCase.id,
      name: String(data.get('name')),
      category: String(data.get('category')) as DocumentCategory,
      filedOn: String(data.get('filedOn')),
      owner: String(data.get('owner')),
      fileName: file?.name || String(data.get('fileName')) || 'Document pending upload',
      note: String(data.get('note')),
    }

    setDocuments((current) => [document, ...current])
    logAudit('Document added', selectedCase.title, `${document.category} document ${document.name} indexed.`)
    setTimelineEvents((current) => [
      {
        id: makeId('TL'),
        matterId: selectedCase.id,
        date: document.filedOn,
        category: document.category === 'Invoice' ? 'Invoice' : 'Document',
        title: `${document.category}: ${document.name}`,
        body: `${document.fileName} added by ${document.owner}. ${document.note}`,
        author: document.owner,
      },
      ...current,
    ])
    event.currentTarget.reset()
  }

  function handleInvoiceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCase) return

    const data = new FormData(event.currentTarget)
    const invoice: Invoice = {
      id: makeId('INV'),
      matterId: selectedCase.id,
      invoiceNo: String(data.get('invoiceNo')),
      client: selectedCase.client,
      issueDate: String(data.get('issueDate')),
      dueDate: String(data.get('dueDate')),
      professionalFee: Number(data.get('professionalFee')),
      gstRate: Number(data.get('gstRate')),
      tds: Number(data.get('tds')),
      status: String(data.get('status')) as InvoiceStatus,
      note: String(data.get('note')),
    }

    setInvoices((current) => [invoice, ...current])
    logAudit('Invoice created', selectedCase.title, `${invoice.invoiceNo} for ${formatInr(invoiceTotal(invoice))}.`)
    setTimelineEvents((current) => [
      {
        id: makeId('TL'),
        matterId: selectedCase.id,
        date: invoice.issueDate,
        category: 'Invoice',
        title: `Invoice ${invoice.invoiceNo} ${invoice.status.toLowerCase()}`,
        body: `${formatInr(invoiceTotal(invoice))} billed to ${invoice.client}. ${invoice.note}`,
        author: 'Billing',
      },
      ...current,
    ])
    event.currentTarget.reset()
  }

  function handleCommunicationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCase) return

    const data = new FormData(event.currentTarget)
    const communication: Communication = {
      id: makeId('COM'),
      matterId: selectedCase.id,
      client: selectedCase.client,
      channel: String(data.get('channel')) as CommunicationChannel,
      status: String(data.get('status')) as CommunicationStatus,
      subject: String(data.get('subject')),
      message: String(data.get('message')),
      date: String(data.get('date')),
      sender: String(data.get('sender')),
    }

    setCommunications((current) => [communication, ...current])
    logAudit('Client message created', selectedCase.title, `${communication.channel} ${communication.status}: ${communication.subject}.`)
    setTimelineEvents((current) => [
      {
        id: makeId('TL'),
        matterId: selectedCase.id,
        date: communication.date,
        category: 'Client Update',
        title: `${communication.channel} ${communication.status.toLowerCase()}: ${communication.subject}`,
        body: communication.message,
        author: communication.sender,
      },
      ...current,
    ])
    event.currentTarget.reset()
  }

  function handleCauseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCase) return
    const data = new FormData(event.currentTarget)
    const entry: CauseListEntry = {
      id: makeId('CL'),
      matterId: selectedCase.id,
      date: String(data.get('date')),
      court: String(data.get('court')),
      bench: String(data.get('bench')),
      courtroom: String(data.get('courtroom')),
      itemNo: String(data.get('itemNo')),
      stage: String(data.get('stage')),
      nextAction: String(data.get('nextAction')),
    }
    setCauseList((current) => [entry, ...current])
    logAudit('Cause list entry added', selectedCase.title, `${entry.date} ${entry.itemNo} before ${entry.bench}.`)
    event.currentTarget.reset()
  }

  function handleDeadlineSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCase) return
    const data = new FormData(event.currentTarget)
    const deadline: Deadline = {
      id: makeId('DL'),
      matterId: selectedCase.id,
      title: String(data.get('title')),
      dueDate: String(data.get('dueDate')),
      basis: String(data.get('basis')),
      status: String(data.get('status')) as DeadlineStatus,
    }
    setDeadlines((current) => [deadline, ...current])
    logAudit('Deadline added', selectedCase.title, `${deadline.title} due ${deadline.dueDate}.`)
    event.currentTarget.reset()
  }

  function handleTemplateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCase) return
    const data = new FormData(event.currentTarget)
    const template: TemplateDraft = {
      id: makeId('TPL'),
      matterId: selectedCase.id,
      templateType: String(data.get('templateType')),
      title: String(data.get('title')),
      content: String(data.get('content')),
      createdBy: String(data.get('createdBy')),
    }
    setTemplates((current) => [template, ...current])
    logAudit('Template generated', selectedCase.title, `${template.templateType}: ${template.title}.`)
    event.currentTarget.reset()
  }

  function handlePrivateNoteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCase) return
    const data = new FormData(event.currentTarget)
    const note: PrivateNote = {
      id: makeId('PN'),
      matterId: selectedCase.id,
      title: String(data.get('title')),
      note: String(data.get('note')),
      author: String(data.get('author')),
      sensitivity: String(data.get('sensitivity')) as PrivateNote['sensitivity'],
    }
    setPrivateNotes((current) => [note, ...current])
    logAudit('Private strategy note added', selectedCase.title, `${note.sensitivity}: ${note.title}.`)
    event.currentTarget.reset()
  }

  function handleCourtSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const court: CourtDirectoryEntry = {
      id: makeId('CRT'),
      name: String(data.get('name')),
      city: String(data.get('city')),
      type: String(data.get('type')),
      contact: String(data.get('contact')),
      filingNotes: String(data.get('filingNotes')),
    }
    setCourts((current) => [court, ...current])
    logAudit('Court directory entry added', court.name, `${court.type} in ${court.city}.`)
    event.currentTarget.reset()
  }

  function handleTeamSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const member: TeamMember = {
      id: makeId('TM'),
      name: String(data.get('name')),
      role: String(data.get('role')),
      location: String(data.get('location')),
      activeMatters: Number(data.get('activeMatters')),
      openTasks: Number(data.get('openTasks')),
    }
    setTeamMembers((current) => [member, ...current])
    logAudit('Team member added', member.name, `${member.role} in ${member.location}.`)
    event.currentTarget.reset()
  }

  function startMatterEdit(id: string) {
    setEditingMatterId(id)
    setEditingClientId(null)
    setActiveForm('matter')
  }

  function startClientEdit(id: string) {
    setEditingClientId(id)
    setEditingMatterId(null)
    setActiveForm('client')
  }

  function deleteMatter(id: string) {
    const matter = cases.find((item) => item.id === id)
    setCases((current) => current.filter((item) => item.id !== id))
    if (selectedCaseId === id) {
      const nextCase = cases.find((item) => item.id !== id)
      setSelectedCaseId(nextCase?.id ?? '')
    }
    if (editingMatterId === id) setEditingMatterId(null)
    setTimelineEvents((current) => current.filter((item) => item.matterId !== id))
    setDocuments((current) => current.filter((item) => item.matterId !== id))
    setInvoices((current) => current.filter((item) => item.matterId !== id))
    setCommunications((current) => current.filter((item) => item.matterId !== id))
    logAudit('Matter deleted', matter?.title ?? id, 'Matter and linked records were removed from local workspace.')
  }

  async function deleteClient(id: string) {
    const client = clients.find((item) => item.id === id)
    if (supabase && authProfile) {
      const { error } = await supabase.from('clients').delete().eq('id', id).eq('firm_id', authProfile.firmId)
      if (error) {
        setAuthMessage(`Supabase client delete failed: ${error.message}`)
        return
      }
      setAuthMessage('Client deleted from Supabase.')
    }

    setClients((current) => current.filter((item) => item.id !== id))
    if (editingClientId === id) setEditingClientId(null)
    if (portalClientId === id) {
      const nextClient = clients.find((item) => item.id !== id)
      setPortalClientId(nextClient?.id ?? '')
    }
    logAudit('Client deleted', client?.name ?? id, 'Client record removed from local workspace.')
  }

  function toggleTask(id: string) {
    const task = tasks.find((item) => item.id === id)
    setTasks((current) =>
      current.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
    )
    if (task) logAudit(task.completed ? 'Task reopened' : 'Task completed', task.matter, task.title)
  }

  function deleteTask(id: string) {
    const task = tasks.find((item) => item.id === id)
    setTasks((current) => current.filter((item) => item.id !== id))
    logAudit('Task deleted', task?.matter ?? id, task?.title ?? 'Task removed.')
  }

  function deleteTimelineEvent(id: string) {
    const event = timelineEvents.find((item) => item.id === id)
    setTimelineEvents((current) => current.filter((item) => item.id !== id))
    logAudit('Timeline entry deleted', event?.title ?? id, event?.body ?? 'Timeline entry removed.')
  }

  function deleteDocument(id: string) {
    const document = documents.find((item) => item.id === id)
    setDocuments((current) => current.filter((item) => item.id !== id))
    logAudit('Document deleted', document?.name ?? id, document?.fileName ?? 'Document record removed.')
  }

  function markInvoicePaid(id: string) {
    const invoice = invoices.find((item) => item.id === id)
    setInvoices((current) => current.map((item) => (item.id === id ? { ...item, status: 'Paid' } : item)))

    if (invoice) {
      logAudit('Invoice marked paid', invoice.invoiceNo, `${formatInr(invoiceTotal(invoice))} marked paid.`)
      setTimelineEvents((current) => [
        {
          id: makeId('TL'),
          matterId: invoice.matterId,
          date: 'Paid',
          category: 'Invoice',
          title: `Payment received for ${invoice.invoiceNo}`,
          body: `${formatInr(invoiceTotal(invoice))} marked paid after GST and TDS adjustment.`,
          author: 'Billing',
        },
        ...current,
      ])
    }
  }

  function deleteInvoice(id: string) {
    const invoice = invoices.find((item) => item.id === id)
    setInvoices((current) => current.filter((item) => item.id !== id))
    logAudit('Invoice deleted', invoice?.invoiceNo ?? id, invoice ? formatInr(invoiceTotal(invoice)) : 'Invoice removed.')
  }

  function markCommunicationSent(id: string) {
    const communication = communications.find((item) => item.id === id)
    setCommunications((current) => current.map((item) => (item.id === id ? { ...item, status: 'Sent' } : item)))

    if (communication) {
      logAudit('Client message sent', communication.subject, `${communication.channel} message marked sent.`)
      setTimelineEvents((current) => [
        {
          id: makeId('TL'),
          matterId: communication.matterId,
          date: 'Sent',
          category: 'Client Update',
          title: `${communication.channel} sent: ${communication.subject}`,
          body: communication.message,
          author: communication.sender,
        },
        ...current,
      ])
    }
  }

  function deleteCommunication(id: string) {
    const communication = communications.find((item) => item.id === id)
    setCommunications((current) => current.filter((item) => item.id !== id))
    logAudit('Client message deleted', communication?.subject ?? id, communication?.channel ?? 'Message removed.')
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark">IL</span>
          <div>
            <strong>Indian Legal CRM</strong>
            <span>Practice command center</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              className={activeNav === item ? 'nav-item active' : 'nav-item'}
              key={item}
              onClick={() => setActiveNav(item)}
              type="button"
            >
              <span aria-hidden="true">{item.slice(0, 1)}</span>
              {item}
            </button>
          ))}
        </nav>

        <section className="security-panel">
          <span className="section-label">Compliance</span>
          <strong>DPDPA-ready data room</strong>
          <p>Role access, audit trail, India-region hosting, and encrypted files are planned for the production build.</p>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="section-label">MVP Workspace</span>
            <h1>Legal practice operations</h1>
          </div>
          <div className="topbar-actions">
            <label className="role-switcher">
              Role
              <select onChange={(event) => setActiveRole(event.target.value as UserRole)} value={activeRole}>
                {userRoles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
            {canEditRecords && (
              <>
                <button className="secondary-action" onClick={() => openForm('client')} type="button">New client</button>
                <button className="primary-action" onClick={() => openForm('matter')} type="button">New matter</button>
              </>
            )}
          </div>
        </header>

        <section className="role-panel" aria-label="Current role permissions">
          <div>
            <span className="section-label">Viewing As</span>
            <strong>{activeRole}</strong>
          </div>
          <p>
            {activeRole === 'Admin' && 'Full internal access, including deletes, billing, records, portal preview, and configuration.'}
            {activeRole === 'Lawyer' && 'Matter-focused access for case work, notes, hearings, tasks, documents, and client updates.'}
            {activeRole === 'Staff' && 'Operations access for data entry, hearings, tasks, documents, invoices, and follow-ups.'}
            {activeRole === 'Client' && 'Client-facing access limited to linked matters, hearings, documents, invoices, and updates.'}
          </p>
          <span className={backendStatus === 'connected' ? 'backend-pill connected' : 'backend-pill'}>
            {backendStatus === 'checking' && 'Checking Supabase'}
            {backendStatus === 'connected' && 'Supabase connected'}
            {backendStatus === 'error' && 'Schema created, API blocked'}
            {backendStatus === 'local' && 'Local prototype'}
          </span>
        </section>

        <section className="auth-panel" aria-label="Supabase login">
          {authProfile ? (
            <div className="auth-card signed-in">
              <div>
                <span className="section-label">Signed In</span>
                <strong>{authProfile.fullName}</strong>
                <p>{authProfile.email} | {authProfile.role}</p>
              </div>
              <button className="secondary-action" onClick={handleSignOut} type="button">Sign out</button>
            </div>
          ) : (
            <form className="auth-card" onSubmit={handleSignIn}>
              <div>
                <span className="section-label">Supabase Login</span>
                <strong>Sign in to load your real profile</strong>
              </div>
              <input
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="Email"
                type="email"
                value={authEmail}
                required
              />
              <input
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="Password"
                type="password"
                value={authPassword}
                required
              />
              <button className="primary-action" type="submit">Sign in</button>
            </form>
          )}
          {authMessage && <p className="auth-message">{authMessage}</p>}
        </section>

        <nav className="workspace-tabs" aria-label="Workspace sections">
          {visibleWorkspaceViews.map((view) => (
            <button
              className={activeWorkspace === view || (isClientRole && view === 'Portal') ? 'workspace-tab active' : 'workspace-tab'}
              key={view}
              onClick={() => setActiveWorkspace(view)}
              type="button"
            >
              {view}
            </button>
          ))}
        </nav>

        {canUseInternalWorkspace && activeWorkspace === 'Overview' && <section className="metrics-grid" aria-label="Practice metrics">
          <article>
            <span>Active matters</span>
            <strong>{activeMatterCount}</strong>
            <p>{cases.length} total matters in register</p>
          </article>
          <article>
            <span>Pending deadlines</span>
            <strong>{openTasks.length}</strong>
            <p>{highPriorityTasks} high-priority tasks</p>
          </article>
          <article>
            <span>Client records</span>
            <strong>{clients.length}</strong>
            <p>Contacts ready for portal access</p>
          </article>
          <article>
            <span>Hearings listed</span>
            <strong>{hearings.length}</strong>
            <p>Calendar entries in local workspace</p>
          </article>
          <article>
            <span>Documents</span>
            <strong>{documents.length}</strong>
            <p>Matter files indexed locally</p>
          </article>
          <article>
            <span>Unpaid invoices</span>
            <strong>{formatInr(unpaidInvoiceValue)}</strong>
            <p>{invoices.filter((item) => item.status !== 'Paid').length} invoices need follow-up</p>
          </article>
          <article>
            <span>Client updates</span>
            <strong>{pendingCommunications}</strong>
            <p>Draft or scheduled messages</p>
          </article>
          <article>
            <span>Open deadlines</span>
            <strong>{openDeadlineCount}</strong>
            <p>Limitation and filing trackers</p>
          </article>
        </section>}

        {(activeWorkspace === 'Portal' || isClientRole) && <section className="portal-panel" aria-label="Client portal preview">
          <div className="panel-header portal-header">
            <div>
              <span className="section-label">Client Portal Preview</span>
              <h2>{portalClient?.name ?? 'No client selected'}</h2>
            </div>
            <label className="portal-client-select">
              Client
              <select onChange={(event) => setPortalClientId(event.target.value)} value={portalClient?.id ?? ''}>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="portal-summary">
            <article>
              <span>Matters</span>
              <strong>{portalMatters.length}</strong>
            </article>
            <article>
              <span>Next hearings</span>
              <strong>{portalHearings.length}</strong>
            </article>
            <article>
              <span>Shared documents</span>
              <strong>{portalDocuments.length}</strong>
            </article>
            <article>
              <span>Open invoices</span>
              <strong>{portalInvoices.filter((invoice) => invoice.status !== 'Paid').length}</strong>
            </article>
            <article>
              <span>Messages</span>
              <strong>{portalCommunications.filter((communication) => communication.status === 'Sent').length}</strong>
            </article>
          </div>

          <div className="portal-grid">
            <div className="portal-column">
              <h3>Case status</h3>
              {portalMatters.map((matter) => (
                <article className="portal-item" key={matter.id}>
                  <strong>{matter.title}</strong>
                  <small>{matter.court} | {matter.caseNo}</small>
                  <span className={`status ${matter.status.toLowerCase().replace(' ', '-')}`}>{matter.status}</span>
                </article>
              ))}
              {portalMatters.length === 0 && <p className="empty-state soft">No matters are linked to this client.</p>}
            </div>

            <div className="portal-column">
              <h3>Hearings</h3>
              {portalHearings.map((hearing) => (
                <article className="portal-item" key={hearing.id}>
                  <strong>{hearing.caseTitle}</strong>
                  <small>{hearing.time} | {hearing.court}</small>
                  <p>{hearing.purpose}</p>
                </article>
              ))}
              {portalHearings.length === 0 && <p className="empty-state soft">No upcoming hearings for this client.</p>}
            </div>

            <div className="portal-column">
              <h3>Documents</h3>
              {portalDocuments.slice(0, 3).map((document) => (
                <article className="portal-item" key={document.id}>
                  <strong>{document.name}</strong>
                  <small>{document.category} | {document.fileName}</small>
                </article>
              ))}
              {portalDocuments.length === 0 && <p className="empty-state soft">No shared documents yet.</p>}
            </div>

            <div className="portal-column">
              <h3>Invoices</h3>
              {portalInvoices.slice(0, 3).map((invoice) => (
                <article className="portal-item" key={invoice.id}>
                  <strong>{formatInr(invoiceTotal(invoice))}</strong>
                  <small>{invoice.invoiceNo} | Due {invoice.dueDate}</small>
                  <span className={`invoice-status ${invoice.status.toLowerCase()}`}>{invoice.status}</span>
                </article>
              ))}
              {portalInvoices.length === 0 && <p className="empty-state soft">No invoices visible to this client.</p>}
            </div>

            <div className="portal-column">
              <h3>Messages</h3>
              {portalCommunications.filter((communication) => communication.status === 'Sent').slice(0, 3).map((communication) => (
                <article className="portal-item" key={communication.id}>
                  <strong>{communication.subject}</strong>
                  <small>{communication.channel} | {communication.date}</small>
                  <p>{communication.message}</p>
                </article>
              ))}
              {portalCommunications.filter((communication) => communication.status === 'Sent').length === 0 && (
                <p className="empty-state soft">No sent messages visible to this client.</p>
              )}
            </div>
          </div>

          <div className="portal-updates">
            <h3>Recent updates</h3>
            {portalUpdates.map((event) => (
              <article className="portal-update" key={event.id}>
                <span className={`timeline-tag ${event.category.toLowerCase().replace(' ', '-')}`}>{event.category}</span>
                <div>
                  <strong>{event.title}</strong>
                  <small>{event.date} | {event.author}</small>
                </div>
              </article>
            ))}
            {portalUpdates.length === 0 && <p className="empty-state soft">No client-facing updates yet.</p>}
          </div>
        </section>}

        {canUseInternalWorkspace && activeWorkspace === 'Intake' && (
          <>
        <section className="entry-panel" aria-label="Create CRM records">
          <div className="entry-tabs">
            <button className={activeForm === 'client' ? 'tab active' : 'tab'} onClick={() => openForm('client')} type="button">Client</button>
            <button className={activeForm === 'matter' ? 'tab active' : 'tab'} onClick={() => openForm('matter')} type="button">Matter</button>
            <button className={activeForm === 'hearing' ? 'tab active' : 'tab'} onClick={() => openForm('hearing')} type="button">Hearing</button>
            <button className={activeForm === 'task' ? 'tab active' : 'tab'} onClick={() => openForm('task')} type="button">Task</button>
            <button className={activeForm === 'timeline' ? 'tab active' : 'tab'} onClick={() => openForm('timeline')} type="button">Timeline</button>
            <button className={activeForm === 'document' ? 'tab active' : 'tab'} onClick={() => openForm('document')} type="button">Document</button>
            {canManageBilling && (
              <button className={activeForm === 'invoice' ? 'tab active' : 'tab'} onClick={() => openForm('invoice')} type="button">Invoice</button>
            )}
            <button className={activeForm === 'communication' ? 'tab active' : 'tab'} onClick={() => openForm('communication')} type="button">Message</button>
            <button className={activeForm === 'cause' ? 'tab active' : 'tab'} onClick={() => openForm('cause')} type="button">Cause list</button>
            <button className={activeForm === 'deadline' ? 'tab active' : 'tab'} onClick={() => openForm('deadline')} type="button">Deadline</button>
            <button className={activeForm === 'template' ? 'tab active' : 'tab'} onClick={() => openForm('template')} type="button">Template</button>
            <button className={activeForm === 'privateNote' ? 'tab active' : 'tab'} onClick={() => openForm('privateNote')} type="button">Strategy</button>
            <button className={activeForm === 'court' ? 'tab active' : 'tab'} onClick={() => openForm('court')} type="button">Court</button>
            <button className={activeForm === 'team' ? 'tab active' : 'tab'} onClick={() => openForm('team')} type="button">Team</button>
          </div>

          {activeForm === 'client' && (
            <form className="record-form" key={editingClient?.id ?? 'new-client'} onSubmit={handleClientSubmit}>
              <label>
                Client name
                <input
                  defaultValue={editingClient?.name}
                  name="name"
                  placeholder="Example: Zenith Infra Pvt Ltd"
                  required
                />
              </label>
              <label>
                Type
                <select defaultValue={editingClient?.type ?? 'Corporate'} name="type" required>
                  <option>Corporate</option>
                  <option>Individual</option>
                  <option>Government</option>
                  <option>NGO</option>
                </select>
              </label>
              <label>
                Phone
                <input defaultValue={editingClient?.phone} name="phone" placeholder="+91 ..." required />
              </label>
              <label>
                Email
                <input
                  defaultValue={editingClient?.email}
                  name="email"
                  placeholder="client@example.com"
                  type="email"
                  required
                />
              </label>
              <label>
                City
                <input defaultValue={editingClient?.city} name="city" placeholder="Mumbai" required />
              </label>
              <button className="primary-action" type="submit">{editingClient ? 'Update client' : 'Save client'}</button>
            </form>
          )}

          {activeForm === 'matter' && (
            <form className="record-form" key={editingMatter?.id ?? 'new-matter'} onSubmit={handleMatterSubmit}>
              <label>
                Matter title
                <input
                  defaultValue={editingMatter?.title}
                  name="title"
                  placeholder="Client v. Opposite Party"
                  required
                />
              </label>
              <label>
                Client
                <select defaultValue={editingMatter?.client} name="client" required>
                  {clients.map((client) => (
                    <option key={client.id}>{client.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Court / forum
                <input defaultValue={editingMatter?.court} name="court" placeholder="Bombay High Court" required />
              </label>
              <label>
                Case number
                <input defaultValue={editingMatter?.caseNo} name="caseNo" placeholder="WP 1234/2026" required />
              </label>
              <label>
                Status
                <select defaultValue={editingMatter?.status ?? 'Active'} name="status" required>
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                Next date
                <input defaultValue={editingMatter?.nextDate} name="nextDate" placeholder="28 May" required />
              </label>
              <label>
                Owner
                <input defaultValue={editingMatter?.owner} name="owner" placeholder="A. Sharma" required />
              </label>
              <label>
                Outstanding
                <input defaultValue={editingMatter?.balance} name="balance" placeholder="Rs 50,000" required />
              </label>
              <button className="primary-action" type="submit">{editingMatter ? 'Update matter' : 'Save matter'}</button>
            </form>
          )}

          {activeForm === 'hearing' && (
            <form className="record-form" onSubmit={handleHearingSubmit}>
              <label>
                Time
                <input name="time" required type="time" />
              </label>
              <label>
                Matter
                <select name="caseTitle" required>
                  {cases.map((matter) => (
                    <option key={matter.id}>{matter.title}</option>
                  ))}
                </select>
              </label>
              <label>
                Court room
                <input name="court" placeholder="Court 3, Delhi HC" required />
              </label>
              <label>
                Purpose
                <input name="purpose" placeholder="Arguments" required />
              </label>
              <button className="primary-action" type="submit">Save hearing</button>
            </form>
          )}

          {activeForm === 'task' && (
            <form className="record-form" onSubmit={handleTaskSubmit}>
              <label>
                Task
                <input name="title" placeholder="Prepare rejoinder draft" required />
              </label>
              <label>
                Matter
                <select name="matter" required>
                  {cases.map((matter) => (
                    <option key={matter.id}>{matter.title}</option>
                  ))}
                </select>
              </label>
              <label>
                Due
                <input name="due" placeholder="Tomorrow" required />
              </label>
              <label>
                Priority
                <select name="priority" required>
                  {priorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>
              <button className="primary-action" type="submit">Save task</button>
            </form>
          )}

          {activeForm === 'timeline' && selectedCase && (
            <form className="record-form timeline-form" onSubmit={handleTimelineSubmit}>
              <label>
                Date
                <input name="date" placeholder="21 May" required />
              </label>
              <label>
                Type
                <select name="category" required>
                  {timelineCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                Title
                <input name="title" placeholder="Order uploaded" required />
              </label>
              <label>
                Author
                <input name="author" placeholder="A. Sharma" required />
              </label>
              <label className="wide-field">
                Details
                <textarea name="body" placeholder="Briefly record what happened and what is next." required />
              </label>
              <button className="primary-action" type="submit">Add timeline entry</button>
            </form>
          )}

          {activeForm === 'document' && selectedCase && (
            <form className="record-form document-form" onSubmit={handleDocumentSubmit}>
              <label>
                Document name
                <input name="name" placeholder="Vakalatnama signed copy" required />
              </label>
              <label>
                Type
                <select name="category" required>
                  {documentCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input name="filedOn" placeholder="21 May" required />
              </label>
              <label>
                Owner
                <input name="owner" placeholder="A. Sharma" required />
              </label>
              <label>
                File
                <input name="file" type="file" />
              </label>
              <label className="wide-field">
                Note
                <textarea name="note" placeholder="Purpose, version, filing status, or client sharing note." required />
              </label>
              <button className="primary-action" type="submit">Add document</button>
            </form>
          )}

          {activeForm === 'invoice' && selectedCase && canManageBilling && (
            <form className="record-form invoice-form" onSubmit={handleInvoiceSubmit}>
              <label>
                Invoice no.
                <input name="invoiceNo" placeholder="INV-2026-003" required />
              </label>
              <label>
                Issue date
                <input name="issueDate" placeholder="21 May" required />
              </label>
              <label>
                Due date
                <input name="dueDate" placeholder="31 May" required />
              </label>
              <label>
                Professional fee
                <input min="0" name="professionalFee" placeholder="50000" required type="number" />
              </label>
              <label>
                GST %
                <input defaultValue="18" min="0" name="gstRate" required type="number" />
              </label>
              <label>
                TDS
                <input defaultValue="0" min="0" name="tds" required type="number" />
              </label>
              <label>
                Status
                <select name="status" required>
                  {invoiceStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="wide-field">
                Billing note
                <textarea name="note" placeholder="Scope covered, GST/TDS note, or payment instruction." required />
              </label>
              <button className="primary-action" type="submit">Add invoice</button>
            </form>
          )}

          {activeForm === 'communication' && selectedCase && (
            <form className="record-form communication-form" onSubmit={handleCommunicationSubmit}>
              <label>
                Channel
                <select name="channel" required>
                  {communicationChannels.map((channel) => (
                    <option key={channel}>{channel}</option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select name="status" required>
                  {communicationStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input name="date" placeholder="22 May" required />
              </label>
              <label>
                Sender
                <input name="sender" placeholder="A. Sharma" required />
              </label>
              <label className="wide-field">
                Subject
                <input name="subject" placeholder="Hearing update" required />
              </label>
              <label className="wide-field">
                Message
                <textarea name="message" placeholder="Client-facing update text." required />
              </label>
              <button className="primary-action" type="submit">Add message</button>
            </form>
          )}

          {activeForm === 'cause' && selectedCase && (
            <form className="record-form" onSubmit={handleCauseSubmit}>
              <label>Date<input name="date" placeholder="24 May" required /></label>
              <label>Court<input name="court" placeholder="Bombay High Court" required /></label>
              <label>Bench<input name="bench" placeholder="Justice..." required /></label>
              <label>Courtroom<input name="courtroom" placeholder="Court 4" required /></label>
              <label>Item no.<input name="itemNo" placeholder="Item 37" required /></label>
              <label>Stage<input name="stage" placeholder="Admission" required /></label>
              <label className="wide-field">Next action<textarea name="nextAction" placeholder="What the team must carry or prepare." required /></label>
              <button className="primary-action" type="submit">Add cause list</button>
            </form>
          )}

          {activeForm === 'deadline' && selectedCase && (
            <form className="record-form" onSubmit={handleDeadlineSubmit}>
              <label>Deadline<input name="title" placeholder="File rejoinder affidavit" required /></label>
              <label>Due date<input name="dueDate" placeholder="28 May" required /></label>
              <label>Status<select name="status" required>{deadlineStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="wide-field">Basis<textarea name="basis" placeholder="Court order, limitation, registry objection, or internal target." required /></label>
              <button className="primary-action" type="submit">Add deadline</button>
            </form>
          )}

          {activeForm === 'template' && selectedCase && (
            <form className="record-form" onSubmit={handleTemplateSubmit}>
              <label>Template type<input name="templateType" placeholder="Legal notice" required /></label>
              <label>Title<input name="title" placeholder="Notice for recovery" required /></label>
              <label>Created by<input name="createdBy" placeholder="A. Sharma" required /></label>
              <label className="wide-field">Draft content<textarea name="content" placeholder="Template skeleton or clauses." required /></label>
              <button className="primary-action" type="submit">Save template</button>
            </form>
          )}

          {activeForm === 'privateNote' && selectedCase && (
            <form className="record-form" onSubmit={handlePrivateNoteSubmit}>
              <label>Title<input name="title" placeholder="Cross-examination angle" required /></label>
              <label>Author<input name="author" placeholder="A. Sharma" required /></label>
              <label>Sensitivity<select name="sensitivity" required><option>Normal</option><option>Sensitive</option><option>Privileged</option></select></label>
              <label className="wide-field">Private note<textarea name="note" placeholder="Internal-only strategy note." required /></label>
              <button className="primary-action" type="submit">Add strategy note</button>
            </form>
          )}

          {activeForm === 'court' && (
            <form className="record-form" onSubmit={handleCourtSubmit}>
              <label>Court/forum<input name="name" placeholder="Bombay High Court" required /></label>
              <label>City<input name="city" placeholder="Mumbai" required /></label>
              <label>Type<input name="type" placeholder="High Court" required /></label>
              <label>Contact<input name="contact" placeholder="Registry counter" required /></label>
              <label className="wide-field">Filing notes<textarea name="filingNotes" placeholder="Local filing practice, registry notes, defects, timings." required /></label>
              <button className="primary-action" type="submit">Add court</button>
            </form>
          )}

          {activeForm === 'team' && (
            <form className="record-form" onSubmit={handleTeamSubmit}>
              <label>Name<input name="name" placeholder="N. Rao" required /></label>
              <label>Role<input name="role" placeholder="Associate" required /></label>
              <label>Location<input name="location" placeholder="Delhi" required /></label>
              <label>Active matters<input min="0" name="activeMatters" required type="number" /></label>
              <label>Open tasks<input min="0" name="openTasks" required type="number" /></label>
              <button className="primary-action" type="submit">Add team member</button>
            </form>
          )}
        </section>
          </>
        )}

        {canUseInternalWorkspace && activeWorkspace === 'Matter Hub' && (
          <>
        <section className="content-grid">
          <div className="matter-panel">
            <div className="panel-header">
              <div>
                <span className="section-label">Matters</span>
                <h2>Case register</h2>
              </div>
              <button className="text-action" onClick={() => openForm('matter')} type="button">Add matter</button>
            </div>

            <div className="filter-bar">
              <label>
                Search matters
                <input
                  onChange={(event) => setMatterSearch(event.target.value)}
                  placeholder="Client, court, case no., owner"
                  value={matterSearch}
                />
              </label>
              <label>
                Status
                <select
                  onChange={(event) => setMatterStatusFilter(event.target.value as CaseStatus | 'All')}
                  value={matterStatusFilter}
                >
                  <option>All</option>
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="case-list">
              {filteredCases.map((item) => (
                <article className="case-row-wrap" key={item.id}>
                  <button
                  className={selectedCase?.id === item.id ? 'case-row selected' : 'case-row'}
                  onClick={() => setSelectedCaseId(item.id)}
                  type="button"
                  >
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.client} | {item.caseNo}</small>
                    </span>
                    <span className={`status ${item.status.toLowerCase().replace(' ', '-')}`}>
                      {item.status}
                    </span>
                  </button>
                  <div className="row-actions">
                    {canEditRecords && <button className="text-action" onClick={() => startMatterEdit(item.id)} type="button">Edit</button>}
                    {canDeleteRecords && <button className="danger-action" onClick={() => deleteMatter(item.id)} type="button">Delete</button>}
                  </div>
                </article>
              ))}
              {filteredCases.length === 0 && <p className="empty-state">No matters match the current search.</p>}
            </div>
          </div>

          {selectedCase && (
            <aside className="case-detail" aria-label="Selected matter details">
              <span className="section-label">{selectedCase.id}</span>
              <h2>{selectedCase.title}</h2>
              <dl>
                <div>
                  <dt>Court</dt>
                  <dd>{selectedCase.court}</dd>
                </div>
                <div>
                  <dt>Next date</dt>
                  <dd>{selectedCase.nextDate}</dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>{selectedCase.owner}</dd>
                </div>
                <div>
                  <dt>Outstanding</dt>
                  <dd>{selectedCase.balance}</dd>
                </div>
              </dl>
              <div className="detail-actions">
                {canEditRecords && <button className="secondary-action" onClick={() => openForm('task')} type="button">Add task</button>}
                {canEditRecords && <button className="secondary-action" onClick={() => startMatterEdit(selectedCase.id)} type="button">Edit matter</button>}
                {canEditRecords && <button className="secondary-action" onClick={() => openForm('timeline')} type="button">Add note</button>}
                {canEditRecords && <button className="secondary-action" onClick={() => openForm('document')} type="button">Add document</button>}
                {canManageBilling && <button className="secondary-action" onClick={() => openForm('invoice')} type="button">Add invoice</button>}
                {canEditRecords && <button className="secondary-action" onClick={() => openForm('communication')} type="button">Add message</button>}
                {canEditRecords && <button className="primary-action" onClick={() => openForm('hearing')} type="button">Schedule hearing</button>}
              </div>
            </aside>
          )}
        </section>

        {selectedCase && (
          <section className="timeline-panel" aria-label="Matter timeline">
            <div className="panel-header">
              <div>
                <span className="section-label">Matter Timeline</span>
                <h2>{selectedCase.title}</h2>
              </div>
              {canEditRecords && <button className="text-action" onClick={() => openForm('timeline')} type="button">Add entry</button>}
            </div>
            <div className="timeline-list">
              {selectedTimelineEvents.map((event) => (
                <article className="timeline-item" key={event.id}>
                  <div className="timeline-marker" aria-hidden="true"></div>
                  <div>
                    <div className="timeline-meta">
                      <span className={`timeline-tag ${event.category.toLowerCase().replace(' ', '-')}`}>
                        {event.category}
                      </span>
                      <span>{event.date}</span>
                      <span>{event.author}</span>
                    </div>
                    <strong>{event.title}</strong>
                    <p>{event.body}</p>
                  </div>
                  {canDeleteRecords && <button className="danger-action" onClick={() => deleteTimelineEvent(event.id)} type="button">Delete</button>}
                </article>
              ))}
              {selectedTimelineEvents.length === 0 && (
                <p className="empty-state">No timeline entries for this matter yet.</p>
              )}
            </div>
          </section>
        )}

        {selectedCase && (
          <section className="document-panel" aria-label="Matter documents">
            <div className="panel-header">
              <div>
                <span className="section-label">Documents</span>
                <h2>{selectedCase.title}</h2>
              </div>
              {canEditRecords && <button className="text-action" onClick={() => openForm('document')} type="button">Add document</button>}
            </div>
            <div className="document-list">
              {selectedDocuments.map((document) => (
                <article className="document-item" key={document.id}>
                  <span className={`document-icon ${document.category.toLowerCase()}`}>{document.category.slice(0, 1)}</span>
                  <div>
                    <div className="document-meta">
                      <span className="document-tag">{document.category}</span>
                      <span>{document.filedOn}</span>
                      <span>{document.owner}</span>
                    </div>
                    <strong>{document.name}</strong>
                    <small>{document.fileName}</small>
                    <p>{document.note}</p>
                  </div>
                  {canDeleteRecords && <button className="danger-action" onClick={() => deleteDocument(document.id)} type="button">Delete</button>}
                </article>
              ))}
              {selectedDocuments.length === 0 && (
                <p className="empty-state">No documents have been added to this matter yet.</p>
              )}
            </div>
          </section>
        )}

        {selectedCase && canManageBilling && (
          <section className="invoice-panel" aria-label="Matter invoices">
            <div className="panel-header">
              <div>
                <span className="section-label">Billing</span>
                <h2>{selectedCase.title}</h2>
              </div>
              <button className="text-action" onClick={() => openForm('invoice')} type="button">Add invoice</button>
            </div>
            <div className="invoice-list">
              {selectedInvoices.map((invoice) => {
                const gst = (invoice.professionalFee * invoice.gstRate) / 100
                return (
                  <article className="invoice-item" key={invoice.id}>
                    <div>
                      <div className="invoice-meta">
                        <span className={`invoice-status ${invoice.status.toLowerCase()}`}>{invoice.status}</span>
                        <span>{invoice.invoiceNo}</span>
                        <span>Due {invoice.dueDate}</span>
                      </div>
                      <strong>{formatInr(invoiceTotal(invoice))}</strong>
                      <small>
                        Fee {formatInr(invoice.professionalFee)} | GST {formatInr(gst)} | TDS {formatInr(invoice.tds)}
                      </small>
                      <p>{invoice.note}</p>
                    </div>
                    <div className="invoice-actions">
                      {invoice.status !== 'Paid' && (
                        <button className="secondary-action" onClick={() => markInvoicePaid(invoice.id)} type="button">
                          Mark paid
                        </button>
                      )}
                      {canDeleteRecords && <button className="danger-action" onClick={() => deleteInvoice(invoice.id)} type="button">Delete</button>}
                    </div>
                  </article>
                )
              })}
              {selectedInvoices.length === 0 && (
                <p className="empty-state">No invoices have been added to this matter yet.</p>
              )}
            </div>
          </section>
        )}

        {selectedCase && (
          <section className="communication-panel" aria-label="Client communications">
            <div className="panel-header">
              <div>
                <span className="section-label">Client Communication</span>
                <h2>{selectedCase.title}</h2>
              </div>
              {canEditRecords && <button className="text-action" onClick={() => openForm('communication')} type="button">Add message</button>}
            </div>
            <div className="communication-list">
              {selectedCommunications.map((communication) => (
                <article className="communication-item" key={communication.id}>
                  <div>
                    <div className="communication-meta">
                      <span className={`communication-channel ${communication.channel.toLowerCase()}`}>
                        {communication.channel}
                      </span>
                      <span className={`communication-status ${communication.status.toLowerCase()}`}>
                        {communication.status}
                      </span>
                      <span>{communication.date}</span>
                      <span>{communication.sender}</span>
                    </div>
                    <strong>{communication.subject}</strong>
                    <p>{communication.message}</p>
                  </div>
                  <div className="communication-actions">
                    {communication.status !== 'Sent' && canEditRecords && (
                      <button className="secondary-action" onClick={() => markCommunicationSent(communication.id)} type="button">
                        Mark sent
                      </button>
                    )}
                    {canDeleteRecords && (
                      <button className="danger-action" onClick={() => deleteCommunication(communication.id)} type="button">
                        Delete
                      </button>
                    )}
                  </div>
                </article>
              ))}
              {selectedCommunications.length === 0 && (
                <p className="empty-state">No client messages have been added to this matter yet.</p>
              )}
            </div>
          </section>
        )}
          </>
        )}

        {canViewAudit && activeWorkspace === 'Admin' && (
          <section className="audit-panel" aria-label="Compliance audit log">
            <div className="panel-header">
              <div>
                <span className="section-label">Compliance</span>
                <h2>Audit log</h2>
              </div>
              <span className="audit-count">{auditEvents.length} events</span>
            </div>
            <div className="audit-list">
              {auditEvents.slice(0, 12).map((event) => (
                <article className="audit-item" key={event.id}>
                  <span className="audit-role">{event.actorRole}</span>
                  <div>
                    <strong>{event.action}</strong>
                    <small>{event.target} | {event.time}</small>
                    <p>{event.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {canUseInternalWorkspace && activeWorkspace === 'Advanced' && <section className="advanced-panel" aria-label="Advanced legal operations">
          <div className="panel-header">
            <div>
              <span className="section-label">Advanced Legal Ops</span>
              <h2>Indian practice tools</h2>
            </div>
          </div>

          <div className="advanced-grid">
            <article className="advanced-card">
              <div className="card-heading">
                <span className="feature-badge">1</span>
                <h3>Cause list tracker</h3>
              </div>
              {selectedCauseList.map((item) => (
                <div className="mini-record" key={item.id}>
                  <strong>{item.date} | {item.itemNo}</strong>
                  <small>{item.courtroom} | {item.bench} | {item.stage}</small>
                  <p>{item.nextAction}</p>
                </div>
              ))}
            </article>

            <article className="advanced-card">
              <div className="card-heading">
                <span className="feature-badge">2</span>
                <h3>Limitation & deadlines</h3>
              </div>
              {selectedDeadlines.map((item) => (
                <div className="mini-record" key={item.id}>
                  <strong>{item.title}</strong>
                  <small>{item.dueDate} | {item.status}</small>
                  <p>{item.basis}</p>
                </div>
              ))}
            </article>

            <article className="advanced-card">
              <div className="card-heading">
                <span className="feature-badge">3</span>
                <h3>Document templates</h3>
              </div>
              {selectedTemplates.map((item) => (
                <div className="mini-record" key={item.id}>
                  <strong>{item.title}</strong>
                  <small>{item.templateType} | {item.createdBy}</small>
                  <p>{item.content}</p>
                </div>
              ))}
            </article>

            <article className="advanced-card">
              <div className="card-heading">
                <span className="feature-badge">4</span>
                <h3>Private strategy</h3>
              </div>
              {selectedPrivateNotes.map((item) => (
                <div className="mini-record" key={item.id}>
                  <strong>{item.title}</strong>
                  <small>{item.sensitivity} | {item.author}</small>
                  <p>{item.note}</p>
                </div>
              ))}
            </article>

            <article className="advanced-card">
              <div className="card-heading">
                <span className="feature-badge">5</span>
                <h3>Global search</h3>
              </div>
              <label className="inline-search">
                Search
                <input onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search all records" value={globalSearch} />
              </label>
              {globalResults.map((item) => (
                <div className="mini-record" key={`${item.type}-${item.title}`}>
                  <strong>{item.title}</strong>
                  <small>{item.type} | {item.detail}</small>
                </div>
              ))}
            </article>

            <article className="advanced-card">
              <div className="card-heading">
                <span className="feature-badge">6</span>
                <h3>Reports dashboard</h3>
              </div>
              <div className="report-grid">
                <span><strong>{cases.length}</strong> matters</span>
                <span><strong>{openTasks.length}</strong> open tasks</span>
                <span><strong>{openDeadlineCount}</strong> deadlines</span>
                <span><strong>{formatInr(unpaidInvoiceValue)}</strong> unpaid</span>
              </div>
            </article>

            <article className="advanced-card">
              <div className="card-heading">
                <span className="feature-badge">7</span>
                <h3>Court directory</h3>
              </div>
              {courts.slice(0, 4).map((item) => (
                <div className="mini-record" key={item.id}>
                  <strong>{item.name}</strong>
                  <small>{item.city} | {item.type} | {item.contact}</small>
                  <p>{item.filingNotes}</p>
                </div>
              ))}
            </article>

            <article className="advanced-card">
              <div className="card-heading">
                <span className="feature-badge">8</span>
                <h3>Team workload</h3>
              </div>
              {teamMembers.map((item) => (
                <div className="mini-record workload-row" key={item.id}>
                  <strong>{item.name}</strong>
                  <small>{item.role} | {item.location}</small>
                  <p>{item.activeMatters} matters | {item.openTasks} tasks</p>
                </div>
              ))}
            </article>
          </div>
        </section>}

        {canUseInternalWorkspace && activeWorkspace === 'Overview' && (
          <>
        <section className="bottom-grid">
          <div className="agenda-panel">
            <div className="panel-header">
              <div>
                <span className="section-label">Calendar</span>
                <h2>Upcoming hearings</h2>
              </div>
              {canEditRecords && <button className="text-action" onClick={() => openForm('hearing')} type="button">Add hearing</button>}
            </div>
            {hearings.map((item) => (
              <article className="agenda-item" key={item.id}>
                <time>{item.time}</time>
                <span>
                  <strong>{item.caseTitle}</strong>
                  <small>{item.court} | {item.purpose}</small>
                </span>
              </article>
            ))}
          </div>

          <div className="task-panel">
            <div className="panel-header">
              <div>
                <span className="section-label">Work Queue</span>
                <h2>Priority tasks</h2>
              </div>
              {canEditRecords && <button className="text-action" onClick={() => openForm('task')} type="button">Add task</button>}
            </div>
            {tasks.map((item) => (
              <article className={item.completed ? 'task-item completed' : 'task-item'} key={item.id}>
                <button className="complete-toggle" onClick={() => toggleTask(item.id)} type="button">
                  {item.completed ? 'Done' : 'Open'}
                </button>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.matter} | Due {item.due}</small>
                </div>
                <span className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</span>
                {canDeleteRecords && <button className="danger-action" onClick={() => deleteTask(item.id)} type="button">Delete</button>}
              </article>
            ))}
          </div>
        </section>

        <section className="client-panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Clients</span>
              <h2>Client directory</h2>
            </div>
            {canEditRecords && <button className="text-action" onClick={() => openForm('client')} type="button">Add client</button>}
          </div>
          <div className="filter-bar single">
            <label>
              Search clients
              <input
                onChange={(event) => setClientSearch(event.target.value)}
                placeholder="Name, city, phone, email"
                value={clientSearch}
              />
            </label>
          </div>
          <div className="client-list">
            {filteredClients.map((client) => (
              <article className="client-item" key={client.id}>
                <span>
                  <strong>{client.name}</strong>
                  <small>{client.type} | {client.city}</small>
                </span>
                <span>
                  <strong>{client.phone}</strong>
                  <small>{client.email}</small>
                </span>
                <span className="row-actions">
                  {canEditRecords && <button className="text-action" onClick={() => startClientEdit(client.id)} type="button">Edit</button>}
                  {canDeleteRecords && <button className="danger-action" onClick={() => deleteClient(client.id)} type="button">Delete</button>}
                </span>
              </article>
            ))}
            {filteredClients.length === 0 && <p className="empty-state">No clients match the current search.</p>}
          </div>
        </section>
          </>
        )}
      </section>
    </main>
  )
}

export default App
