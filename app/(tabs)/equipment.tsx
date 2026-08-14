import { ModuleScreen } from '@/components/ModuleScreen';

export default function EquipmentScreen() {
  return (
    <ModuleScreen
      title="Equipment"
      summary="Hour meters, inspections, and check-out so machines do not sit broken on the pad."
      features={[
        'Machine hour, fuel, and idle time entry with optional telematics later',
        'Pre-trip / circle-check digital inspections',
        'Maintenance reminders at 250 / 500 hour intervals',
        'QR / barcode check-in and check-out to trucks, jobs, and operators',
      ]}
    />
  );
}
