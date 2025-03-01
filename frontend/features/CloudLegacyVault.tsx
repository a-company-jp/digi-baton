'use client'
import React, { useState, FormEvent, useEffect } from 'react'
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

// ==============================
// データ型
// ==============================
type DigitalAsset = {
  id: number
  type: 'account' | 'device'
  name: string
  accountType?: 'essential' | 'social' | 'shopping' | 'financial' | 'other'
  deviceType?: string
  deviceInfo?: string
  status?: string      // ← 今回はデータとしては保持していても表示しない
  lastUpdate?: string
  inheritTo: number | null
}

type HeirData = {
  id: number
  name: string
  email: string
  status: string
  avatarUrl?: string
}

// 生存確認方法の型
type LivingCheck = {
  email: boolean
  phoneCall: boolean
  phoneNumber: string
  gracePeriodDays: number
}

export default function CloudLegacyVault() {

  // ==============================
  // ① データ管理
  // ==============================
  const [assets, setAssets] = useState<DigitalAsset[]>([
    {
      id: 1,
      type: 'account',
      name: 'Google アカウント',
      accountType: 'essential',
      status: '保護済み',
      lastUpdate: '2025/02/15',
      inheritTo: 2
    },
    {
      id: 2,
      type: 'account',
      name: 'Twitter',
      accountType: 'social',
      status: '保護済み',
      lastUpdate: '2025/01/15',
      inheritTo: 3
    },
    {
      id: 3,
      type: 'device',
      name: 'MacBook Pro',
      deviceType: 'Apple Laptop',
      deviceInfo: 'Ventura 13.x',
      status: '要メンテナンス',
      inheritTo: 2
    }
  ])

  const [heirData, setHeirData] = useState<HeirData[]>([
    {
      id: 1,
      name: '母親',
      email: 'mother@example.com',
      status: '承認済み',
      avatarUrl: '/icons/user2.png'
    },
    {
      id: 2,
      name: '弟',
      email: 'brother@example.com',
      status: '承認待ち',
      avatarUrl: '/icons/user3.png'
    },
    {
      id: 3,
      name: '友人(田中)',
      email: 'friend@example.com',
      status: '承認待ち',
      avatarUrl: '/icons/user4.png'
    }
  ])

  // "現在の" 生存確認方法
  const [livingCheckMethods, setLivingCheckMethods] = useState<LivingCheck>({
    email: true,
    phoneCall: false,
    phoneNumber: '',
    gracePeriodDays: 7
  })

  // "フォーム（下書き）"用
  const [draftLivingCheck, setDraftLivingCheck] = useState<LivingCheck>({
    email: true,
    phoneCall: false,
    phoneNumber: '',
    gracePeriodDays: 7
  })

  // ==============================
  // ② UI状態
  // ==============================
  const [activeTab, setActiveTab] = useState<"dashboard"|"accounts"|"devices"|"heirs"|"livingCheck">("dashboard")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState("")
  const [loading, setLoading] = useState(false)

  // アカウント/デバイス追加フォーム
  const [newAsset, setNewAsset] = useState<{
    kind: 'account' | 'device'
    name: string
    accountType: 'essential' | 'social' | 'shopping' | 'financial' | 'other'
    deviceType: string
    deviceInfo: string
    inheritTo: number | null
  }>({
    kind: 'account',
    name: '',
    accountType: 'essential',
    deviceType: '',
    deviceInfo: '',
    inheritTo: null
  })

  // 相続人追加/編集用
  const [newHeir, setNewHeir] = useState({
    name: '',
    email: '',
    status: '承認待ち',
    avatarUrl: '/icons/user1.png'
  })
  const [editingHeirId, setEditingHeirId] = useState<number | null>(null)

  // ==============================
  // ③ ヘルパー
  // ==============================
  const findHeirName = (id: number | null) => {
    if (!id) return '未設定'
    const h = heirData.find(x => x.id === id)
    return h ? h.name : '未設定'
  }

  const openDialog = (type: string) => {
    setDialogType(type)
    setDialogOpen(true)
  }
  const closeDialog = () => {
    if(loading) return
    setDialogType('')
    setEditingHeirId(null)
    setDialogOpen(false)
  }

  // ==============================
  // ④ アカウント/デバイスの作成
  // ==============================
  const handleAddAsset = () => {
    setLoading(true)
    setTimeout(() => {
      const newId = Math.max(0, ...assets.map(a=>a.id)) +1
      if(newAsset.kind==='account'){
        // アカウント
        const acc: DigitalAsset = {
          id: newId,
          type: 'account',
          name: newAsset.name || '新規アカウント',
          accountType: newAsset.accountType,
          // 状態(status)はデータ上は持っていても今回表示しない
          status: '保護済み',
          inheritTo: newAsset.inheritTo
        }
        setAssets([...assets, acc])
      } else {
        // デバイス
        const dev: DigitalAsset = {
          id: newId,
          type: 'device',
          name: newAsset.name || '新規デバイス',
          deviceType: newAsset.deviceType || 'PC',
          deviceInfo: newAsset.deviceInfo || '',
          // 状態(status)はデータ上は持っていても今回表示しない
          status: 'アクティブ',
          inheritTo: newAsset.inheritTo
        }
        setAssets([...assets, dev])
      }

      // フォームリセット
      setNewAsset({
        kind:'account',
        name:'',
        accountType:'essential',
        deviceType:'',
        deviceInfo:'',
        inheritTo:null
      })
      setLoading(false)
      closeDialog()
    },1000)
  }

  // ==============================
  // ⑤ 相続人追加 / 編集
  // ==============================
  const handleAddHeir = () => {
    setLoading(true)
    setTimeout(()=>{
      const newId = Math.max(0, ...heirData.map(h=>h.id)) +1
      const newObj: HeirData = {
        id:newId,
        name: newHeir.name||'新規相続人',
        email: newHeir.email||'example@example.com',
        status: newHeir.status,
        avatarUrl: newHeir.avatarUrl
      }
      setHeirData([...heirData, newObj])
      setNewHeir({ name:'', email:'', status:'承認待ち', avatarUrl:'/icons/user1.png' })
      setLoading(false)
      closeDialog()
    },1000)
  }

  const handleEditHeir = () => {
    if(editingHeirId==null)return
    setLoading(true)
    setTimeout(()=>{
      setHeirData(prev => prev.map(h=>{
        if(h.id === editingHeirId){
          return {
            ...h,
            name: newHeir.name||'無名',
            email: newHeir.email||'example@example.com',
            status: newHeir.status,
            avatarUrl: newHeir.avatarUrl
          }
        }
        return h
      }))
      setEditingHeirId(null)
      setNewHeir({ name:'', email:'', status:'承認待ち', avatarUrl:'/icons/user1.png' })
      setLoading(false)
      closeDialog()
    },1000)
  }

  // ==============================
  // ⑥ 生存確認: 下書き→確定
  // ==============================
  useEffect(() => {
    setDraftLivingCheck(livingCheckMethods)
  }, [livingCheckMethods])

  // 下4桁だけ表示
  const maskPhoneNumber = (num: string) => {
    if(!num) return '未設定'
    const digits = num.replace(/\D/g, '')
    if(digits.length < 4) return '未設定'
    const last4 = digits.slice(-4)
    return `****-${last4}`
  }

  // draft更新
  const handleDraftUpdate = (upd:Partial<LivingCheck>) => {
    setDraftLivingCheck(prev => ({
      ...prev,
      ...upd
    }))
  }

  // 保存
  const handleLivingCheckSubmit = (e:FormEvent) => {
    e.preventDefault()
    setLivingCheckMethods(draftLivingCheck)
    // リセット
    setDraftLivingCheck({
      email: true,
      phoneCall: false,
      phoneNumber: '',
      gracePeriodDays: 7
    })
    alert("生存確認の設定を更新しました。（デモ）")
  }

  // ==============================
  // ⑦ JSX
  // ==============================
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Digi Baton</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full absolute top-0 right-0"/>
              <button className="p-2" title="通知">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032
                           2.032 0 0118 14.158V11a6.002
                           6.002 0 00-4-5.659V5a2
                           2 0 10-4 0v.341C7.67
                           6.165 6 8.388 6 11v3.159c0
                           .538-.214 1.055-.595
                           1.436L4 17h5m6 0v1a3
                           3 0 11-6 0v-1m6 0H9"/>
                </svg>
              </button>
            </div>
            <div className="flex items-center">
              <img className="h-8 w-8 rounded-full" src="/icons/user1.png" alt="SelfIcon"/>
              <span className="ml-2">被相続人(マイケル)</span>
            </div>
          </div>
        </div>
      </header>

      {/* main */}
      <main className="flex-1 container mx-auto p-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4 mt-2">
          <nav className="flex flex-wrap space-x-4">
            <button
              className={`py-4 px-2 font-medium ${
                activeTab === 'dashboard'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={()=>setActiveTab('dashboard')}
            >
              ダッシュボード
            </button>
            <button
              className={`py-4 px-2 font-medium ${
                activeTab === 'accounts'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={()=>setActiveTab('accounts')}
            >
              アカウント管理
            </button>
            <button
              className={`py-4 px-2 font-medium ${
                activeTab === 'devices'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={()=>setActiveTab('devices')}
            >
              デバイス管理
            </button>
            <button
              className={`py-4 px-2 font-medium ${
                activeTab === 'heirs'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={()=>setActiveTab('heirs')}
            >
              相続人
            </button>
            <button
              className={`py-4 px-2 font-medium ${
                activeTab === 'livingCheck'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={()=>setActiveTab('livingCheck')}
            >
              生存確認方法の設定
            </button>
          </nav>
        </div>

        {/* 各タブコンテンツ */}
        {activeTab === 'dashboard' && (
          <DashboardSection assets={assets} heirData={heirData}/>
        )}
        {activeTab === 'accounts' && (
          <AccountsSection
            assets={assets}
            openDialog={openDialog}
            findHeirName={findHeirName}
          />
        )}
        {activeTab === 'devices' && (
          <DevicesSection
            assets={assets}
            openDialog={openDialog}
            findHeirName={findHeirName}
          />
        )}
        {activeTab === 'heirs' && (
          <HeirsSection
            heirData={heirData}
            openDialog={openDialog}
            newHeir={newHeir}
            setNewHeir={setNewHeir}
            loading={loading}
            handleAddHeir={handleAddHeir}
            onEditHeir={(heir)=>{
              setEditingHeirId(heir.id)
              setNewHeir({
                name: heir.name,
                email: heir.email,
                status: heir.status,
                avatarUrl: heir.avatarUrl || '/icons/user1.png'
              })
              openDialog('相続人の編集')
            }}
          />
        )}
        {activeTab === 'livingCheck' && (
          <LivingCheckSection
            current={livingCheckMethods}
            draft={draftLivingCheck}
            onDraftUpdate={handleDraftUpdate}
            onSubmit={handleLivingCheckSubmit}
            maskPhoneNumber={maskPhoneNumber}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-6">
        <div className="container mx-auto">
          {/* ... (Footer内容) */}
        </div>
      </footer>

      {/* Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open)=>{
          if(loading && !open) return
          setDialogOpen(open)
        }}
      >
        <DialogOverlay className="bg-transparent" />
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogType}</DialogTitle>
          </DialogHeader>

          {dialogType === '新規登録' && (
            <AssetAddForm
              loading={loading}
              closeDialog={closeDialog}
              newAsset={newAsset}
              setNewAsset={setNewAsset}
              handleAddAsset={handleAddAsset}
              heirData={heirData}
            />
          )}

          {dialogType === '相続人の追加' && (
            <HeirAddForm
              loading={loading}
              closeDialog={closeDialog}
              newHeir={newHeir}
              setNewHeir={setNewHeir}
              handleAddHeir={handleAddHeir}
            />
          )}

          {dialogType === '相続人の編集' && editingHeirId !== null && (
            <HeirEditForm
              loading={loading}
              closeDialog={closeDialog}
              newHeir={newHeir}
              setNewHeir={setNewHeir}
              handleEditHeir={handleEditHeir}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ================================
   サブコンポーネント
=============================== */

/** ダッシュボード */
function DashboardSection({
  assets,
  heirData
}:{
  assets:DigitalAsset[],
  heirData:HeirData[]
}) {
  // "〇〇が何のアカウントの相続人になりました" という通知を生成
  const notifications = assets
    .map(a => {
      if(!a.inheritTo) return null
      const h = heirData.find(x=> x.id===a.inheritTo)
      if(!h) return null
      return `${h.name}が「${a.name}」の相続人になりました。`
    })
    .filter((msg): msg is string => msg !== null)

  return (
    <div className="space-y-6">
      {/* 通知カード */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>通知</CardTitle>
          <CardDescription>相続に関する最新情報</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((msg, idx) => (
              <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-sm text-blue-900">
                {msg}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">現在、相続に関する新しい通知はありません。</p>
          )}
        </CardContent>
      </Card>

      {/* アセット状況など */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>ダッシュボード</CardTitle>
          <CardDescription>概況</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            登録されているアカウント/デバイスの総数: {assets.length}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/** アカウント管理 - 状態は非表示にする  */
function AccountsSection({
  assets,
  openDialog,
  findHeirName
}:{
  assets: DigitalAsset[]
  openDialog:(type:string)=>void
  findHeirName:(id:number|null)=>string
}){
  // type==='account' のものだけ表示
  const accountList = assets.filter(a => a.type==='account')

  return (
    <Card className="shadow-md">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">アカウント管理</h2>
        <Button onClick={()=>openDialog('新規登録')}>+ 新規登録</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-gray-500 font-medium uppercase">名称</th>
              <th className="px-6 py-3 text-left text-gray-500 font-medium uppercase">種別</th>
              {/* ▼ 状態は表示しないので削除 ▼ */}
              <th className="px-6 py-3 text-left text-gray-500 font-medium uppercase">相続先</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accountList.map(acc => (
              <tr key={acc.id} className="hover:bg-gray-50">
                {/* 名称 */}
                <td className="px-6 py-4 whitespace-nowrap">{acc.name}</td>
                {/* 種別 (accountType) */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={
                    `px-2 inline-flex text-xs font-semibold leading-5 rounded-full ` +
                    (acc.accountType==='essential'
                      ? 'bg-purple-100 text-purple-800'
                      : acc.accountType==='shopping'
                      ? 'bg-gray-100 text-gray-800'
                      : acc.accountType==='social'
                      ? 'bg-blue-100 text-blue-800'
                      : acc.accountType==='financial'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800')
                  }>
                    {acc.accountType==='essential'
                      ? '重要(基本)'
                      : acc.accountType==='shopping'
                      ? 'ショッピング'
                      : acc.accountType==='social'
                      ? 'SNS'
                      : acc.accountType==='financial'
                      ? '金融'
                      : 'その他'}
                  </span>
                </td>
                {/* ▼ 相続先 */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {findHeirName(acc.inheritTo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/** デバイス管理 - 状態は非表示にする  */
function DevicesSection({
  assets,
  openDialog,
  findHeirName
}:{
  assets: DigitalAsset[]
  openDialog:(type:string)=>void
  findHeirName:(id:number|null)=>string
}){
  // type==='device' のものだけ表示
  const deviceList = assets.filter(a => a.type==='device')

  return (
    <Card className="shadow-md">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">デバイス管理</h2>
        <Button onClick={()=>openDialog('新規登録')}>+ 新規登録</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-gray-500 font-medium uppercase">名称</th>
              <th className="px-6 py-3 text-left text-gray-500 font-medium uppercase">デバイスタイプ</th>
              {/* ▼ 状態は表示しないので削除 ▼ */}
              <th className="px-6 py-3 text-left text-gray-500 font-medium uppercase">相続先</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deviceList.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                {/* 名称 */}
                <td className="px-6 py-4 whitespace-nowrap">{d.name}</td>
                {/* デバイスタイプ */}
                <td className="px-6 py-4 whitespace-nowrap">{d.deviceType || 'PC/その他'}</td>
                {/* ▼ 相続先 */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {findHeirName(d.inheritTo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/** 相続人タブ */
function HeirsSection({
  heirData,
  openDialog,
  newHeir,
  setNewHeir,
  loading,
  handleAddHeir,
  onEditHeir
}:{
  heirData: HeirData[]
  openDialog:(type:string)=>void
  newHeir: { name:string, email:string, status:string, avatarUrl?:string }
  setNewHeir: React.Dispatch<React.SetStateAction<{name:string, email:string, status:string, avatarUrl?:string}>>
  loading:boolean
  handleAddHeir:()=>void
  onEditHeir:(heir:HeirData)=>void
}){
  return (
    <Card className="shadow-md">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">相続人設定</h2>
        <Button onClick={()=>openDialog('相続人の追加')}>+ 相続人を追加</Button>
      </div>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          登録された相続人は、承認済みであればあなたのアカウント・デバイスにアクセス可能となります。
        </p>
        <div className="space-y-4">
          {heirData.map(h => (
            <div key={h.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img className="w-10 h-10 rounded-full" src={h.avatarUrl || '/icons/user1.png'} alt="heirIcon"/>
                <div>
                  <p className="font-medium">{h.name}</p>
                  <p className="text-sm text-gray-500">{h.email}</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5
                                    rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {h.status}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="link" onClick={()=>onEditHeir(h)}>
                設定を編集
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/** 生存確認設定 */
function LivingCheckSection({
  current,
  draft,
  onDraftUpdate,
  onSubmit,
  maskPhoneNumber
}:{
  current:{
    email:boolean
    phoneCall:boolean
    phoneNumber:string
    gracePeriodDays:number
  },
  draft:{
    email:boolean
    phoneCall:boolean
    phoneNumber:string
    gracePeriodDays:number
  },
  onDraftUpdate:(updates:Partial<typeof draft>)=>void
  onSubmit:(e:FormEvent)=>void
  maskPhoneNumber:(num:string)=>string
}){
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>生存確認方法の設定</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          相続申請時にどうやって生存確認を行うか、反応を待つ期間を設定します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 現在の設定カード */}
        <div className="mb-6 border rounded-lg p-4 shadow-sm flex items-center bg-green-50 border-r-4 border-green-400">
          <div className="text-sm text-gray-700 space-y-2 w-full">
            <p className="font-semibold text-base mb-1">現在の設定</p>
            <ul className="list-disc list-inside ml-2">
              <li>
                メール確認:{" "}
                <span className={`font-bold ${current.email ? 'text-green-700' : 'text-red-600'}`}>
                  {current.email ? '有効' : '無効'}
                </span>
              </li>
              <li>
                電話確認:{" "}
                <span className={`font-bold ${current.phoneCall ? 'text-green-700' : 'text-red-600'}`}>
                  {current.phoneCall
                    ? `有効 (番号: ${maskPhoneNumber(current.phoneNumber)})`
                    : '無効'}
                </span>
              </li>
              <li>
                猶予日数:{" "}
                <span className="font-bold">
                  {current.gracePeriodDays} 日
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 更新フォーム */}
        <form onSubmit={onSubmit} className="space-y-4 border rounded-lg p-4 shadow-sm">
          <p className="font-semibold text-base mb-2">設定を更新</p>
          <div className="flex items-center">
            <input
              id="chkEmail"
              type="checkbox"
              checked={draft.email}
              onChange={(e)=>onDraftUpdate({email: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="chkEmail" className="text-sm">メールで生存確認</label>
          </div>
          <div className="flex items-center">
            <input
              id="chkPhone"
              type="checkbox"
              checked={draft.phoneCall}
              onChange={(e)=>onDraftUpdate({phoneCall: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="chkPhone" className="text-sm">電話で生存確認</label>
          </div>
          {draft.phoneCall && (
            <div className="ml-6 mt-2 flex flex-col gap-2">
              <Label>電話番号</Label>
              <Input
                placeholder="090-xxxx-xxxx"
                value={draft.phoneNumber}
                onChange={(e)=>onDraftUpdate({phoneNumber: e.target.value})}
              />
            </div>
          )}
          <div className="mt-4 flex flex-col gap-2">
            <Label>反応を待つ猶予日数</Label>
            <Input
              type="number"
              className="max-w-[100px]"
              value={draft.gracePeriodDays}
              onChange={(e)=>onDraftUpdate({gracePeriodDays:Number(e.target.value)})}
            />
            <p className="text-xs text-gray-500">
              この日数内に応答がない場合、死亡と判定します。
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit">
              設定を保存
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/** アカウント/デバイス追加フォーム */
function AssetAddForm({
  loading,
  closeDialog,
  newAsset,
  setNewAsset,
  handleAddAsset,
  heirData
}:{
  loading:boolean
  closeDialog:()=>void
  newAsset:{
    kind:'account'|'device'
    name:string
    accountType:'essential'|'social'|'shopping'|'financial'|'other'
    deviceType:string
    deviceInfo:string
    inheritTo:number|null
  }
  setNewAsset:React.Dispatch<React.SetStateAction<{
    kind:'account'|'device'
    name:string
    accountType:'essential'|'social'|'shopping'|'financial'|'other'
    deviceType:string
    deviceInfo:string
    inheritTo:number|null
  }>>
  handleAddAsset:()=>void
  heirData:HeirData[]
}){
  return (
    <form
      className="space-y-4 mt-2"
      onSubmit={(e)=>{
        e.preventDefault()
        handleAddAsset()
      }}
    >
      {/* ▼ Label + Select */}
      <div className="flex flex-col gap-2">
        <Label>種別</Label>
        <Select
          value={newAsset.kind}
          onValueChange={(val)=>setNewAsset({ ...newAsset, kind: val as 'account'|'device' })}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="アカウント or デバイス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="account">アカウント</SelectItem>
            <SelectItem value="device">デバイス</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ▼ Label + Input */}
      <div className="flex flex-col gap-2">
        <Label>名称</Label>
        <Input
          placeholder="例: Google アカウント / 自宅用PC"
          value={newAsset.name}
          onChange={(e)=>setNewAsset({...newAsset, name:e.target.value})}
          disabled={loading}
        />
      </div>

      {/* ▼ アカウントの場合 */}
      {newAsset.kind === 'account' && (
        <div className="flex flex-col gap-2">
          <Label>アカウント種類</Label>
          <Select
            value={newAsset.accountType}
            onValueChange={(val)=>setNewAsset({...newAsset, accountType: val as typeof newAsset.accountType})}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="種類を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="essential">重要(基本)</SelectItem>
              <SelectItem value="shopping">ショッピング</SelectItem>
              <SelectItem value="social">SNS</SelectItem>
              <SelectItem value="financial">金融</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ▼ デバイスの場合 */}
      {newAsset.kind === 'device' && (
        <>
          <div className="flex flex-col gap-2">
            <Label>デバイスタイプ</Label>
            <Input
              placeholder="例: MacBook / Windows PCなど"
              value={newAsset.deviceType}
              onChange={(e)=>setNewAsset({...newAsset, deviceType:e.target.value})}
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>デバイス情報</Label>
            <Input
              placeholder="シリアル番号 / OSバージョン等"
              value={newAsset.deviceInfo}
              onChange={(e)=>setNewAsset({...newAsset, deviceInfo:e.target.value})}
              disabled={loading}
            />
          </div>
        </>
      )}

      {/* ▼ 相続先 */}
      <div className="flex flex-col gap-2">
        <Label>相続先（誰に？）</Label>
        <Select
          value={newAsset.inheritTo ? String(newAsset.inheritTo) : "0"}
          onValueChange={(val)=>{
            const num = Number(val)
            setNewAsset({...newAsset, inheritTo: num===0 ? null : num})
          }}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="相続人を選択 (任意)" />
          </SelectTrigger>
          <SelectContent>
            {heirData.map(h=>(
              <SelectItem key={h.id} value={String(h.id)}>
                <div className="flex items-center gap-2">
                  <img
                    className="w-6 h-6 rounded-full"
                    src={h.avatarUrl || '/icons/user1.png'}
                    alt="avatar"
                  />
                  <span>{h.name}</span>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="0">
              <div className="flex items-center gap-2">
                <img className="w-6 h-6 rounded-full" src="/icons/user5.png" alt="none"/>
                <span>なし</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        {loading ? (
          <Button disabled variant="outline">
            保存中...
          </Button>
        ) : (
          <Button type="submit">
            保存
          </Button>
        )}
      </DialogFooter>
    </form>
  )
}

/** 新規相続人追加フォーム */
function HeirAddForm({
  loading,
  closeDialog,
  newHeir,
  setNewHeir,
  handleAddHeir
}:{
  loading:boolean
  closeDialog:()=>void
  newHeir:{ name:string, email:string, status:string, avatarUrl?:string }
  setNewHeir:React.Dispatch<React.SetStateAction<{name:string, email:string, status:string, avatarUrl?:string}>>
  handleAddHeir:()=>void
}){
  return (
    <form
      className="space-y-4 mt-2"
      onSubmit={(e)=>{
        e.preventDefault()
        handleAddHeir()
      }}
    >
      <div className="flex flex-col gap-2">
        <Label>相続人の名前</Label>
        <Input
          placeholder="山田 花子"
          value={newHeir.name}
          onChange={(e)=>setNewHeir({...newHeir, name:e.target.value})}
          disabled={loading}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>メールアドレス</Label>
        <Input
          type="email"
          placeholder="example@example.com"
          value={newHeir.email}
          onChange={(e)=>setNewHeir({...newHeir, email:e.target.value})}
          disabled={loading}
        />
      </div>
      <DialogFooter>
        {loading ? (
          <Button disabled variant="outline">
            保存中...
          </Button>
        ) : (
          <Button type="submit">
            保存
          </Button>
        )}
      </DialogFooter>
    </form>
  )
}

/** 相続人編集フォーム */
function HeirEditForm({
  loading,
  closeDialog,
  newHeir,
  setNewHeir,
  handleEditHeir
}:{
  loading:boolean
  closeDialog:()=>void
  newHeir:{ name:string, email:string, status:string, avatarUrl?:string }
  setNewHeir:React.Dispatch<React.SetStateAction<{name:string, email:string, status:string, avatarUrl?:string}>>
  handleEditHeir:()=>void
}){
  return (
    <form
      className="space-y-4 mt-2"
      onSubmit={(e)=>{
        e.preventDefault()
        handleEditHeir()
      }}
    >
      <div className="flex flex-col gap-2">
        <Label>相続人の名前</Label>
        <Input
          placeholder="山田 花子"
          value={newHeir.name}
          onChange={(e)=>setNewHeir({...newHeir, name:e.target.value})}
          disabled={loading}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>メールアドレス</Label>
        <Input
          type="email"
          placeholder="example@example.com"
          value={newHeir.email}
          onChange={(e)=>setNewHeir({...newHeir, email:e.target.value})}
          disabled={loading}
        />
      </div>
      <DialogFooter>
        {loading ? (
          <Button disabled variant="outline">
            保存中...
          </Button>
        ) : (
          <Button type="submit">
            保存
          </Button>
        )}
      </DialogFooter>
    </form>
  )
}
