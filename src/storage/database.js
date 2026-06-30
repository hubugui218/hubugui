// 数据持久层 - 基于 AsyncStorage 的本地存储
// 第一版纯本地存储，后续可扩展云同步

import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseLocal } from '../utils/time';

// 存储键名
const KEYS = {
  WORKOUTS: '@fitness/workouts',
  SETTINGS: '@fitness/settings',
  ACTIVE_WORKOUT_ID: '@fitness/active_workout_id',
  ACTIVE_WORKOUT_DATA: '@fitness/active_workout_data',
  BODY_PARTS: '@fitness/body_parts',
};

// ==================== 训练记录 CRUD ====================

/**
 * 获取所有已完成的训练记录列表
 * @returns {Promise<Array>} 按时间倒序排列
 */
export async function getAllWorkouts() {
  try {
    const json = await AsyncStorage.getItem(KEYS.WORKOUTS);
    if (!json) return [];
    const workouts = JSON.parse(json);
    // 按开始时间倒序排列
    return workouts.sort((a, b) => parseLocal(b.startedAt) - parseLocal(a.startedAt));
  } catch (e) {
    console.error('获取训练列表失败:', e);
    return [];
  }
}

/**
 * 根据 ID 获取单次训练记录
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getWorkout(id) {
  try {
    const workouts = await getAllWorkouts();
    return workouts.find((w) => w.id === id) || null;
  } catch (e) {
    console.error('获取训练记录失败:', e);
    return null;
  }
}

/**
 * 保存训练记录（新增或更新）
 * @param {Object} workout 训练记录对象
 */
export async function saveWorkout(workout) {
  try {
    const workouts = await getAllWorkouts();
    const index = workouts.findIndex((w) => w.id === workout.id);
    if (index >= 0) {
      workouts[index] = { ...workout, updatedAt: new Date().toISOString() };
    } else {
      workouts.push({
        ...workout,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts));
  } catch (e) {
    console.error('保存训练记录失败:', e);
  }
}

/**
 * 删除训练记录
 * @param {string} id
 */
export async function deleteWorkout(id) {
  try {
    const workouts = await getAllWorkouts();
    const filtered = workouts.filter((w) => w.id !== id);
    await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(filtered));
  } catch (e) {
    console.error('删除训练记录失败:', e);
  }
}

// ==================== 活跃训练管理 ====================

/**
 * 获取当前活跃训练（未结束的训练）
 * @returns {Promise<Object|null>} 活跃训练数据或 null
 */
export async function getActiveWorkout() {
  try {
    const json = await AsyncStorage.getItem(KEYS.ACTIVE_WORKOUT_DATA);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error('获取活跃训练失败:', e);
    return null;
  }
}

/**
 * 保存当前活跃训练状态
 * @param {Object} data 训练数据（包含 workout, exercises）
 */
export async function saveActiveWorkout(data) {
  try {
    await AsyncStorage.setItem(KEYS.ACTIVE_WORKOUT_DATA, JSON.stringify(data));
    if (data && data.workout) {
      await AsyncStorage.setItem(KEYS.ACTIVE_WORKOUT_ID, data.workout.id);
    }
  } catch (e) {
    console.error('保存活跃训练失败:', e);
  }
}

/**
 * 清除活跃训练状态（训练结束后调用）
 */
export async function clearActiveWorkout() {
  try {
    await AsyncStorage.removeItem(KEYS.ACTIVE_WORKOUT_DATA);
    await AsyncStorage.removeItem(KEYS.ACTIVE_WORKOUT_ID);
  } catch (e) {
    console.error('清除活跃训练失败:', e);
  }
}

// ==================== 设置管理 ====================

const DEFAULT_SETTINGS = {
  defaultRestSeconds: 90,
  weightUnit: 'kg',
  timerAlertEnabled: true,
};

/**
 * 获取用户设置
 * @returns {Promise<Object>}
 */
export async function getSettings() {
  try {
    const json = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!json) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
  } catch (e) {
    console.error('获取设置失败:', e);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * 保存用户设置
 * @param {Object} settings
 */
export async function saveSettings(settings) {
  try {
    const existing = await getSettings();
    const merged = { ...existing, ...settings };
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
  } catch (e) {
    console.error('保存设置失败:', e);
  }
}

// ==================== 训练部位管理 ====================

export async function getBodyParts() {
  try {
    const json = await AsyncStorage.getItem(KEYS.BODY_PARTS);
    return json ? JSON.parse(json) : {};
  } catch (e) { return {}; }
}

export async function setBodyPart(dateKey, part) {
  try {
    const map = await getBodyParts();
    if (part) {
      map[dateKey] = part;
    } else {
      delete map[dateKey];
    }
    await AsyncStorage.setItem(KEYS.BODY_PARTS, JSON.stringify(map));
  } catch (e) { console.error('保存部位失败:', e); }
}
