import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip, ChipGroup, PrimaryButton, SecondaryButton, Section, Stepper } from '@/components/kit';
import { Screen } from '@/components/Screen';
import { colors, radius, tap, type } from '@/constants/theme';
import { useFieldOps } from '@/context/FieldOpsProvider';
import { capturePhoto, pickFromLibrary } from '@/lib/capture';
import { DELIVERY_NOTES, workOrderStatusLabel } from '@/lib/catalog';
import { createId } from '@/lib/id';
import { usd } from '@/lib/money';
import type { WorkOrder, WorkOrderStatus } from '@/lib/types';

export default function WorkOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getWorkOrder } = useFieldOps();
  const order = getWorkOrder(id);

  if (!order) {
    return (
      <Screen>
        <Text style={type.body}>Work order not found.</Text>
      </Screen>
    );
  }

  return <WorkOrderBody order={order} />;
}

function WorkOrderBody({ order }: { order: WorkOrder }) {
  const router = useRouter();
  const { jobsites, saveWorkOrder, saveMedia } = useFieldOps();
  const [note, setNote] = useState(DELIVERY_NOTES[0]);
  const [amount, setAmount] = useState(order.invoiceAmount ?? 1200);
  const site = jobsites.find((item) => item.id === order.jobsiteId);

  async function setStatus(status: WorkOrderStatus) {
    await saveWorkOrder({ ...order, status });
  }

  async function addDelivery(text: string) {
    await saveWorkOrder({
      ...order,
      deliveries: [...order.deliveries, { id: createId(), note: text, createdAt: Date.now() }],
    });
  }

  async function snapInvoice(fromLibrary: boolean) {
    const media = fromLibrary
      ? await pickFromLibrary({ jobsiteId: order.jobsiteId, tag: 'receipt', parentType: 'work_order', parentId: order.id })
      : await capturePhoto({ jobsiteId: order.jobsiteId, tag: 'receipt', parentType: 'work_order', parentId: order.id });
    if (!media) {
      Alert.alert('No photo', 'Camera or library permission is required.');
      return;
    }
    await saveMedia(media);
    await saveWorkOrder({ ...order, invoiceUri: media.uri, invoiceAmount: amount, status: 'complete' });
  }

  return (
    <Screen
      footer={
        order.status === 'offered' ? (
          <View style={{ gap: 10 }}>
            <PrimaryButton label="Accept" onPress={() => setStatus('accepted')} />
            <SecondaryButton label="Decline" onPress={() => setStatus('declined')} />
          </View>
        ) : order.status === 'accepted' ? (
          <PrimaryButton label="Start work" onPress={() => setStatus('in_progress')} />
        ) : order.status === 'in_progress' ? (
          <PrimaryButton
            label={`Mark complete · ${usd(amount)}`}
            onPress={() => saveWorkOrder({ ...order, invoiceAmount: amount, status: 'complete' })}
          />
        ) : null
      }>
      <Text style={type.meta}>{order.number}</Text>
      <Text style={type.title}>{order.title}</Text>
      <Text style={type.body}>
        {order.company} · {workOrderStatusLabel(order.status)}
      </Text>
      <Text style={type.meta}>{site?.name}</Text>
      <Text style={type.body}>{order.scope}</Text>

      {order.status !== 'offered' && order.status !== 'declined' ? (
        <Section title="Deliveries">
          {order.deliveries.length === 0 ? <Text style={type.meta}>None logged.</Text> : null}
          {order.deliveries.map((item) => (
            <Text key={item.id} style={type.body}>
              {item.note}
            </Text>
          ))}
          <ChipGroup>
            {DELIVERY_NOTES.map((item) => (
              <Chip key={item} label={item} selected={note === item} onPress={() => setNote(item)} />
            ))}
          </ChipGroup>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Delivery note"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <SecondaryButton label="Add note" onPress={() => addDelivery(note)} />
        </Section>
      ) : null}

      {order.status === 'in_progress' || order.status === 'complete' ? (
        <Section title="Invoice">
          {order.invoiceUri ? <Image source={{ uri: order.invoiceUri }} style={styles.photo} contentFit="cover" /> : null}
          <ChipGroup>
            {[480, 1200, 2400, 4800].map((value) => (
              <Chip key={value} label={usd(value)} selected={amount === value} onPress={() => setAmount(value)} />
            ))}
          </ChipGroup>
          <Stepper value={amount} onChange={setAmount} min={50} max={50000} step={50} suffix="CAD" />
          {order.status === 'in_progress' ? (
            <View style={{ gap: 10 }}>
              <PrimaryButton label="Snap invoice" onPress={() => snapInvoice(false)} />
              <SecondaryButton label="Invoice from library" onPress={() => snapInvoice(true)} />
            </View>
          ) : (
            <Text style={type.meta}>{order.invoiceAmount != null ? usd(order.invoiceAmount) : 'No amount'}</Text>
          )}
        </Section>
      ) : null}

      {order.status === 'declined' ? (
        <SecondaryButton
          label="Back to offered"
          onPress={() => {
            void setStatus('offered');
            router.back();
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: colors.navy },
  input: {
    minHeight: tap.min,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    backgroundColor: colors.white,
  },
});
