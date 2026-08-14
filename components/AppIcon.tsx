import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

const icons = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  logs: { ios: 'doc.text.fill', android: 'description', web: 'description' },
  punch: { ios: 'checklist', android: 'checklist', web: 'checklist' },
  camera: { ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' },
  more: { ios: 'square.grid.2x2.fill', android: 'apps', web: 'apps' },
  equipment: { ios: 'wrench.and.screwdriver.fill', android: 'construction', web: 'construction' },
  costing: { ios: 'dollarsign.circle.fill', android: 'payments', web: 'payments' },
  labor: { ios: 'person.3.fill', android: 'groups', web: 'groups' },
  safety: { ios: 'exclamationmark.shield.fill', android: 'health_and_safety', web: 'health_and_safety' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  cloud: { ios: 'icloud.and.arrow.up', android: 'cloud_upload', web: 'cloud_upload' },
  offline: { ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' },
  location: { ios: 'location.fill', android: 'location_on', web: 'location_on' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
} as const;

export type IconName = keyof typeof icons;

export function AppIcon({
  name,
  color,
  size = 24,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  return <SymbolView name={icons[name] as ComponentProps<typeof SymbolView>['name']} tintColor={color} size={size} />;
}
