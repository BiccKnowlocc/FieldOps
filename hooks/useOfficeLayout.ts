import { useWindowDimensions } from 'react-native';

import { OFFICE_BREAKPOINT } from '@/constants/theme';

export function useOfficeLayout() {
  const { width } = useWindowDimensions();
  return width >= OFFICE_BREAKPOINT;
}
