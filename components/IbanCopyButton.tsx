'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function IbanCopyButton({ iban }: { iban: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(iban.replace(/\s/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <p className="font-mono text-lg flex-1">{iban}</p>
      <button
        onClick={copyToClipboard}
        className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        title="Copier l'IBAN"
      >
        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
      </button>
      {copied && (
        <p className="text-xs text-green-600 dark:text-green-400 absolute -bottom-5 left-0">
          IBAN copié !
        </p>
      )}
    </div>
  )
}
