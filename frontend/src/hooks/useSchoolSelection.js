import { useContext } from 'react'

import { SchoolSelectionContext } from '../components/compare/schoolSelectionContext'

export function useSchoolSelection() {
  return useContext(SchoolSelectionContext)
}
