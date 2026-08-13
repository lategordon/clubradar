import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { DatabaseEvent, AwarenessEvent, TaskItem, ActivityLog, EnrichedEvent, EventIdea, ClubLeader } from '@/types/database.types';
import { INITIAL_EVENTS, INITIAL_AWARENESS_EVENTS, INITIAL_TASKS, INITIAL_ACTIVITY_LOGS, INITIAL_EVENT_IDEAS, INITIAL_CLUB_LEADERS } from '@/lib/mock-data';
import { enrichEvent } from '@/lib/utils/deadlines';

const EVENTS_STORAGE_KEY = 'nyu_alumni_events_store_v1';
const IDEAS_STORAGE_KEY = 'nyu_alumni_ideas_store_v2';
const TASKS_STORAGE_KEY = 'nyu_alumni_tasks_store_v1';
const LOGS_STORAGE_KEY = 'nyu_alumni_logs_store_v1';
const AWARENESS_STORAGE_KEY = 'nyu_alumni_awareness_store_v1';
const LEADERS_STORAGE_KEY = 'nyu_alumni_leaders_store_v1';

// Local storage helper
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

// 1. Fetch Events
export async function getEvents(): Promise<DatabaseEvent[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as DatabaseEvent[];
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local store:', e);
    }
  }

  return getStored<DatabaseEvent[]>(EVENTS_STORAGE_KEY, INITIAL_EVENTS);
}

// 2. Fetch Event Ideas
export async function getEventIdeas(): Promise<EventIdea[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('event_ideas') as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as EventIdea[];
      }
    } catch (e) {
      console.warn('Supabase ideas fetch failed, falling back:', e);
    }
  }

  return getStored<EventIdea[]>(IDEAS_STORAGE_KEY, INITIAL_EVENT_IDEAS);
}

// 3. Create Event Idea
export async function createEventIdea(newIdea: Omit<EventIdea, 'id' | 'created_at' | 'upvotes' | 'status'>): Promise<EventIdea> {
  const generatedId = `idea-${Date.now()}`;
  const ideaRecord: EventIdea = {
    ...newIdea,
    id: generatedId,
    upvotes: 1,
    upvoters: [newIdea.submitted_by || 'Leighton'],
    status: 'Draft',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('event_ideas') as any)
        .insert([ideaRecord])
        .select()
        .single();
      if (!error && data) {
        await addActivityLog('Leighton', 'L', `pitched new event idea "${newIdea.title}"`, newIdea.title);
        return data as EventIdea;
      }
    } catch (e) {
      console.error('Supabase idea insert failed:', e);
    }
  }

  const current = getStored<EventIdea[]>(IDEAS_STORAGE_KEY, INITIAL_EVENT_IDEAS);
  const updated = [ideaRecord, ...current];
  setStored(IDEAS_STORAGE_KEY, updated);

  await addActivityLog('Leighton', 'L', `pitched new event idea "${newIdea.title}"`, newIdea.title);
  return ideaRecord;
}

// 4. Update Event Idea
export async function updateEventIdea(id: string, updates: Partial<EventIdea>): Promise<EventIdea | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('event_ideas') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return data as EventIdea;
      }
    } catch (e) {
      console.error('Supabase idea update failed:', e);
    }
  }

  const current = getStored<EventIdea[]>(IDEAS_STORAGE_KEY, INITIAL_EVENT_IDEAS);
  const index = current.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const updatedRecord = { ...current[index], ...updates };
  current[index] = updatedRecord;
  setStored(IDEAS_STORAGE_KEY, current);
  return updatedRecord;
}

// 5. Upvote Event Idea
export async function upvoteEventIdea(id: string, voterName: string = 'Leighton'): Promise<EventIdea | null> {
  const current = getStored<EventIdea[]>(IDEAS_STORAGE_KEY, INITIAL_EVENT_IDEAS);
  const index = current.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const item = current[index];
  const voters = item.upvoters || [];
  const hasUpvoted = voters.includes(voterName);

  const updatedVoters = hasUpvoted ? voters.filter((v) => v !== voterName) : [...voters, voterName];
  const updatedUpvotes = updatedVoters.length;

  const updatedRecord: EventIdea = {
    ...item,
    upvotes: updatedUpvotes,
    upvoters: updatedVoters,
  };

  current[index] = updatedRecord;
  setStored(IDEAS_STORAGE_KEY, current);

  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('event_ideas') as any)
        .update({ upvotes: updatedUpvotes, upvoters: updatedVoters })
        .eq('id', id);
    } catch (e) {
      console.error('Supabase upvote error:', e);
    }
  }

  return updatedRecord;
}

