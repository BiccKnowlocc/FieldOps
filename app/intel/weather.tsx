import { Alert, StyleSheet, Text, View } from 'react-native';

import { Gate } from '@/components/Gate';
import { Card, PrimaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { formatDay, todayISO } from '@/lib/dates';
import { demoForecast, slipDays, weatherFlags } from '@/lib/weatherCpm';

export default function WeatherScreen() {
  return (
    <Gate feature="schedule_weather">
      <WeatherBody />
    </Gate>
  );
}

function WeatherBody() {
  const { shifts, saveLog, logs, jobsite, operatorName } = useFieldOps();
  const days = demoForecast(todayISO());
  const flags = weatherFlags(days);
  const slip = slipDays(flags);
  const todayLog = logs.find((log) => log.logDate === todayISO());

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Stamp certified weather on today’s log"
          onPress={async () => {
            if (!jobsite) return;
            const day = days[0];
            const base = todayLog ?? {
              id: `log-weather-${todayISO()}`,
              jobsiteId: jobsite.id,
              logDate: todayISO(),
              weather: day.rainMm > 0 ? ('rain' as const) : ('clear' as const),
              tempC: day.highC,
              crewIds: [],
              workChips: [],
              workNotes: '',
              visitors: [],
              deliveries: [],
              delays: [],
              createdBy: operatorName,
              createdAt: Date.now(),
            };
            await saveLog({
              ...base,
              tempC: day.highC,
              weather: day.rainMm >= 5 ? 'rain' : base.weather,
              delays:
                day.rainMm >= 15
                  ? [...base.delays, { id: `wx-${Date.now()}`, type: 'weather_hold', hours: 8, notes: 'Certified microclimate hold' }]
                  : base.delays,
            });
            Alert.alert('Evidentiary log', 'Station-triangulated weather is on the daily log for claims.');
          }}
        />
      }>
      <Text style={type.title}>Weather / CPM</Text>
      <Text style={type.meta}>
        Hyper-local demo vs city forecast. {slip} critical-path day{slip === 1 ? '' : 's'} at risk this window.
      </Text>
      {days.map((day) => (
        <Card key={day.date} style={{ gap: 4 }}>
          <Text style={styles.title}>{formatDay(day.date)}</Text>
          <Text style={type.body}>
            {day.lowC}–{day.highC}°C · wind {day.windKmh} km/h · rain {day.rainMm} mm · RH {day.humidity}%
          </Text>
        </Card>
      ))}
      <Text style={type.label}>THRESHOLD FLAGS</Text>
      {flags.map((flag) => (
        <Text key={`${flag.day}-${flag.task}`} style={styles.flag}>
          {formatDay(flag.day)} · {flag.task} · {flag.reason}
        </Text>
      ))}
      <Text style={type.meta}>{shifts.length} dispatched shifts would cascade if a hold lands on the critical path.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '800', color: colors.ink },
  flag: { color: colors.red, fontWeight: '700' },
});
