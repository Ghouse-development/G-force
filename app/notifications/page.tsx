'use client';

import { Layout } from '@/components/layout/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/store';
import { Bell, Calendar, FileText, BookOpen, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function NotificationsPage() {
  const { notifications, markAsRead, clearAll } = useNotificationStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'meeting_reminder':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'summary_ready':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'kb_updated':
        return <BookOpen className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">通知</h1>
            <p className="text-muted-foreground mt-2">
              重要な更新と予定をお知らせ
            </p>
          </div>
          {notifications.length > 0 && (
            <Button variant="outline" onClick={clearAll}>
              すべて削除
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">新しい通知はありません</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={notification.read ? 'opacity-60' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getIcon(notification.type)}
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {notification.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {notification.message}
                        </CardDescription>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(notification.createdAt, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <>
                          <Badge variant="default">未読</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Sample notifications for demo */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">デモ用通知サンプル</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">14:00 山田様との商談</p>
                <p className="text-xs text-muted-foreground">30分前にリマインド</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-4 w-4 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">議事録が完成しました</p>
                <p className="text-xs text-muted-foreground">佐藤様との商談記録</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BookOpen className="h-4 w-4 text-purple-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">知識ベース更新</p>
                <p className="text-xs text-muted-foreground">新しい補助金情報追加</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}