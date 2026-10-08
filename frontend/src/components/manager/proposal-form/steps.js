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

// L'ordre de cette liste est l'ordre des étapes à l'écran. Le titre et
// l'accroche de chaque étape sont dans les fichiers de textes, sous son id.
export const STEPS = [
  {
    id: 'general',
    icon: Building2,
    tone: 'blue',
    Component: GeneralStep,
  },
  {
    id: 'classification',
    icon: MapPin,
    tone: 'violet',
    Component: ClassificationStep,
  },
  {
    id: 'programmes',
    icon: GraduationCap,
    tone: 'green',
    Component: ProgrammesStep,
  },
  {
    id: 'fees',
    icon: WalletCards,
    tone: 'green',
    Component: FeesStep,
  },
  {
    id: 'services',
    icon: Sparkles,
    tone: 'violet',
    Component: ServicesStep,
  },
  {
    id: 'results',
    icon: ChartNoAxesColumn,
    tone: 'blue',
    Component: ResultsStep,
  },
  {
    id: 'leadership',
    icon: UserRound,
    tone: 'violet',
    Component: LeadershipStep,
  },
  {
    id: 'media',
    icon: Images,
    tone: 'amber',
    Component: MediaStep,
  },
]
