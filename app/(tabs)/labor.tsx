import { ModuleScreen } from '@/components/ModuleScreen';

export default function LaborScreen() {
  return (
    <ModuleScreen
      title="Labor & dispatch"
      summary="Clock time to the fence line, then put the right crew and iron on the right site."
      features={[
        'Geofenced time clock with task codes and overtime rules',
        'Crew and equipment dispatch calendar / Gantt',
        'SMS and push shift alerts',
        'Subcontractor portal for work orders, deliveries, and invoices',
      ]}
    />
  );
}
