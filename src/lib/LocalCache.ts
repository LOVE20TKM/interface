// lib/LocalCache.ts
// 通用的 localStorage 缓存工具类

/**
 * 缓存选项
 */
export interface LocalCacheOptions {
  /** 过期时间（毫秒），设置后会在指定时间后自动过期 */
  expiresIn?: number;
}

/**
 * 内部缓存数据结构
 */
interface CacheItem<T> {
  data: T;
  timestamp?: number;
  expiresAt?: number;
}

/**
 * 通用的 localStorage 缓存工具类
 *
 * 功能：
 * 1. 类型安全的缓存读写
 * 2. 自动处理 BigInt 序列化/反序列化
 * 3. 支持可选的过期时间
 * 4. 统一的错误处理
 * 5. 客户端环境检查
 */
export class LocalCache {
  /**
   * 检查是否在客户端环境
   */
  private static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * 序列化值（处理 BigInt）
   */
  private static serialize<T>(value: T): string {
    return JSON.stringify(value, (key, val) => {
      // 将 BigInt 转为字符串
      if (typeof val === 'bigint') {
        return val.toString();
      }
      return val;
    });
  }

  /**
   * 反序列化值（处理 BigInt）
   */
  private static deserialize<T>(json: string): T {
    return JSON.parse(json, (key, val) => {
      // 如果值是字符串且看起来像 BigInt（纯数字字符串），保持为字符串
      // 调用方需要根据类型自行转换
      return val;
    }) as T;
  }

  /**
   * 读取缓存
   *
   * @param key 缓存键
   * @returns 缓存值，如果不存在或已过期则返回 null
   *
   * @example
   * ```typescript
   * const groupId = LocalCache.get<bigint>('groupId');
   * if (groupId) {
   *   const id = BigInt(groupId); // 如果是字符串形式的 BigInt
   * }
   * ```
   */
  static get<T>(key: string): T | null {
    if (!this.isClient()) return null;

    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const item: CacheItem<T> = this.deserialize(cached);

      // 检查是否过期
      if (item.expiresAt && Date.now() > item.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error(`读取缓存失败 [${key}]:`, error);
      return null;
    }
  }

  /**
   * 保存缓存
   *
   * @param key 缓存键
   * @param value 缓存值
   * @param options 缓存选项（可选）
   *
   * @example
   * ```typescript
   * // 简单使用
   * LocalCache.set('groupId', '123');
   *
   * // 带过期时间（24小时）
   * LocalCache.set('groupId', '123', { expiresIn: 24 * 60 * 60 * 1000 });
   *
   * // 存储 BigInt（自动转为字符串）
   * LocalCache.set('groupId', BigInt(123));
   * ```
   */
  static set<T>(key: string, value: T, options?: LocalCacheOptions): void {
    if (!this.isClient()) return;

    try {
      const item: CacheItem<T> = {
        data: value,
        timestamp: Date.now(),
      };

      // 如果设置了过期时间，计算过期时间戳
      if (options?.expiresIn) {
        item.expiresAt = Date.now() + options.expiresIn;
      }

      localStorage.setItem(key, this.serialize(item));
    } catch (error) {
      console.error(`保存缓存失败 [${key}]:`, error);
    }
  }

  /**
   * 删除缓存
   *
   * @param key 缓存键
   */
  static remove(key: string): void {
    if (!this.isClient()) return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`删除缓存失败 [${key}]:`, error);
    }
  }

  /**
   * 检查缓存是否存在且未过期
   *
   * @param key 缓存键
   * @returns 是否存在
   */
  static has(key: string): boolean {
    if (!this.isClient()) return false;

    try {
      const cached = localStorage.getItem(key);
      if (!cached) return false;

      const item: CacheItem<unknown> = this.deserialize(cached);

      // 检查是否过期
      if (item.expiresAt && Date.now() > item.expiresAt) {
        localStorage.removeItem(key);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`检查缓存失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 清除所有缓存（谨慎使用）
   */
  static clear(): void {
    if (!this.isClient()) return;

    try {
      localStorage.clear();
    } catch (error) {
      console.error('清除所有缓存失败:', error);
    }
  }
}
