'use client'
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

type InheritanceRequestStatus =
  | 'pending'
  | 'confirming'
  | 'gracePeriod'
  | 'completed'
  | 'denied'

type InheritanceRequest = {
  id: number
  targetUserName: string
  status: InheritanceRequestStatus
  updatedAt: string
  revealedInfo?: string
}

export default function HeirPortal() {

  // ▼ デモ用: 相続申請リスト
  const [requests, setRequests] = useState<InheritanceRequest[]>([
    {
      id: 1,
      targetUserName: '本田 圭介',
      status: 'pending',
      updatedAt: '2025/01/10',
    },
    {
      id: 2,
      targetUserName: '山本 修平',
      status: 'completed',
      updatedAt: '2025/02/01',
      revealedInfo:
        'Twitterパスワード: abcd1234\n' +
        'Amazonログイン: user@example.com / pass: xxxxxx'
    },
    {
      id: 3,
      targetUserName: '佐藤 太郎',
      status: 'denied',
      updatedAt: '2025/02/15'
    }
  ])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState('')
  const [loading, setLoading] = useState(false)

  // ▼ 新規申請で選択する「被相続人」候補（デモ用）
  const targetCandidates = [
    { name: '大谷 翔平', avatarUrl: '/icons/user2.png' },
    { name: '山本 由伸', avatarUrl: '/icons/user3.png' },
    { name: '佐藤 輝明', avatarUrl: '/icons/user4.png' },
    { name: '森下 翔太',      avatarUrl: '/icons/user5.png' },
  ]

  // 被相続人の選択（Select用）
  const [selectedTarget, setSelectedTarget] = useState('')

  // 完了した申請の閲覧用
  const [viewingRequest, setViewingRequest] = useState<InheritanceRequest|null>(null)

  function openDialog(type:string) {
    setDialogType(type)
    setDialogOpen(true)
  }
  function closeDialog() {
    if (loading) return
    setDialogType('')
    setViewingRequest(null)
    setDialogOpen(false)
  }

  // ------------------------------------------------
  // 相続申請（sendRequest）
  // ------------------------------------------------
  function handleSendRequest() {
    setLoading(true)
    setTimeout(() => {
      const newId = requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1
      const newReq: InheritanceRequest = {
        id: newId,
        targetUserName: selectedTarget || '不明',
        status: 'pending',
        updatedAt: new Date().toISOString().slice(0,10),
      }
      setRequests(prev => [...prev, newReq])
      setSelectedTarget('')  // 選択リセット
      setLoading(false)
      closeDialog()
    }, 1000)
  }

  // ------------------------------------------------
  // ステータスを日本語表現+色分け
  // ------------------------------------------------
  function statusToJapanese(status: InheritanceRequestStatus) {
    switch(status) {
      case 'pending':      return '申請中'
      case 'confirming':   return '確認中'
      case 'gracePeriod':  return '猶予期間'
      case 'completed':    return '完了'
      case 'denied':       return '却下'
    }
  }
  function statusToBadgeColor(status: InheritanceRequestStatus) {
    switch(status) {
      case 'pending':      return 'bg-yellow-100 text-yellow-800'
      case 'confirming':   return 'bg-blue-100 text-blue-800'
      case 'gracePeriod':  return 'bg-orange-100 text-orange-800'
      case 'completed':    return 'bg-green-100 text-green-800'
      case 'denied':       return 'bg-red-100 text-red-800'
    }
  }

  // ------------------------------------------------
  // "完了"申請の閲覧（revealedInfo表示）
  // ------------------------------------------------
  function viewCompleted(req: InheritanceRequest){
    setViewingRequest(req)
    openDialog('アカウント情報照会')
  }

  // revealedInfoを解析してテーブルで表示
  function parseRevealedInfo(info: string) {
    return info.split('\n').map(line => {
      const [label, ...rest] = line.split(':')
      return {
        label: label.trim(),
        value: rest.join(':').trim()
      }
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-gray-700 text-white p-4">
        <div className="container mx-auto flex justify-between">
          <h1 className="text-xl font-bold">相続人ポータル</h1>
          <div className="flex items-center">
            <img className="h-8 w-8 rounded-full" src="/icons/user1.png" alt="SelfIcon"/>
            <span className="ml-2">相続人(田中)</span>
          </div>
        </div>
      </header>

      {/* メイン */}
      <main className="flex-1 container mx-auto p-6">
        <div className="mb-4 flex justify-end">
          <Button onClick={()=>openDialog('相続申請')}>+ 被相続人に相続申請を送る</Button>
        </div>

        {/* 申請一覧 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>相続申請一覧</CardTitle>
            <CardDescription>現在の申請状況を確認します</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">被相続人</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">ステータス</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">更新日時</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">{req.id}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{req.targetUserName}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${statusToBadgeColor(req.status)}`}>
                        {statusToJapanese(req.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{req.updatedAt}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {req.status === 'completed' && req.revealedInfo ? (
                        <Button variant="outline" size="sm" onClick={()=>viewCompleted(req)}>
                          アカウント情報を照会
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-xs">操作なし</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>

      {/* フッター */}
      <footer className="bg-gray-700 text-white p-4">
        <div className="container mx-auto text-sm text-gray-200">
          <p>相続人向けページ。© Cloud Legacy Vault</p>
        </div>
      </footer>

      {/* ダイアログ */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (loading && !open) return
          setDialogOpen(open)
        }}
      >
        <DialogOverlay className="bg-black bg-opacity-50" />
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogType}</DialogTitle>
          </DialogHeader>

          {/* ▼▼▼ 相続申請送信ダイアログ ▼▼▼ */}
          {dialogType === '相続申請' && (
            <form
              className="space-y-4 mt-2"
              onSubmit={(e)=>{
                e.preventDefault()
                handleSendRequest()
              }}
            >
              <div className='flex flex-col gap-2'>
                <Label>被相続人を選択</Label>
                <Select
                  value={selectedTarget}
                  onValueChange={(val) => setSelectedTarget(val)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="被相続人を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetCandidates.map((cand, idx) => (
                      <SelectItem key={idx} value={cand.name}>
                        <div className="flex items-center gap-2">
                          <img
                            className="w-6 h-6 rounded-full"
                            src={cand.avatarUrl}
                            alt="userIcon"
                          />
                          <span>{cand.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                {loading ? (
                  <Button disabled variant="outline">
                    送信中...
                  </Button>
                ) : (
                  <Button type="submit" disabled={!selectedTarget}>
                    送信
                  </Button>
                )}
              </DialogFooter>
            </form>
          )}

          {/* ▼▼▼ 完了した申請を閲覧 ▼▼▼ */}
          {dialogType === 'アカウント情報照会' && viewingRequest && (
            <CompletedRequestView
              request={viewingRequest}
              onClose={() => closeDialog()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** 完了した申請の情報表示 */
function CompletedRequestView({
  request,
  onClose,
}: {
  request: InheritanceRequest
  onClose: () => void
}) {
  // revealedInfo をテーブル風にパース・表示
  const lines = request.revealedInfo
    ? request.revealedInfo.split('\n').map(line => {
        const [label, ...rest] = line.split(':')
        return {
          label: (label || '').trim(),
          value: rest.join(':').trim(),
        }
      })
    : []

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        以下のアカウント情報が開示されました:
      </p>
      {lines.length > 0 ? (
        <table className="w-full text-sm border border-gray-200">
          <tbody>
            {lines.map((item, i) => (
              <tr key={i} className="border-b last:border-none">
                <td className="px-3 py-2 font-semibold text-gray-700 bg-gray-50 w-44">
                  {item.label}
                </td>
                <td className="px-3 py-2 text-gray-800">
                  {item.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-gray-500">情報がありません。</p>
      )}
      <DialogFooter>
        <Button onClick={onClose}>閉じる</Button>
      </DialogFooter>
    </div>
  )
}
