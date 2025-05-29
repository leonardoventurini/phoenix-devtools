import React, { useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { FixedSizeList } from 'react-window'
import { Message, MessageDirection } from './types'
import { EmptyState } from './empty-state'
import { useDevToolsStore } from '../../hooks/use-devtools-store'
import { useWindowSize } from './hooks'
import { Drawer } from '../ui/drawer'
import { MessageRow } from './message-row'
import { MessageDetails } from './message-details'

const _FixedSizeList = FixedSizeList as any

export const MessageList: React.FC = observer(() => {
  const store = useDevToolsStore()
  const messages = store.reversedMessages
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { height } = useWindowSize({ width: 0, height: 64 })

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedMessage(null)
  }

  if (messages.length === 0) {
    return <EmptyState />
  }

  const Row = observer(
    ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <div style={style}>
        <MessageRow
          message={messages[index]}
          isNew={store.newMessages.includes(messages[index].hash)}
          onMessageClick={handleMessageClick}
        />
      </div>
    )
  )

  return (
    <div ref={containerRef} className="overflow-auto h-full">
      <_FixedSizeList
        height={height}
        width="100%"
        itemCount={messages.length}
        itemSize={28}
        overscanCount={5}
      >
        {Row}
      </_FixedSizeList>

      <Drawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        title={
          selectedMessage
            ? `${
                selectedMessage.direction === MessageDirection.Inbound
                  ? 'Received'
                  : 'Sent'
              } ${selectedMessage.type.toUpperCase()} ${
                selectedMessage.isPhoenix ? '(Phoenix)' : ''
              }`
            : 'Message Details'
        }
      >
        <MessageDetails message={selectedMessage} />
      </Drawer>
    </div>
  )
})
