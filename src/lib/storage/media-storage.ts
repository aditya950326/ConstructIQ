/**
 * Production-grade client-side media storage using IndexedDB.
 * Bypasses the 5MB browser localStorage limit so site personnel can upload
 * real high-resolution photos and drone/phone inspection videos (up to 1GB+).
 */

const DB_NAME = "constructiq_media_vault";
const STORE_NAME = "media_files";
const DB_VERSION = 1;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const mediaStorage = {
  async saveFile(id: string, file: Blob | File): Promise<string> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const item = {
          id,
          blob: file,
          name: (file as File).name || "site-media",
          type: file.type,
          size: file.size,
          savedAt: new Date().toISOString(),
        };

        const req = store.put(item);
        req.onsuccess = () => {
          const url = URL.createObjectURL(file);
          resolve(url);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      // Fallback to object URL if indexeddb fails
      return URL.createObjectURL(file);
    }
  },

  async storeMediaBlob(id: string, file: Blob | File): Promise<string> {
    return this.saveFile(id, file);
  },

  async getFileUrl(id: string): Promise<string | null> {
    try {
      const db = await getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(URL.createObjectURL(req.result.blob));
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  },

  async countFiles(): Promise<number> {
    try {
      const db = await getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      });
    } catch (e) {
      return 0;
    }
  },

  async deleteFile(id: string): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch (e) {
      // ignore
    }
  },
};
