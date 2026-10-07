import {
  Building2,
  ChartNoAxesColumn,
  GraduationCap,
  Images,
  MapPin,
  Sparkles,
  UserRound,
  WalletCards,
} from 'lucide-react'

import {
  ClassificationStep,
  FeesStep,
  GeneralStep,
  LeadershipStep,
  MediaStep,
  ProgrammesStep,
  ResultsStep,
  ServicesStep,
} from './StepComponents'

// L'ordre de cette liste est l'ordre des étapes à l'écran.
export const STEPS = [
  {
    id: 'general',
    icon: Building2,
    tone: 'blue',
    title: 'The school',
    lead: 'Its name, how to reach it, and how it presents itself.',
    Component: GeneralStep,
  },
  {
    id: 'classification',
    icon: MapPin,
    tone: 'violet',
    title: 'Location and type',
    lead: 'Where the school is and how it is classified.',
    Component: ClassificationStep,
  },
  {
    id: 'programmes',
    icon: GraduationCap,
    tone: 'green',
    title: 'Programmes',
    lead: 'Select every programme the school teaches. Your selection replaces the current list.',
    Component: ProgrammesStep,
  },
  {
    id: 'fees',
    icon: WalletCards,
    tone: 'green',
    title: 'Fees',
    lead: 'One yearly amount per level and school year. Fees you do not list stay as they are.',
    Component: FeesStep,
  },
  {
    id: 'services',
    icon: Sparkles,
    tone: 'violet',
    title: 'Services',
    lead: 'Select everything the school offers. Your selection replaces the current list.',
    Component: ServicesStep,
  },
  {
    id: 'results',
    icon: ChartNoAxesColumn,
    tone: 'blue',
    title: 'Exam results',
    lead: 'Official pass rates per exam and session. Results you do not list stay as they are.',
    Component: ResultsStep,
  },
  {
    id: 'leadership',
    icon: UserRound,
    tone: 'violet',
    title: 'Head of school',
    lead: 'The person who leads the school, shown on its public page.',
    Component: LeadershipStep,
  },
  {
    id: 'media',
    icon: Images,
    tone: 'amber',
    title: 'Photos and videos',
    lead: 'Files are uploaded now and appear on the page once the proposal is approved.',
    Component: MediaStep,
  },
]
