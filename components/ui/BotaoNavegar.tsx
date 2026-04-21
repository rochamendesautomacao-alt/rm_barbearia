'use client'

import { useRouter } from 'next/navigation'

interface Props {
  href: string
  children: React.ReactNode
  className?: string
}

export default function BotaoNavegar({ href, children, className }: Props) {
  const router = useRouter()

  function handleClick() {
    router.push(href)
    router.refresh()
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
