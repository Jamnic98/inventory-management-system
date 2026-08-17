import { useState } from 'react'
import {
  Mail,
  Loader2,
  X,
  Users,
  Shield,
  PackageCheck,
  AlertTriangle,
  PackageX,
} from 'lucide-react'
import { useRecipients, useRestockPreview, useSendRestockEmail } from '../hooks/useRestockEmail'

interface SendRestockEmailModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId?: number
}

export default function SendRestockEmailModal({
  isOpen,
  onClose,
  currentUserId,
}: SendRestockEmailModalProps) {
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>(
    currentUserId ? [currentUserId] : []
  )
  const [scope, setScope] = useState<'public' | 'private' | 'both'>('public')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  // Custom Hooks
  const { data: recipients = [], isLoading: isLoadingRecipients } = useRecipients(isOpen)
  const { data: previewItems = [], isLoading: isLoadingPreview } = useRestockPreview(scope, isOpen)
  const sendEmailMutation = useSendRestockEmail()

  const handleSend = () => {
    sendEmailMutation.mutate(
      { recipientIds: selectedRecipientIds, scope },
      {
        onSuccess: (data) => {
          setFeedback({ type: 'success', message: data.message || 'Restock email sent!' })
          setTimeout(() => {
            setFeedback(null)
            onClose()
          }, 1800)
        },
        onError: (err: any) => {
          setFeedback({
            type: 'error',
            message: err.response?.data?.message || 'Failed to send restock email.',
          })
        },
      }
    )
  }

  if (!isOpen) return null

  const handleToggleRecipient = (id: number) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedRecipientIds.length === recipients.length) {
      setSelectedRecipientIds([])
    } else {
      setSelectedRecipientIds(recipients.map((r) => r.id))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Email Restock List</h3>
              <p className="text-xs text-slate-500">Send low stock checklist to team members</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Scope Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-slate-400" /> Location Scope
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['public', 'private', 'both'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setScope(option)}
                className={`py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all cursor-pointer ${
                  scope === option
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {option === 'public'
                  ? 'Public Only'
                  : option === 'private'
                    ? 'Private Only'
                    : 'Both'}
              </button>
            ))}
          </div>
        </div>

        {/* Item Preview List Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <PackageCheck className="h-3.5 w-3.5 text-slate-400" /> Items Preview
            </label>
            <span className="text-[11px] font-medium text-slate-500">
              {previewItems.length} item(s) included
            </span>
          </div>

          <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1.5">
            {isLoadingPreview ? (
              <div className="p-3 text-center text-xs text-slate-400 flex justify-center items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" /> Updating
                preview...
              </div>
            ) : previewItems.length === 0 ? (
              <p className="p-3 text-center text-xs text-slate-400">
                No low-stock items match this scope.
              </p>
            ) : (
              previewItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-100 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.isOutOfStock ? (
                      <PackageX className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="font-semibold text-slate-800 block truncate">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {item.locationName}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 font-bold text-[10px] ${
                      item.isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.isOutOfStock ? 'OUT' : `${item.currentQty}/${item.threshold}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recipient Checklist */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" /> Recipients
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              {selectedRecipientIds.length === recipients.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1">
            {isLoadingRecipients ? (
              <div className="p-3 text-center text-xs text-slate-400 flex justify-center items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" /> Loading
                recipients...
              </div>
            ) : recipients.length === 0 ? (
              <p className="p-3 text-center text-xs text-slate-400">No recipients found.</p>
            ) : (
              recipients.map((user) => {
                const isSelected = selectedRecipientIds.includes(user.id)
                const isSelf = user.id === currentUserId

                return (
                  <label
                    key={user.id}
                    onClick={() => handleToggleRecipient(user.id)}
                    className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-50/60 text-slate-900'
                        : 'border-transparent hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium truncate">{user.name || user.email}</span>
                      {isSelf && (
                        <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.2 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={
              selectedRecipientIds.length === 0 ||
              previewItems.length === 0 ||
              sendEmailMutation.isPending
            }
            onClick={handleSend}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            {sendEmailMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...
              </>
            ) : (
              <>
                <Mail className="h-3.5 w-3.5" /> Send Restock Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
