/**
 * フォルダ管理クラス
 */

import { Folder } from '@/types/models';
import { db } from '@/storage/DatabaseManager';
import { EventEmitter } from '@/utils/EventEmitter';
import { validateFolder } from '@/utils/validators';
import { DEFAULT_FOLDER } from '@/config/constants';

export class FolderManager extends EventEmitter {
  private folders: Folder[] = [];

  /**
   * 初期化
   */
  async init(): Promise<void> {
    await this.loadFolders();
    
    // デフォルトフォルダが存在しない場合は作成
    const defaultFolder = this.folders.find((f) => f.id === 'default');
    if (!defaultFolder) {
      await this.createFolder(DEFAULT_FOLDER);
    }
  }

  /**
   * フォルダの読み込み
   */
  private async loadFolders(): Promise<void> {
    this.folders = await db.getAll<Folder>('folders');
    this.folders.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * フォルダ取得
   */
  getFolder(id: string): Folder | undefined {
    return this.folders.find((f) => f.id === id);
  }

  /**
   * 全フォルダ取得
   */
  getAllFolders(): Folder[] {
    return [...this.folders];
  }

  /**
   * フォルダ作成
   */
  async createFolder(
    folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Folder> {
    // バリデーション
    const validation = validateFolder(folderData);
    if (!validation.valid) {
      throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
    }

    const folder: Folder = {
      ...folderData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.put('folders', folder);
    this.folders.push(folder);
    this.folders.sort((a, b) => a.sortOrder - b.sortOrder);

    return folder;
  }

  /**
   * フォルダ更新
   */
  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
    const folder = this.getFolder(id);
    if (!folder) {
      throw new Error(`フォルダが見つかりません: ${id}`);
    }

    const updatedFolder = {
      ...folder,
      ...updates,
      updatedAt: new Date(),
    };

    // バリデーション
    const validation = validateFolder(updatedFolder);
    if (!validation.valid) {
      throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
    }

    await db.put('folders', updatedFolder);

    const index = this.folders.findIndex((f) => f.id === id);
    if (index !== -1) {
      this.folders[index] = updatedFolder;
    }

    return updatedFolder;
  }

  /**
   * フォルダ削除
   */
  async deleteFolder(id: string): Promise<void> {
    if (id === 'default') {
      throw new Error('デフォルトフォルダは削除できません');
    }

    const folder = this.getFolder(id);
    if (!folder) {
      throw new Error(`フォルダが見つかりません: ${id}`);
    }

    await db.delete('folders', id);

    this.folders = this.folders.filter((f) => f.id !== id);
  }

  /**
   * 並び順変更
   */
  async reorderFolders(folderIds: string[]): Promise<void> {
    const updates = folderIds.map((id, index) => {
      const folder = this.getFolder(id);
      if (!folder) return null;
      return { ...folder, sortOrder: index, updatedAt: new Date() };
    }).filter((f): f is Folder => f !== null);

    await db.putBulk('folders', updates);
    this.folders = updates;
  }

  /**
   * ID生成
   */
  private generateId(): string {
    return `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
