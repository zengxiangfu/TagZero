
const DB_NAME = 'TagZeroDB'
const DB_VERSION = 1
export const STORE_LABEL_SETS = 'labelSets'

class Database {
    private db: IDBDatabase | null = null
    private openPromise: Promise<void> | null = null

    async open(): Promise<void> {
        if (this.openPromise) return this.openPromise

        this.openPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = (event) => {
                console.error('Database error:', event)
                reject(event)
            }

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result
                resolve()
            }

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result
                if (!db.objectStoreNames.contains(STORE_LABEL_SETS)) {
                    db.createObjectStore(STORE_LABEL_SETS, { keyPath: 'id' })
                }
            }
        })

        return this.openPromise
    }

    async getAll<T>(storeName: string): Promise<T[]> {
        await this.open()
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('Database not initialized'))
            
            const transaction = this.db.transaction([storeName], 'readonly')
            const store = transaction.objectStore(storeName)
            const request = store.getAll()

            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async put<T>(storeName: string, value: T): Promise<void> {
        await this.open()
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('Database not initialized'))

            const transaction = this.db.transaction([storeName], 'readwrite')
            const store = transaction.objectStore(storeName)
            const request = store.put(value)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    async delete(storeName: string, key: string): Promise<void> {
        await this.open()
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('Database not initialized'))

            const transaction = this.db.transaction([storeName], 'readwrite')
            const store = transaction.objectStore(storeName)
            const request = store.delete(key)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }
}

export const db = new Database()
