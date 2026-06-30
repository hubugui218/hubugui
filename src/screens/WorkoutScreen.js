// 训练中页面 - 核心页面
// 训练计时、动作列表、添加动作、结束训练

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius, COMMON_EXERCISES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useWorkout } from '../context/WorkoutContext';
import { formatDuration, formatDateTime } from '../utils/time';
import * as database from '../storage/database';
import ExerciseSection from '../components/ExerciseSection';
import RestTimerBar from '../components/RestTimerBar';

export default function WorkoutScreen({ navigation }) {
  const { state, addExercise, endWorkout, discardWorkout, resumeWorkout, checkActiveWorkout } = useWorkout();
  const { colors: c } = useTheme();
  const { activeWorkout, exercises, workoutElapsed } = state;
  const [recentExercises, setRecentExercises] = useState([]);

  // 加载最近使用的动作
  useEffect(() => {
    database.getAllWorkouts().then(workouts => {
      const seen = new Set();
      const recent = [];
      for (const w of workouts) {
        for (const e of (w.exercises || [])) {
          if (!seen.has(e.name)) { seen.add(e.name); recent.push(e.name); }
          if (recent.length >= 8) break;
        }
        if (recent.length >= 8) break;
      }
      setRecentExercises(recent.length > 0 ? recent : COMMON_EXERCISES.slice(0, 6));
    });
  }, []);

  // 如果从首页"继续训练"进入，自动恢复未结束的训练
  useEffect(() => {
    if (!activeWorkout) {
      checkActiveWorkout().then(data => {
        if (data) resumeWorkout(data);
        else navigation.replace('Home');
      });
    }
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');

  const handleAddExercise = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addExercise(trimmed);
    setNewExerciseName('');
    setShowAddModal(false);
  };

  const handleEndWorkout = () => {
    if (exercises.length === 0) {
      Alert.alert('提示', '当前训练没有任何动作，确定要结束吗？', [
        { text: '继续训练', style: 'cancel' },
        {
          text: '放弃训练',
          style: 'destructive',
          onPress: async () => {
            await discardWorkout();
            navigation.goBack();
          },
        },
      ]);
      return;
    }

    Alert.alert('结束训练', `当前已训练 ${formatDuration(workoutElapsed)}，确定结束吗？`, [
      { text: '继续训练', style: 'cancel' },
      {
        text: '结束训练',
        onPress: async () => {
          const workout = await endWorkout();
          navigation.navigate('WorkoutDetail', { workoutId: workout.id });
        },
      },
    ]);
  };

  if (!activeWorkout) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>没有进行中的训练</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>返回首页</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* 顶部计时栏 */}
        <View style={[styles.timerBar, { backgroundColor: c.panel, borderBottomColor: c.border }]}>
          <View style={styles.timerRow}>
            <Text style={[styles.timerLabel, { color: c.textMuted }]}>训练时长</Text>
            <Text style={styles.timerValue}>{formatDuration(workoutElapsed)}</Text>
          </View>
          {exercises.length > 0 && (
            <Text style={[styles.currentEx, { color: c.text }]} numberOfLines={1}>
              {exercises.map(e => e.name).join(' · ')}
            </Text>
          )}
          <View style={styles.timerMeta}>
            <Text style={[styles.timerStartTime, { color: c.textMuted }]}>
              开始 {formatDateTime(activeWorkout.startedAt)}
            </Text>
            <TouchableOpacity
              style={styles.endButton}
              onPress={handleEndWorkout}
              activeOpacity={0.7}
            >
              <Text style={styles.endButtonText}>结束</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 动作列表 */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.exerciseList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {exercises.length === 0 ? (
            <View style={styles.noExercise}>
              <Text style={styles.noExerciseIcon}>💪</Text>
              <Text style={[styles.noExerciseText, { color: c.textSecondary }]}>还没有添加动作</Text>
              <Text style={[styles.noExerciseHint, { color: c.textMuted }]}>点击下方按钮添加训练动作</Text>
            </View>
          ) : (
            exercises.map((exercise) => (
              <ExerciseSection key={exercise.id} exercise={exercise} />
            ))
          )}

          {/* 添加动作按钮 */}
          <TouchableOpacity
            style={[styles.addExerciseButton, { backgroundColor: c.panel }]}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.addExerciseIcon}>+</Text>
            <Text style={styles.addExerciseText}>添加动作</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 底部休息倒计时栏 */}
        <RestTimerBar />
      </KeyboardAvoidingView>

      {/* 添加动作弹窗 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: c.panel, borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>添加动作</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>关闭</Text>
              </TouchableOpacity>
            </View>

            {/* 输入框 */}
            <View style={styles.modalInputRow}>
              <TextInput
                style={[styles.modalInput, { backgroundColor: c.surfaceLight, color: c.text }]}
                value={newExerciseName}
                onChangeText={setNewExerciseName}
                placeholder="输入动作名称，如：卧推"
                placeholderTextColor={c.textMuted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => handleAddExercise(newExerciseName)}
              />
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={() => handleAddExercise(newExerciseName)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalAddText}>添加</Text>
              </TouchableOpacity>
            </View>

            {/* 最近使用 */}
            {recentExercises.length > 0 && (
              <>
                <Text style={[styles.commonTitle, { color: c.textMuted }]}>最近使用</Text>
                <View style={styles.commonGrid}>
                  {recentExercises.map((name) => (
                    <TouchableOpacity key={'r'+name} style={[styles.commonChip, { backgroundColor: c.surfaceLight, borderColor: c.border }]} onPress={() => handleAddExercise(name)} activeOpacity={0.7}>
                      <Text style={[styles.commonChipText, { color: c.textSecondary }]}>{name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {/* 常用动作 */}
            <Text style={[styles.commonTitle, { color: c.textMuted }]}>常用动作</Text>
            <View style={styles.commonGrid}>
              {COMMON_EXERCISES.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={[styles.commonChip, { backgroundColor: c.surfaceLight, borderColor: c.border }]}
                  onPress={() => handleAddExercise(name)}
                  activeOpacity={0.7}
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },

  // 空状态
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  backButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },

  // 顶部计时栏
  timerBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  timerLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerValue: {
    color: colors.metric,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentEx: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  timerStartTime: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  endButton: {
    backgroundColor: colors.danger,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  endButtonText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // 动作列表
  exerciseList: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  noExercise: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  noExerciseIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  noExerciseText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
  },
  noExerciseHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },

  // 添加动作按钮
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    backgroundColor: colors.panel,
  },
  addExerciseIcon: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  addExerciseText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },

  // 弹窗
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  modalClose: {
    color: colors.primary,
    fontSize: fontSize.md,
  },
  modalInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalInput: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    textAlignVertical: 'center',
    height: 48,
  },
  modalAddButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
  },
  modalAddText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  commonTitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  commonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  commonChip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commonChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