// 6. Promote / Upgrade Idea to Full Official Event
export async function promoteIdeaToEvent(
  ideaId: string,
  eventDate: string,
  primaryHost: string,
  cost: number = 0,
  locationName: string = 'San Francisco',
  region: any = 'SF'
): Promise<DatabaseEvent | null> {
  const ideas = getStored<EventIdea[]>(IDEAS_STORAGE_KEY, INITIAL_EVENT_IDEAS);
  const idea = ideas.find((i) => i.id === ideaId);
  if (!idea) return null;

  // 1. Create full event
  const created = await createEvent({
    title: idea.title,
    event_date: eventDate,
    status: 'Planning',
    location_name: locationName,
    region: region || idea.suggested_region || 'SF',
    cost_per_person: cost,
    primary_host: primaryHost || idea.submitted_by,
    co_hosts: [idea.submitted_by],
    notes: `${idea.description} (Promoted from Ideas Backlog)`,
    workflow_progress_current: 5,
    workflow_progress_total: 14,
  });

  // 2. Mark idea as Promoted
  await updateEventIdea(ideaId, {
    status: 'Promoted',
    promoted_event_id: created.id,
  });

  await addActivityLog('Leighton', 'L', `upgraded idea "${idea.title}" into a full Event scheduled for ${eventDate}`, idea.title);

  return created;
}

// 7. Delete Event Idea
export async function deleteEventIdea(id: string): Promise<boolean> {
  const current = getStored<EventIdea[]>(IDEAS_STORAGE_KEY, INITIAL_EVENT_IDEAS);
  const filtered = current.filter((i) => i.id !== id);
  setStored(IDEAS_STORAGE_KEY, filtered);

  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('event_ideas') as any).delete().eq('id', id);
    } catch (e) {
      console.error('Supabase idea delete error:', e);
    }
  }
  return true;
}

// 8. Fetch Awareness Events
export async function getAwarenessEvents(): Promise<AwarenessEvent[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('awareness_events')
        .select('*')
        .order('start_date', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as AwarenessEvent[];
      }
    } catch (e) {
      console.warn('Supabase awareness fetch failed, falling back:', e);
    }
  }

  return getStored<AwarenessEvent[]>(AWARENESS_STORAGE_KEY, INITIAL_AWARENESS_EVENTS);
}

// 9. Fetch Tasks
export async function getTasks(): Promise<TaskItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as TaskItem[];
      }
    } catch (e) {
      console.warn('Supabase tasks fetch failed:', e);
    }
  }

  return getStored<TaskItem[]>(TASKS_STORAGE_KEY, INITIAL_TASKS);
}

// 10. Fetch Activity Logs
export async function getActivityLogs(): Promise<ActivityLog[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as ActivityLog[];
      }
    } catch (e) {
      console.warn('Supabase logs fetch failed:', e);
    }
  }

  return getStored<ActivityLog[]>(LOGS_STORAGE_KEY, INITIAL_ACTIVITY_LOGS);
}

// 11. Create Event
export async function createEvent(newEvent: Omit<DatabaseEvent, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseEvent> {
  const generatedId = `evt-${Date.now()}`;
  const now = new Date().toISOString();
  const eventRecord: DatabaseEvent = {
    ...newEvent,
    id: generatedId,
    workflow_progress_current: newEvent.workflow_progress_current || 0,
    workflow_progress_total: newEvent.workflow_progress_total || 14,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('events') as any)
        .insert([eventRecord])
        .select()
        .single();
      if (!error && data) {
        await addActivityLog('Leighton', 'L', `created new event "${newEvent.title}"`, newEvent.title);
        return data as DatabaseEvent;
      }
    } catch (e) {
      console.error('Supabase insert failed:', e);
    }
  }

  const current = getStored<DatabaseEvent[]>(EVENTS_STORAGE_KEY, INITIAL_EVENTS);
  const updated = [...current, eventRecord];
  setStored(EVENTS_STORAGE_KEY, updated);

  await addActivityLog('Leighton', 'L', `created new event "${newEvent.title}"`, newEvent.title);
  return eventRecord;
}

// 12. Update Event
export async function updateEvent(id: string, updates: Partial<DatabaseEvent>): Promise<DatabaseEvent | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('events') as any)
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return data as DatabaseEvent;
      }
    } catch (e) {
      console.error('Supabase update failed:', e);
    }
  }

  const current = getStored<DatabaseEvent[]>(EVENTS_STORAGE_KEY, INITIAL_EVENTS);
  const index = current.findIndex((e) => e.id === id);
  if (index === -1) return null;

  const updatedRecord = { ...current[index], ...updates, updated_at: now };
  current[index] = updatedRecord;
  setStored(EVENTS_STORAGE_KEY, current);

  if (updates.status) {
    await addActivityLog('Leighton', 'L', `updated status to ${updates.status}`, updatedRecord.title);
  }

  return updatedRecord;
}

// 13. Delete Event
export async function deleteEvent(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('events') as any).delete().eq('id', id);
      if (error) console.error('Supabase delete error:', error);
    } catch (e) {
      console.error('Supabase delete failed:', e);
    }
  }

  const current = getStored<DatabaseEvent[]>(EVENTS_STORAGE_KEY, INITIAL_EVENTS);
  const filtered = current.filter((e) => e.id !== id);
  setStored(EVENTS_STORAGE_KEY, filtered);
  return true;
}

