import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Gate } from '@/components/Gate';
import { Card, PrimaryButton, SecondaryButton } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { jobCost } from '@/lib/jobCost';
import { usd } from '@/lib/money';

export default function CostingScreen() {
  const router = useRouter();
  const { can } = useAuth();
  const { estimateLines, changeOrders, receipts, purchaseOrders, logs } = useFieldOps();
  if (!can('costing')) return <Gate feature="costing">{null}</Gate>;
  const summary = jobCost({ estimateLines, changeOrders, receipts, purchaseOrders, logs });
  const over = summary.variance < 0;

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          <PrimaryButton label="Takeoff calculator" onPress={() => router.push('/takeoff' as never)} />
          <SecondaryButton label="Snap receipt" onPress={() => router.push('/receipt/new' as never)} />
        </View>
      }>
      <Text style={type.title}>Job cost</Text>
      <Text style={type.meta}>Budget vs actuals from the estimate, signed COs, receipts, and hours on the daily logs.</Text>

      <View style={styles.hero}>
        <Text style={type.label}>COST TO COMPLETE</Text>
        <Text style={styles.heroValue}>{usd(summary.ctc)}</Text>
        <Text style={styles.heroMeta}>
          Contract {usd(summary.contract)} · In {usd(summary.committed)} · {summary.laborHours} field hrs
        </Text>
        <Text style={over ? styles.hot : styles.ok}>
          {over ? `${usd(Math.abs(summary.variance))} over` : `${usd(summary.variance)} under`}
        </Text>
      </View>

      {summary.codes.map((code) => (
        <View key={code.code} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>
              {code.code} {code.name}
            </Text>
            <Text style={type.meta}>
              {usd(code.actual)} actual · {usd(code.budget)} budget
            </Text>
          </View>
          <Text style={code.remaining < 0 ? styles.hot : styles.ok}>{usd(code.remaining)}</Text>
        </View>
      ))}

      <Card style={{ gap: 10 }}>
        <Text style={type.label}>CHANGE ORDERS</Text>
        {changeOrders.length === 0 ? <Text style={type.meta}>None yet.</Text> : null}
        {changeOrders.map((order) => (
          <Pressable key={order.id} onPress={() => router.push(`/change-order/${order.id}` as never)}>
            <Text style={styles.rowTitle}>
              {order.number} · {order.title}
            </Text>
            <Text style={type.meta}>{order.status === 'signed' ? 'Signed' : 'Needs signature'}</Text>
          </Pressable>
        ))}
        <SecondaryButton label="New change order" onPress={() => router.push('/change-order/new' as never)} />
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={type.label}>RECEIPTS</Text>
        {receipts.slice(0, 6).map((receipt) => (
          <Text key={receipt.id} style={type.body}>
            {receipt.vendor} · {usd(receipt.amount)} · {receipt.costCode}
          </Text>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
  },
  heroValue: { color: colors.white, fontSize: 36, fontWeight: '900' },
  heroMeta: { color: '#C9D3DC', fontWeight: '600' },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  hot: { color: colors.red, fontWeight: '800' },
  ok: { color: colors.green, fontWeight: '800' },
});
