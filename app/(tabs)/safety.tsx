import { ModuleScreen } from '@/components/ModuleScreen';

export default function SafetyScreen() {
  return (
    <ModuleScreen
      title="Safety & docs"
      summary="Toolbox talks, incidents, drawings, and tickets in one locker for the audit."
      features={[
        'Weekly toolbox talk library, sign-in roster, and PDF export',
        'Incident and near-miss reports with photos and root-cause tags',
        'Drawing viewer with version control and sheet linking',
        'Certification locker for tickets, licenses, and insurance expirations',
      ]}
    />
  );
}
