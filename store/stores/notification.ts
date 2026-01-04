import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationCategory = 'system' | 'contract' | 'plan_request' | 'customer'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  read: boolean
  createdAt: string
  linkUrl?: string
  linkLabel?: string
  relatedId?: string
  relatedType?: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => string
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  getUnreadByCategory: (category: NotificationCategory) => Notification[]
  addContractNotification: (params: {
    contractId: string
    contractNumber: string
    teiName: string
    action: 'submitted' | 'approved' | 'returned' | 'completed'
    actorName: string
    comment?: string
  }) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const newNotification: Notification = {
          ...notification,
          id,
          read: false,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100),
          unreadCount: state.unreadCount + 1,
        }))
        return id
      },
      markAsRead: (id) =>
        set((state) => {
          const notification = state.notifications.find(n => n.id === id)
          if (!notification || notification.read) return state
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }
        }),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),
      deleteNotification: (id) =>
        set((state) => {
          const notification = state.notifications.find(n => n.id === id)
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          }
        }),
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
      getUnreadByCategory: (category) => {
        return get().notifications.filter((n) => !n.read && n.category === category)
      },
      addContractNotification: ({ contractId, contractNumber, teiName, action, actorName, comment }) => {
        const configs: Record<string, { title: string; message: string; type: NotificationType }> = {
          submitted: {
            title: '承認申請',
            message: `${teiName || contractNumber} の承認申請が${actorName}から送信されました`,
            type: 'info',
          },
          approved: {
            title: '承認完了',
            message: `${teiName || contractNumber} が${actorName}により承認されました${comment ? `: ${comment}` : ''}`,
            type: 'success',
          },
          returned: {
            title: '差戻し',
            message: `${teiName || contractNumber} が${actorName}により差戻されました: ${comment || ''}`,
            type: 'warning',
          },
          completed: {
            title: '契約完了',
            message: `${teiName || contractNumber} の承認フローが完了しました`,
            type: 'success',
          },
        }

        const config = configs[action]
        if (!config) return

        get().addNotification({
          title: config.title,
          message: config.message,
          type: config.type,
          category: 'contract',
          linkUrl: `/contracts/${contractId}`,
          linkLabel: '詳細を見る',
          relatedId: contractId,
          relatedType: 'contract',
        })
      },
    }),
    {
      name: 'ghouse-notifications',
    }
  )
)
