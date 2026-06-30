// 训练准备页 — 选择动作 + 预设重量次数，再开始训练

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, TextInput, Modal, Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius, COMMON_EXERCISES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useWorkout } from '../context/WorkoutContext';
import { setBodyPart as saveBodyPart } from '../storage/database';

export default function TrainingPrepScreen({ route, navigation }) {
  const { date, trained, bodyPart } = route.params || {};
  const { startWorkout, checkActiveWorkout } = useWorkout();
  const { colors: c } = useTheme();

  const idSeq = useRef(0);
  const nextId = () => `prep_${++idSeq.current}_${Date.now()}`;

  const [exercises, setExercises] = useState([]); // [{ id, name, weight, reps }]
  const [showModal, setShowModal] = useState(false);
  const [inputName, setInputName] = useState('');

  const addExercise = (name) => {
    const n = name.trim();
    if (!n) return;
    setExercises(prev => [...prev, { id: nextId(), name: n, weight: '', reps: '' }]);
    setInputName('');
    setShowModal(false);
  };

  const removeExercise = (id) => {
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  const updateExercise = (id, field, value) => {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleStart = async () => {
    if (exercises.length === 0) {
      Alert.alert('提示', '请先添加至少一个训练动作');
      return;
    }
    // 兜底检查：是否有未完成训练
    const active = await checkActiveWorkout();
    const start = () => {
      if (bodyPart && date) saveBodyPart(date, bodyPart);
      startWorkout(exercises.map(e => ({ name: e.name, weight: e.weight, reps: e.reps })), date);
      navigation.replace('Workout');
    };

    if (active) {
      Alert.alert('提示', '你有未完成的训练，开始新训练将覆盖之前的训练。', [
        { text: '取消', style: 'cancel' },
        { text: '放弃并开始新训练', onPress: start },
      ]);
    } else {
      start();
    }
  };

  const displayDate = (() => {
    if (!date || !date.includes('-')) {
      const now = new Date();
      return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    }
    const [y, m, d] = date.split('-');
    return `${y}年${parseInt(m)}月${parseInt(d)}日`;
  })();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: c.text }]}>{displayDate}</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {trained ? '已训练 · 可再次训练' : '准备训练'}
          </Text>
        </View>
      </View>

      {/* 动作列表 */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {exercises.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>还没有添加动作</Text>
            <Text style={[styles.emptyHint, { color: c.textMuted }]}>点击下方按钮，添加今天要做的动作</Text>
          </View>
        ) : (
          exercises.map((ex, i) => (
            <View key={ex.id} style={[styles.exerciseCard, { backgroundColor: c.panel }]}>
              {/* 行1: 序号 + 名称 + 删除 */}
              <View style={styles.exRow1}>
                <View style={styles.exNum}><Text style={[styles.exNumText, { color: c.text }]}>{i + 1}</Text></View>
                <Text style={[styles.exName, { color: c.text }]}>{ex.name}</Text>
                <TouchableOpacity onPress={() => removeExercise(ex.id)}>
                  <Text style={styles.exDel}>删除</Text>
                </TouchableOpacity>
              </View>
              {/* 行2: 重量 + 次数 */}
              <View style={styles.exRow2}>
                <View style={[styles.presetInputWrap, { backgroundColor: c.surfaceLight }]}>
                  <TextInput
                    style={[styles.presetInput, { color: c.text }]}
                    value={ex.weight}
                    onChangeText={v => updateExercise(ex.id, 'weight', v)}
                    placeholder="重量"
                    placeholderTextColor={c.textMuted}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.presetUnit, { color: c.textMuted }]}>kg</Text>
                </View>
                <Text style={[styles.presetTimes, { color: c.textMuted }]}>×</Text>
                <View style={[styles.presetInputWrap, { backgroundColor: c.surfaceLight }]}>
                  <TextInput
                    style={[styles.presetInput, { color: c.text }]}
                    value={ex.reps}
                    onChangeText={v => updateExercise(ex.id, 'reps', v)}
                    placeholder="次数"
                    placeholderTextColor={c.textMuted}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.presetUnit, { color: c.textMuted }]}>次</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={[styles.addBtn, { borderColor: c.border }]} onPress={() => setShowModal(true)} activeOpacity={0.7}>
          <Text style={styles.addText}>+ 添加动作</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 开始按钮 */}
      <View style={[styles.bottom, { borderTopColor: c.border }]}>
        <TouchableOpacity
          style={[styles.startBtn, exercises.length === 0 && styles.startBtnDisabled]}
          onPress={handleStart}
          activeOpacity={0.7}
        >
          <Text style={styles.startText}>
            {exercises.length > 0
              ? `开始训练（${exercises.length} 个动作）`
              : '请先添加动作'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 添加动作弹窗 */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: c.panel }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>添加动作</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>关闭</Text>
              </TouchableOpacity>
            </View>

            {/* 输入框 — 更大更清晰 */}
            <View style={styles.modalInputRow}>
              <TextInput
                style={[styles.modalInput, { backgroundColor: c.surfaceLight, color: c.text }]}
                value={inputName}
                onChangeText={setInputName}
                placeholder="输入动作名称，如：卧推"
                placeholderTextColor={c.textMuted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => addExercise(inputName)}
              />
            </View>
            <TouchableOpacity
              style={[styles.modalAddBtn, !inputName.trim() && styles.modalAddBtnDisabled]}
              onPress={() => addExercise(inputName)}
              disabled={!inputName.trim()}
            >
              <Text style={styles.modalAddText}>确认添加</Text>
            </TouchableOpacity>

            <Text style={[styles.commonTitle, { color: c.textMuted }]}>常用动作（点击快速添加）</Text>
            <View style={styles.commonGrid}>
              {COMMON_EXERCISES.map(name => (
                <TouchableOpacity
                  key={name}
                  style={[styles.commonChip, { backgroundColor: c.surfaceLight, borderColor: c.border }]}
                  onPress={() => addExercise(name)}
                >
                  <Text style={[styles.commonChipText, { color: c.textSecondary }]}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backBtn: { paddingRight: spacing.sm },
  backText: { color: colors.primary, fontSize: fontSize.md },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },

  list: { flex: 1, paddingHorizontal: spacing.md },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.lg },
  emptyHint: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },

  // 动作卡片
  exerciseCard: {
    backgroundColor: colors.panel, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  exRow1: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  exNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  exNumText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  exName: { flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: '500' },
  exDel: { color: colors.danger, fontSize: fontSize.sm },

  // 重量次数预设行
  exRow2: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: 28 + spacing.sm },
  presetInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm, height: 40,
  },
  presetInput: {
    flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: '600',
    textAlign: 'center', textAlignVertical: 'center', paddingVertical: 0,
  },
  presetUnit: { color: colors.textMuted, fontSize: fontSize.xs, marginRight: spacing.xs },
  presetTimes: { color: colors.textMuted, fontSize: fontSize.md },

  addBtn: {
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    borderRadius: borderRadius.lg, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.sm,
  },
  addText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '600' },

  bottom: {
    padding: spacing.md, paddingBottom: spacing.lg,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  startBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  startBtnDisabled: { backgroundColor: colors.surfaceLight },
  startText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },

  // modal — 加大输入框
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.panel, borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl, padding: spacing.lg,
    paddingBottom: spacing.xxl, maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  modalTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  modalClose: { color: colors.primary, fontSize: fontSize.md },
  modalInputRow: { marginBottom: spacing.md },
  modalInput: {
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    color: colors.text, fontSize: fontSize.md,
    height: 48, textAlignVertical: 'center',
  },
  modalAddBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.lg,
  },
  modalAddBtnDisabled: { backgroundColor: colors.surfaceLight },
  modalAddText: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  commonTitle: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.sm },
  commonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  commonChip: {
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.round,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  commonChipText: { color: colors.textSecondary, fontSize: fontSize.sm },
});
