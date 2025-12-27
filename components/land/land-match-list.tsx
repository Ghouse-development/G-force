'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  MapPin,
  DollarSign,
  Ruler,
  Train,
  ExternalLink,
  Bell,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import type { LandProperty } from '@/lib/land/land-conditions'
import { useLandStore } from '@/store/land-store'

interface LandMatchListProps {
  customerId: string
  onPropertyClick?: (property: LandProperty) => void
}

export function LandMatchList({ customerId, onPropertyClick }: LandMatchListProps) {
  const { getMatchesForCustomer, getPropertyById, getAlertsForCustomer } = useLandStore()

  const matches = getMatchesForCustomer(customerId)
  const alerts = getAlertsForCustomer(customerId)

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>マッチングする土地物件がありません</p>
          <p className="text-sm">土地情報を取り込むと、条件に合う物件が表示されます</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => {
        const property = getPropertyById(match.propertyId)
        if (!property) return null

        const alert = alerts.find(a => a.matchResult.propertyId === match.propertyId)

        return (
          <Card
            key={match.propertyId}
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              match.alertLevel === 'high' ? 'border-l-4 border-l-green-500' :
              match.alertLevel === 'medium' ? 'border-l-4 border-l-yellow-500' : ''
            }`}
            onClick={() => onPropertyClick?.(property)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">{property.name}</h4>
                  <p className="text-sm text-muted-foreground">{property.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  {alert && (
                    <Badge variant={alert.status === 'contacted' ? 'default' : 'secondary'} className="gap-1">
                      {alert.status === 'contacted' ? (
                        <><CheckCircle className="w-3 h-3" />連絡済</>
                      ) : alert.status === 'notified' ? (
                        <><Bell className="w-3 h-3" />通知済</>
                      ) : (
                        <><AlertTriangle className="w-3 h-3" />要対応</>
                      )}
                    </Badge>
                  )}
                  <Badge
                    variant={match.alertLevel === 'high' ? 'default' : 'outline'}
                    className={
                      match.alertLevel === 'high' ? 'bg-green-500' :
                      match.alertLevel === 'medium' ? 'bg-yellow-500 text-black' : ''
                    }
                  >
                    {match.matchScore}%
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{property.price.toLocaleString()}万円</span>
                </div>
                <div className="flex items-center gap-1">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <span>{property.landArea}坪</span>
                </div>
                <div className="flex items-center gap-1">
                  <Train className="w-4 h-4 text-muted-foreground" />
                  <span>{property.nearestStation} 徒歩{property.stationDistance}分</span>
                </div>
                <div className="text-muted-foreground">
                  坪単価 {property.pricePerTsubo.toLocaleString()}万円
                </div>
              </div>

              <div className="space-y-1.5">
                {match.matchDetails.slice(0, 4).map((detail, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-muted-foreground">{detail.label}</span>
                    <Progress
                      value={(detail.score / detail.maxScore) * 100}
                      className="h-1.5 flex-1"
                    />
                    <span className="w-24 text-right text-muted-foreground">
                      {detail.reason}
                    </span>
                  </div>
                ))}
              </div>

              {property.sourceUrl && (
                <div className="mt-3 pt-2 border-t">
                  <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                    <a href={property.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      物件詳細を見る
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
