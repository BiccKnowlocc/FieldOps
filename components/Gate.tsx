import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { type } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { FeatureId } from '@/lib/tenant';
import type { ReactNode } from 'react';

export function Gate({ feature, children }: { feature: FeatureId; children: ReactNode }) {
  const { can } = useAuth();
  if (!can(feature)) {
    return (
      <Screen>
        <Text style={type.title}>No access</Text>
        <Text style={type.body}>This sign-in cannot open that module. Switch role or enable it on the company tenant.</Text>
      </Screen>
    );
  }
  return children;
}
