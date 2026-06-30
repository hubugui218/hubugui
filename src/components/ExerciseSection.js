// 单个动作区域组件
// 完成本组 → 自动休息 → 休息栏可「结束动作」

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';

export default function ExerciseSection({ exercise }) {
  const { completeSet, removeExercise, editSet, state } = useWorkout();
  const { colors: c } = useTheme();
  const { restTimer } = state;
  const isRestingThisExercise = restTimer.isActive && restTimer.exerciseId === exercise.id;

  const lastSet = exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1] : null;

  const [weight, setWeight] = useState(() =>
    lastSet ? String(lastSet.weight) : (exercise.defaultWeight || '')
  );
  const [reps, setReps] = useState(() =>
    lastSet ? String(lastSet.reps) : (exercise.defaultReps || '')
  );
  const [weightError, setWeightError] = useState(false);
  const [repsError, setRepsError] = useState(false);

  // 编辑弹窗
  const [editingSet, setEditingSet] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  const repsInputRef = useRef(null);
  const totalSets = exercise.sets.length;

  const handleCompleteSet = () => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    let hasError = false;

    if (!weight.trim() || isNaN(w) || w < 0) {
      setWeightError(true);
      hasError = true;
    }
    if (!reps.trim() || isNaN(r) || r <= 0) {
      setRepsError(true);
      hasError = true;
    }
    if (hasError) return;

    setWeightError(false);
    setRepsError(false);
    // 记录组数据并自动启动休息倒计时
    completeSet(exercise.id, w, r);
  };

  const openEditSet = (set) => {
    setEditingSet(set);
    setEditWeight(String(set.weight));
    setEditReps(String(set.reps));
  };

  const handleSaveEdit = () => {
    const w = parseFloat(editWeight);
    const r = parseInt(editReps, 10);
    if (isNaN(w) || isNaN(r) || w < 0 || r < 1) return;
    editSet(exercise.id, editingSet.id, w, r);
    setEditingSet(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.panel, borderColor: c.border }]}>
      {/* 动作头部 */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.orderBadge}>
            <Text style={styles.orderText}>{exercise.order}</Text>
          </View>
          <Text style={[styles.nameText, { color: c.text }]}>{exercise.name}</Text>
          {exercise.completed && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ 完成</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => removeExercise(exercise.id)} activeOpacity={0.7}>
          <Text style={styles.deleteText}>删除</Text>
        </TouchableOpacity>
      </View>

      {/* 已完成组列表 */}
      {totalSets > 0 && (
        <View style={styles.setsList}>
          {exercise.sets.map((set) => (
            <View key={set.id} style={styles.setRow}>
              <Text style={styles.setNumber}>第 {set.setNumber} 组</Text>
              <TouchableOpacity style={styles.setData} onPress={() => openEditSet(set)} activeOpacity={0.6}>
                <Text style={styles.setWeight}>{set.weight} kg</Text>
                <Text style={styles.setSeparator}>×</Text>
                <Text style={styles.setReps}>{set.reps} 次</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* 休息中提示 */}
      {isRestingThisExercise && (
        <View style={[styles.restingBanner, { backgroundColor: c.surfaceLight, borderTopColor: c.border }]}>
          <Text style={[styles.restingText, { color: colors.warning }]}>
            🔄 休息中 · {restTimer.remainingSeconds}秒后开始第 {totalSets + 1} 组
          </Text>
          {lastSet && (
            <Text style={[styles.restingHint, { color: c.textMuted }]}>
              上一组：{lastSet.weight} kg × {lastSet.reps} 次（已自动填入）
            </Text>
          )}
        </View>
      )}

      {/* 动作已完成 */}
      {exercise.completed && !isRestingThisExercise && (
        <View style={[styles.completedSection, { borderTopColor: c.border }]}>
          <Text style={[styles.completedText, { color: colors.accent }]}>
            ✅ 本动作已完成 · {totalSets} 组训练
          </Text>
        </View>
      )}

      {/* 当前组输入 — 未完成且非休息时显示 */}
      {!exercise.completed && !isRestingThisExercise && (
        <View style={styles.inputRow}>
          <View style={styles.setLabel}>
            <Text style={styles.setLabelText}>第 {totalSets + 1} 组</Text>
          </View>
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, { backgroundColor: c.surfaceLight, borderColor: c.border }, weightError && styles.inputError]}>
              <TextInput
                style={[styles.input, { color: c.text }]}
                value={weight}
                onChangeText={t => { setWeight(t); setWeightError(false); }}
                placeholder="重量"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => repsInputRef.current?.focus()}
              />
              <Text style={[styles.inputUnit, { color: c.textMuted }]}>kg</Text>
            </View>
            <Text style={[styles.inputTimes, { color: c.textMuted }]}>×</Text>
            <View style={[styles.inputWrapper, { backgroundColor: c.surfaceLight, borderColor: c.border }, repsError && styles.inputError]}>
              <TextInput
                ref={repsInputRef}
                style={[styles.input, { color: c.text }]}
                value={reps}
                onChangeText={t => { setReps(t); setRepsError(false); }}
                placeholder="次数"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={handleCompleteSet}
              />
              <Text style={[styles.inputUnit, { color: c.textMuted }]}>次</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteSet} activeOpacity={0.7}>
            <Text style={styles.completeText}>完成本组</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 编辑已完成组弹窗 */}
      <Modal visible={!!editingSet} transparent animationType="fade" onRequestClose={() => setEditingSet(null)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setEditingSet(null)}>
          <View style={[styles.editModal, { backgroundColor: c.panel }]}>
            <Text style={[styles.editTitle, { color: c.text }]}>修改第 {editingSet?.setNumber} 组</Text>
            <View style={styles.editRow}>
              <View style={[styles.editInputWrap, { backgroundColor: c.surfaceLight, borderColor: c.border }]}>
                <TextInput
                  style={[styles.editInput, { color: c.text }]}
                  value={editWeight}
                  onChangeText={setEditWeight}
                  placeholder="重量"
                  placeholderTextColor={c.textMuted}
                  keyboardType="numeric"
                />
                <Text style={[styles.editUnit, { color: c.textMuted }]}>kg</Text>
              </View>
              <Text style={[styles.editTimes, { color: c.textMuted }]}>×</Text>
              <View style={[styles.editInputWrap, { backgroundColor: c.surfaceLight, borderColor: c.border }]}>
                <TextInput
                  style={[styles.editInput, { color: c.text }]}
                  value={editReps}
                  onChangeText={setEditReps}
                  placeholder="次数"
                  placeholderTextColor={c.textMuted}
                  keyboardType="numeric"
                />
                <Text style={[styles.editUnit, { color: c.textMuted }]}>次</Text>
              </View>
            </View>
            <View style={styles.editBtns}>
              <TouchableOpacity style={[styles.editBtnCancel, { borderColor: c.border }]} onPress={() => setEditingSet(null)}>
                <Text style={[styles.editBtnCancelText, { color: c.textMuted }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editBtnSave} onPress={handleSaveEdit}>
                <Text style={styles.editBtnSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.rail,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderBadge: {
    width: 28, height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1, borderColor: colors.primaryDark,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm,
  },
  orderText: { color: colors.primaryLight, fontSize: fontSize.sm, fontWeight: '700' },
  nameText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600', flex: 1 },
  completedBadge: {
    backgroundColor: 'rgba(97,211,148,0.2)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  completedBadgeText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '600' },
  deleteButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  deleteText: { color: colors.danger, fontSize: fontSize.sm },

  setsList: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  setRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rail,
  },
  setNumber: { color: colors.textMuted, fontSize: fontSize.sm, minWidth: 50 },
  setData: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 4, paddingHorizontal: spacing.xs, borderRadius: borderRadius.sm,
  },
  setWeight: { color: colors.metric, fontSize: fontSize.md, fontWeight: '500', minWidth: 50, textAlign: 'right' },
  setSeparator: { color: colors.textMuted, fontSize: fontSize.md, marginHorizontal: spacing.sm },
  setReps: { color: colors.accent, fontSize: fontSize.md, fontWeight: '500', minWidth: 40, textAlign: 'right' },

  inputRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  setLabel: { marginBottom: spacing.sm },
  setLabelText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingLeft: spacing.sm, paddingRight: spacing.xs, height: 48,
  },
  inputError: { borderColor: colors.danger },
  input: {
    flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: '600',
    textAlign: 'center', textAlignVertical: 'center', paddingVertical: 0,
  },
  inputUnit: { color: colors.textMuted, fontSize: fontSize.xs, marginLeft: 2 },
  inputTimes: { color: colors.textMuted, fontSize: fontSize.lg },
  completeButton: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    height: 52, marginTop: spacing.sm,
    justifyContent: 'center', alignItems: 'center', width: '100%',
  },
  completeText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700', letterSpacing: 1 },

  restingBanner: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    alignItems: 'center', backgroundColor: colors.surfaceLight,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  restingText: { color: colors.warning, fontSize: fontSize.sm, fontWeight: '500' },
  restingHint: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },

  completedSection: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.lg,
    alignItems: 'center', borderTopWidth: 1,
  },
  completedText: { fontSize: fontSize.md, fontWeight: '600' },

  // 编辑弹窗
  modalBg: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  editModal: { borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%' },
  editTitle: { fontSize: fontSize.lg, fontWeight: '600', textAlign: 'center', marginBottom: spacing.lg },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  editInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md,
    borderWidth: 1, paddingHorizontal: spacing.sm, height: 48,
  },
  editInput: {
    flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: '600',
    textAlign: 'center', textAlignVertical: 'center', paddingVertical: 0,
  },
  editUnit: { color: colors.textMuted, fontSize: fontSize.xs, marginRight: 2 },
  editTimes: { color: colors.textMuted, fontSize: fontSize.lg },
  editBtns: { flexDirection: 'row', gap: spacing.sm },
  editBtnCancel: { flex: 1, borderWidth: 1, borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  editBtnCancelText: { fontSize: fontSize.md },
  editBtnSave: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  editBtnSaveText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
});