// 14. Update Awareness Event
export async function updateAwarenessEvent(id: string, updates: Partial<AwarenessEvent>): Promise<AwarenessEvent | null> {
  const current = getStored<AwarenessEvent[]>(AWARENESS_STORAGE_KEY, INITIAL_AWARENESS_EVENTS);
  const index = current.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const updatedRecord = { ...current[index], ...updates };
  current[index] = updatedRecord;
  setStored(AWARENESS_STORAGE_KEY, current);
  return updatedRecord;
}

// 15. Toggle Task
export async function toggleTask(id: string): Promise<TaskItem[]> {
  const current = getStored<TaskItem[]>(TASKS_STORAGE_KEY, INITIAL_TASKS);
  const updated = current.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  setStored(TASKS_STORAGE_KEY, updated);

  if (isSupabaseConfigured && supabase) {
    const task = updated.find((t) => t.id === id);
    if (task) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('tasks') as any).update({ completed: task.completed }).eq('id', id);
      } catch (err) {
        console.error('Supabase task toggle error:', err);
      }
    }
  }

  return updated;
}

// 16. Add Activity Log
export async function addActivityLog(
  userName: string,
  userInitials: string,
  action: string,
  target: string
): Promise<void> {
  const newLog: ActivityLog = {
    id: `act-${Date.now()}`,
    user_name: userName,
    user_avatar_initials: userInitials,
    action,
    target,
    created_at: new Date().toISOString(),
    relative_time: 'Just now',
    badge_color: 'bg-purple-600 text-white',
  };

  const logs = getStored<ActivityLog[]>(LOGS_STORAGE_KEY, INITIAL_ACTIVITY_LOGS);
  setStored(LOGS_STORAGE_KEY, [newLog, ...logs]);

  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('activity_logs') as any).insert([newLog]);
    } catch (e) {
      console.error('Supabase log insert error:', e);
    }
  }
}

// 17. Fetch Club Leaders
export async function getClubLeaders(): Promise<ClubLeader[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('club_leaders') as any)
        .select('*')
        .order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as ClubLeader[];
      }
    } catch (e) {
      console.warn('Supabase leaders fetch failed, falling back:', e);
    }
  }

  return getStored<ClubLeader[]>(LEADERS_STORAGE_KEY, INITIAL_CLUB_LEADERS);
}

// 18. Create Club Leader
export async function createClubLeader(
  newLeader: Omit<ClubLeader, 'id' | 'created_at'>
): Promise<ClubLeader> {
  const generatedId = `leader-${Date.now()}`;
  const leaderRecord: ClubLeader = {
    ...newLeader,
    id: generatedId,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('club_leaders') as any)
        .insert([leaderRecord])
        .select()
        .single();
      if (!error && data) {
        await addActivityLog('System', 'SYS', `added new club leader "${newLeader.name}"`, newLeader.university);
        return data as ClubLeader;
      }
    } catch (e) {
      console.error('Supabase leader insert failed:', e);
    }
  }

  const current = getStored<ClubLeader[]>(LEADERS_STORAGE_KEY, INITIAL_CLUB_LEADERS);
  const updated = [leaderRecord, ...current];
  setStored(LEADERS_STORAGE_KEY, updated);
  await addActivityLog('System', 'SYS', `added new club leader "${newLeader.name}"`, newLeader.university);
  return leaderRecord;
}

// 19. Update Club Leader
export async function updateClubLeader(
  id: string,
  updates: Partial<ClubLeader>
): Promise<ClubLeader | null> {
  const current = getStored<ClubLeader[]>(LEADERS_STORAGE_KEY, INITIAL_CLUB_LEADERS);
  let updatedRecord: ClubLeader | null = null;
  const updated = current.map((leader) => {
    if (leader.id === id) {
      updatedRecord = { ...leader, ...updates };
      return updatedRecord;
    }
    return leader;
  });

  setStored(LEADERS_STORAGE_KEY, updated);
  return updatedRecord;
}

// 20. Delete Club Leader
export async function deleteClubLeader(id: string): Promise<void> {
  const current = getStored<ClubLeader[]>(LEADERS_STORAGE_KEY, INITIAL_CLUB_LEADERS);
  const updated = current.filter((leader) => leader.id !== id);
  setStored(LEADERS_STORAGE_KEY, updated);
}

// 21. Helper to get all enriched events, ideas, and leaders
export async function getEnrichedEvents(): Promise<{
  enrichedEvents: EnrichedEvent[];
  awarenessEvents: AwarenessEvent[];
  ideas: EventIdea[];
  tasks: TaskItem[];
  activityLogs: ActivityLog[];
  leaders: ClubLeader[];
}> {
  const [events, awarenessEvents, ideas, tasks, activityLogs, leaders] = await Promise.all([
    getEvents(),
    getAwarenessEvents(),
    getEventIdeas(),
    getTasks(),
    getActivityLogs(),
    getClubLeaders(),
  ]);

  const enrichedEvents = events.map((event) => enrichEvent(event, awarenessEvents));

  return {
    enrichedEvents,
    awarenessEvents,
    ideas,
    tasks,
    activityLogs,
    leaders,
  };
}

