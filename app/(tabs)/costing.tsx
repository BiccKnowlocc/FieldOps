import { ModuleScreen } from '@/components/ModuleScreen';

export default function CostingScreen() {
  return (
    <ModuleScreen
      title="Estimating"
      summary="Turn field quantities into POs, change orders, and live cost-to-complete."
      features={[
        'Material calculators and takeoff generators (SF, LF, CY, sheet counts)',
        'Change orders with extra labor/material and on-site signatures',
        'Budget vs actuals from hours and materials coming off the job',
        'Receipt capture with OCR tagged to job cost codes',
      ]}
    />
  );
}
