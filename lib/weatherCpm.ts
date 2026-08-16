export type ForecastDay = {
  date: string;
  highC: number;
  lowC: number;
  windKmh: number;
  rainMm: number;
  humidity: number;
};

export type WeatherFlag = {
  task: string;
  reason: string;
  day: string;
};

export function demoForecast(startIso: string): ForecastDay[] {
  const [y, m, d] = startIso.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const pattern = [
    { highC: 26, lowC: 16, windKmh: 13, rainMm: 0, humidity: 48 },
    { highC: 22, lowC: 14, windKmh: 35, rainMm: 4, humidity: 70 },
    { highC: 12, lowC: 3, windKmh: 19, rainMm: 15, humidity: 88 },
    { highC: 9, lowC: 1, windKmh: 29, rainMm: 0, humidity: 55 },
    { highC: 27, lowC: 18, windKmh: 10, rainMm: 0, humidity: 42 },
  ];
  return pattern.map((item, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const yy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return { date: `${yy}-${mm}-${dd}`, ...item };
  });
}

export function weatherFlags(days: ForecastDay[]): WeatherFlag[] {
  const flags: WeatherFlag[] = [];
  for (const day of days) {
    if (day.lowC < 4) flags.push({ task: 'Concrete pour', reason: `Low ${day.lowC}°C (hold below 4°C)`, day: day.date });
    if (day.humidity > 85) flags.push({ task: 'Exterior paint', reason: `Humidity ${day.humidity}%`, day: day.date });
    if (day.rainMm >= 15) flags.push({ task: 'Earth compaction', reason: `${day.rainMm} mm rain`, day: day.date });
    if (day.windKmh >= 35) flags.push({ task: 'Crane / lift', reason: `${day.windKmh} km/h wind`, day: day.date });
  }
  return flags;
}

export function slipDays(flags: WeatherFlag[]) {
  const uniqueDays = new Set(flags.map((flag) => flag.day));
  return uniqueDays.size;
}
