/**
 * バリデーション関数
 */

import { Task, Folder, Settings } from '@/types/models';

/**
 * 文字列が空でないかチェック
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * 数値が範囲内かチェック
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * タスクタイトルのバリデーション
 */
export function validateTaskTitle(title: string): { valid: boolean; error?: string } {
  if (!isNotEmpty(title)) {
    return { valid: false, error: 'タイトルを入力してください' };
  }
  if (title.length > 200) {
    return { valid: false, error: 'タイトルは200文字以内で入力してください' };
  }
  return { valid: true };
}

/**
 * タスクのバリデーション
 */
export function validateTask(task: Partial<Task>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // タイトル
  if (!task.title || !isNotEmpty(task.title)) {
    errors.push('タイトルを入力してください');
  } else if (task.title.length > 200) {
    errors.push('タイトルは200文字以内で入力してください');
  }

  // 目標時間
  if (task.goalMinutes !== undefined && task.goalMinutes < 0) {
    errors.push('目標時間は0以上で入力してください');
  }
  if (task.goalMinutes !== undefined && task.goalMinutes > 999) {
    errors.push('目標時間は999分以内で入力してください');
  }

  // 目標量
  if (task.amount !== undefined && task.amount < 0) {
    errors.push('目標量は0以上で入力してください');
  }
  if (task.amount !== undefined && task.amount > 99999) {
    errors.push('目標量は99999以内で入力してください');
  }

  // 現在の量
  if (task.currentAmount !== undefined && task.currentAmount < 0) {
    errors.push('現在の量は0以上で入力してください');
  }
  if (
    task.currentAmount !== undefined &&
    task.amount !== undefined &&
    task.currentAmount > task.amount
  ) {
    errors.push('現在の量は目標量以下で入力してください');
  }

  // メモ
  if (task.notes && task.notes.length > 1000) {
    errors.push('メモは1000文字以内で入力してください');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * フォルダ名のバリデーション
 */
export function validateFolderName(name: string): { valid: boolean; error?: string } {
  if (!isNotEmpty(name)) {
    return { valid: false, error: 'フォルダ名を入力してください' };
  }
  if (name.length > 50) {
    return { valid: false, error: 'フォルダ名は50文字以内で入力してください' };
  }
  return { valid: true };
}

/**
 * フォルダのバリデーション
 */
export function validateFolder(folder: Partial<Folder>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!folder.name || !isNotEmpty(folder.name)) {
    errors.push('フォルダ名を入力してください');
  } else if (folder.name.length > 50) {
    errors.push('フォルダ名は50文字以内で入力してください');
  }

  if (folder.color && !/^#[0-9A-Fa-f]{6}$/.test(folder.color)) {
    errors.push('カラーコードが正しくありません');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 設定のバリデーション
 */
export function validateSettings(settings: Partial<Settings>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (settings.focusMinutes !== undefined) {
    if (!isInRange(settings.focusMinutes, 1, 180)) {
      errors.push('集中時間は1〜180分で設定してください');
    }
  }

  if (settings.shortBreakMinutes !== undefined) {
    if (!isInRange(settings.shortBreakMinutes, 1, 60)) {
      errors.push('短休憩は1〜60分で設定してください');
    }
  }

  if (settings.longBreakMinutes !== undefined) {
    if (!isInRange(settings.longBreakMinutes, 1, 120)) {
      errors.push('長休憩は1〜120分で設定してください');
    }
  }

  if (settings.roundsUntilLongBreak !== undefined) {
    if (!isInRange(settings.roundsUntilLongBreak, 1, 12)) {
      errors.push('ラウンド数は1〜12で設定してください');
    }
  }

  if (settings.dailyGoalMinutes !== undefined && settings.dailyGoalMinutes < 0) {
    errors.push('日次目標は0以上で設定してください');
  }

  if (settings.weeklyGoalMinutes !== undefined && settings.weeklyGoalMinutes < 0) {
    errors.push('週次目標は0以上で設定してください');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URLのバリデーション
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * カラーコードのバリデーション
 */
export function validateColorCode(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}
