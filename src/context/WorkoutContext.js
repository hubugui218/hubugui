// 训练状态全局管理 — 基于时间戳的计时架构
// 训练时长和休息倒计时都以真实时间戳为事实来源，后台恢复自动正确

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import * as database from '../storage/database';
import { generateId } from '../utils/uuid';
import { timerAlert } from '../utils/vibration';

const WorkoutContext = createContext(null);

// ==================== Action Types ====================

const ACTIONS = {
  SET_SETTINGS: 'SET_SETTINGS',
  START_WORKOUT: 'START_WORKOUT',
  RESUME_WORKOUT: 'RESUME_WORKOUT',
  END_WORKOUT: 'END_WORKOUT',
  ADD_EXERCISE: 'ADD_EXERCISE',
  REMOVE_EXERCISE: 'REMOVE_EXERCISE',
  COMPLETE_SET: 'COMPLETE_SET',
  COMPLETE_EXERCISE: 'COMPLETE_EXERCISE',
  TICK: 'TICK',
  SKIP_REST: 'SKIP_REST',
  ADD_REST_TIME: 'ADD_REST_TIME',
  SET_REST_TIME: 'SET_REST_TIME',
  EDIT_SET: 'EDIT_SET',
};

// ==================== 工具函数 ====================

function localISO() {
  const d = new Date();
  const p = v => String(v).padStart(2, '0');
  const tzOff = -d.getTimezoneOffset();
  const sign = tzOff >= 0 ? '+' : '-';
  const offH = String(Math.floor(Math.abs(tzOff) / 60)).padStart(2, '0');
  const offM = String(Math.abs(tzOff) % 60).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${sign}${offH}:${offM}`;
}

function calcElapsed(startedAt) {
  // 安全解析：无时区的 localISO 字符串也当作本地时间
  let ts = 0;
  if (typeof startedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(startedAt)) {
    const [dp, tp] = startedAt.split('T');
    const [y, m, d] = dp.split('-').map(Number);
    const [h, min, s] = tp.split(':').map(Number);
    ts = new Date(y, m - 1, d, h, min, s).getTime();
  } else {
    ts = new Date(startedAt).getTime();
  }
  return Math.floor((Date.now() - ts) / 1000);
}

function calcRestRemaining(restTimer) {
  if (!restTimer.isActive) return restTimer;
  const elapsed = Math.floor((Date.now() - restTimer.restStartedAt) / 1000);
  const remaining = restTimer.restDuration - elapsed;
  if (remaining <= 0) {
    return { ...restTimer, isActive: false, remainingSeconds: 0 };
  }
  return { ...restTimer, remainingSeconds: remaining };
}

function makeRestState(durationSec, exerciseId) {
  return {
    isActive: true,
    exerciseId,
    restStartedAt: Date.now(),
    restDuration: durationSec,
    remainingSeconds: durationSec,
  };
}

function makeIdleRest(defaultSec) {
  return {
    isActive: false,
    exerciseId: null,
    restStartedAt: 0,
    restDuration: defaultSec,
    remainingSeconds: defaultSec,
  };
}

// ==================== Initial State ====================

const initialState = {
  activeWorkout: null,
  exercises: [],
  workoutElapsed: 0,
  restTimer: makeIdleRest(90),
  settings: { defaultRestSeconds: 90, weightUnit: 'kg', timerAlertEnabled: true },
};

// ==================== Reducer ====================

function workoutReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_SETTINGS:
      return { ...state, settings: action.payload };

    case ACTIONS.START_WORKOUT: {
      const recordDate = action.payload?.date || null;
      const workout = { id: generateId(), startedAt: localISO(), recordDate };
      const exercises = (action.payload?.exercises || []).map((ex, i) => ({
        id: generateId(),
        workoutId: workout.id,
        name: typeof ex === 'string' ? ex : ex.name,
        order: i + 1,
        sets: [],
        completed: false,
        defaultWeight: typeof ex === 'string' ? '' : (ex.weight || ''),
        defaultReps: typeof ex === 'string' ? '' : (ex.reps || ''),
      }));
      return {
        ...state,
        activeWorkout: workout,
        exercises,
        workoutElapsed: 0,
        restTimer: makeIdleRest(state.settings.defaultRestSeconds),
      };
    }

    case ACTIONS.RESUME_WORKOUT: {
      const { workout, exercises, restTimer } = action.payload;
      const elapsed = calcElapsed(workout.startedAt);
      return {
        ...state,
        activeWorkout: workout,
        exercises: exercises || [],
        workoutElapsed: Math.max(0, elapsed),
        restTimer: restTimer
          ? calcRestRemaining(restTimer)
          : makeIdleRest(state.settings.defaultRestSeconds),
      };
    }

    case ACTIONS.END_WORKOUT:
      return {
        ...state,
        activeWorkout: null,
        exercises: [],
        workoutElapsed: 0,
        restTimer: makeIdleRest(state.settings.defaultRestSeconds),
      };

    case ACTIONS.ADD_EXERCISE: {
      const ex = {
        id: generateId(),
        workoutId: state.activeWorkout.id,
        name: action.payload.name,
        order: state.exercises.length + 1,
        sets: [],
        completed: false,
        defaultWeight: '',
        defaultReps: '',
      };
      return { ...state, exercises: [...state.exercises, ex] };
    }

    case ACTIONS.REMOVE_EXERCISE: {
      const filtered = state.exercises.filter(e => e.id !== action.payload.exerciseId);
      return { ...state, exercises: filtered.map((e, i) => ({ ...e, order: i + 1 })) };
    }

    // 记录组数据并自动启动休息计时
    case ACTIONS.COMPLETE_SET: {
      const { exerciseId, weight, reps } = action.payload;
      const now = localISO();
      return {
        ...state,
        exercises: state.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          const setNum = ex.sets.length + 1;
          const newSet = {
            id: generateId(),
            exerciseEntryId: ex.id,
            setNumber: setNum,
            weight: Number(weight),
            reps: Number(reps),
            completedAt: now,
            restSeconds: state.settings.defaultRestSeconds,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }),
        restTimer: makeRestState(state.settings.defaultRestSeconds, exerciseId),
      };
    }

    // 用户选择结束本动作，标记为完成
    case ACTIONS.COMPLETE_EXERCISE: {
      return {
        ...state,
        exercises: state.exercises.map(ex => {
          if (ex.id !== action.payload.exerciseId) return ex;
          return { ...ex, completed: true };
        }),
        restTimer: { ...state.restTimer, isActive: false, remainingSeconds: 0 },
      };
    }

    // 统一 Tick：同时更新训练时长和休息剩余时间（均基于时间戳计算）
    case ACTIONS.TICK: {
      const elapsed = state.activeWorkout ? calcElapsed(state.activeWorkout.startedAt) : 0;
      const rest = calcRestRemaining(state.restTimer);
      return { ...state, workoutElapsed: elapsed, restTimer: rest };
    }

    case ACTIONS.SKIP_REST:
      return { ...state, restTimer: { ...state.restTimer, isActive: false, remainingSeconds: 0 } };

    case ACTIONS.ADD_REST_TIME: {
      const sec = action.payload.seconds;
      const elapsed = Math.floor((Date.now() - state.restTimer.restStartedAt) / 1000);
      const newDuration = state.restTimer.restDuration + sec;
      return {
        ...state,
        restTimer: {
          ...state.restTimer,
          restDuration: newDuration,
          remainingSeconds: Math.max(0, newDuration - elapsed),
        },
      };
    }

    case ACTIONS.EDIT_SET: {
      const { exerciseId, setId, weight, reps } = action.payload;
      return {
        ...state,
        exercises: state.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map(s => {
              if (s.id !== setId) return s;
              return { ...s, weight: Number(weight), reps: Number(reps) };
            }),
          };
        }),
      };
    }

    case ACTIONS.SET_REST_TIME: {
      const elapsed = Math.floor((Date.now() - state.restTimer.restStartedAt) / 1000);
      const newRemaining = Math.max(0, action.payload.seconds - elapsed);
      return {
        ...state,
        restTimer: {
          ...state.restTimer,
          restDuration: action.payload.seconds,
          remainingSeconds: newRemaining,
          isActive: newRemaining > 0,
        },
      };
    }

    default:
      return state;
  }
}

// ==================== Provider ====================

export function WorkoutProvider({ children }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);

  const stateRef = useRef(state);
  stateRef.current = state;

  const tickRef = useRef(null);

  // ==================== 初始化加载 ====================

  useEffect(() => {
    database.getSettings().then(s =>
      dispatch({ type: ACTIONS.SET_SETTINGS, payload: s })
    );
  }, []);

  // ==================== 统一计时 Tick ====================

  useEffect(() => {
    const needsTick = !!state.activeWorkout || state.restTimer.isActive;
    if (needsTick) {
      tickRef.current = setInterval(() => {
        dispatch({ type: ACTIONS.TICK });
      }, 1000);
    } else {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [!!state.activeWorkout, state.restTimer.isActive]);

  // ==================== 休息倒计时结束震动 ====================

  const wasRestActiveRef = useRef(state.restTimer.isActive);
  useEffect(() => {
    const wasActive = wasRestActiveRef.current;
    const isActive = state.restTimer.isActive;
    wasRestActiveRef.current = isActive;

    if (wasActive && !isActive && state.restTimer.remainingSeconds === 0) {
      if (stateRef.current.settings.timerAlertEnabled) {
        timerAlert();
      }
    }
  }, [state.restTimer.isActive, state.restTimer.remainingSeconds]);

  // ==================== 持久化活跃训练 ====================

  useEffect(() => {
    if (state.activeWorkout) {
      database.saveActiveWorkout({
        workout: state.activeWorkout,
        exercises: state.exercises,
        restTimer: state.restTimer,
      });
    }
  }, [state.activeWorkout, state.exercises, state.restTimer.isActive, state.restTimer.restDuration]);

  // ==================== Actions ====================

  const actions = {
    startWorkout: useCallback((exercises = [], date) => {
      dispatch({ type: ACTIONS.START_WORKOUT, payload: { exercises, date } });
    }, []),

    resumeWorkout: useCallback((data) => {
      dispatch({ type: ACTIONS.RESUME_WORKOUT, payload: data });
    }, []),

    endWorkout: useCallback(async () => {
      const s = stateRef.current;
      const endedAt = localISO();
      const workout = {
        ...s.activeWorkout,
        endedAt,
        durationSeconds: calcElapsed(s.activeWorkout.startedAt),
        exercises: s.exercises,
      };
      await database.saveWorkout(workout);
      await database.clearActiveWorkout();
      dispatch({ type: ACTIONS.END_WORKOUT });
      return workout;
    }, []),

    discardWorkout: useCallback(async () => {
      await database.clearActiveWorkout();
      dispatch({ type: ACTIONS.END_WORKOUT });
    }, []),

    addExercise: useCallback((name) => {
      dispatch({ type: ACTIONS.ADD_EXERCISE, payload: { name } });
    }, []),

    removeExercise: useCallback((exerciseId) => {
      dispatch({ type: ACTIONS.REMOVE_EXERCISE, payload: { exerciseId } });
    }, []),

    completeSet: useCallback((exerciseId, weight, reps) => {
      dispatch({ type: ACTIONS.COMPLETE_SET, payload: { exerciseId, weight, reps } });
    }, []),

    completeExercise: useCallback((exerciseId) => {
      dispatch({ type: ACTIONS.COMPLETE_EXERCISE, payload: { exerciseId } });
    }, []),

    editSet: useCallback((exerciseId, setId, weight, reps) => {
      dispatch({ type: ACTIONS.EDIT_SET, payload: { exerciseId, setId, weight, reps } });
    }, []),

    skipRest: useCallback(() => dispatch({ type: ACTIONS.SKIP_REST }), []),
    addRestTime: useCallback((s = 30) => dispatch({ type: ACTIONS.ADD_REST_TIME, payload: { seconds: s } }), []),
    setRestTime: useCallback((s) => dispatch({ type: ACTIONS.SET_REST_TIME, payload: { seconds: s } }), []),

    updateSettings: useCallback(async (s) => {
      dispatch({ type: ACTIONS.SET_SETTINGS, payload: s });
      await database.saveSettings(s);
    }, []),

    checkActiveWorkout: useCallback(() => database.getActiveWorkout(), []),
  };

  return (
    <WorkoutContext.Provider value={{ state, ...actions }}>
      {children}
    </WorkoutContext.Provider>
  );
}

// ==================== Hook ====================

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within WorkoutProvider');
  return context;
}

export default WorkoutContext;
