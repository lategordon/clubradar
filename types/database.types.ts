export type EventStatus = 'Idea' | 'Planning' | 'Submitted' | 'Confirmed' | 'Completed';

export type EventRegion = 'SF' | 'East Bay' | 'South Bay' | 'Virtual' | 'NYC';

export type AwarenessCategory = 
  | 'Community / Conference' 
  | 'Civic / Holiday' 
  | 'Cultural' 
  | 'Campus / Sports';

export type IdeaStatus = 'Draft' | 'Contacting Vendor' | 'Under Consideration' | 'Ready to Plan' | 'Promoted';

export type UniversityCode = 'NYU' | 'Stanford' | 'UC Berkeley' | 'Columbia' | 'Harvard' | 'MIT' | 'Other';

export interface ClubLeader {
  id: string;
  name: string;
  university: string;
  university_short: UniversityCode;
  university_color: string;
  chapter: string;
  role: string;
  email: string;
  avatar_initials: string;
  badge: string;
  bio?: string;
  assigned_events_count?: number;
  sla_compliance_rate?: string;
  active_quarter_capacity?: string;
  created_at?: string;
}

export interface EventIdea {
  id: string;
  title: string;
  vendor_name?: string;
  vendor_website?: string;
  time_period?: string; // Time period thinking of doing the event (e.g. October 2026, Spring 2027)
  notes?: string;
  description?: string;
  suggested_region: EventRegion;
  location_name?: string;
  submitted_by: string;
  submitted_avatar?: string;
  upvotes: number;
  upvoters?: string[];
  tags: string[];
  estimated_cost_tier?: 'Free' | '$ (Under $25)' | '$$ ($25-$60)' | '$$$ ($60+)';
  status: IdeaStatus;
  promoted_event_id?: string;
  created_at: string;
}

export interface DatabaseEvent {
  id: string;
  title: string;
  event_date: string; // YYYY-MM-DD
  status: EventStatus;
  location_name: string;
  region: EventRegion;
  cost_per_person: number;
  primary_host: string;
  co_hosts?: string[] | string;
  notes?: string;
  workflow_progress_current?: number;
  workflow_progress_total?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AwarenessEvent {
  id: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  location: string;
  category: AwarenessCategory;
  is_multi_day?: boolean;
  color_tag?: string;
  notes?: string;
  created_at?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  assignee: string;
  completed: boolean;
  due_date?: string;
  event_id?: string;
  warning_type?: '6w' | '8w' | 'standard';
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  user_name: string;
  user_avatar_initials: string;
  action: string;
  target: string;
  created_at: string;
  relative_time: string;
  badge_color?: string;
}

export interface EventDeadlines {
  eightWeekDate: string;
  eightWeekFormatted: string;
  isEightWeekUrgent: boolean;
  isEightWeekPast: boolean;
  
  sixWeekDate: string;
  sixWeekFormatted: string;
  isSixWeekUrgent: boolean;
  isSixWeekPast: boolean;

  daysUntilEvent: number;
  daysUntilSixWeek: number;
  daysUntilEightWeek: number;
  urgencyLabel?: string;
}

export interface EnrichedEvent extends DatabaseEvent {
  deadlines: EventDeadlines;
  conflicts: AwarenessEvent[];
  co_hosts_list: string[];
}

export interface Database {
  public: {
    Tables: {
      events: {
        Row: DatabaseEvent;
        Insert: Partial<DatabaseEvent>;
        Update: Partial<DatabaseEvent>;
        Relationships: [];
      };
      event_ideas: {
        Row: EventIdea;
        Insert: Partial<EventIdea>;
        Update: Partial<EventIdea>;
        Relationships: [];
      };
      awareness_events: {
        Row: AwarenessEvent;
        Insert: Partial<AwarenessEvent>;
        Update: Partial<AwarenessEvent>;
        Relationships: [];
      };
      tasks: {
        Row: TaskItem;
        Insert: Partial<TaskItem>;
        Update: Partial<TaskItem>;
        Relationships: [];
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Partial<ActivityLog>;
        Update: Partial<ActivityLog>;
        Relationships: [];
      };
      club_leaders: {
        Row: ClubLeader;
        Insert: Partial<ClubLeader>;
        Update: Partial<ClubLeader>;
        Relationships: [];
      };
    };
    Views: {
      events_with_deadlines: {
        Row: DatabaseEvent & {
          eight_week_deadline: string;
          six_week_deadline: string;
          days_until_event: number;
          days_until_six_week: number;
          days_until_eight_week: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
