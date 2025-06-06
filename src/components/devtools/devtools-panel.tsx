import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { useWindowSize } from './hooks'
import { useDevToolsStore } from '../../hooks/use-devtools-store'
import {
  IconRefresh,
  IconTrash,
  IconSearch,
  IconArrowDown,
  IconArrowUp,
  IconArrowsUpDown,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react'
import { NavButton } from '../ui/nav-button'
import { MessageList } from './message-list'
import { DirectionFilterType } from '../../stores/devtools-store'

import '../../styles/index.scss'

export const DevToolsPanel = observer(() => {
  const store = useDevToolsStore()
  const windowSize = useWindowSize({ width: 0, height: 64 })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Connect to background script and set up message listeners
    const cleanup = store.connectToDevTools()

    // Cleanup function
    return cleanup
  }, [store])

  const handleClear = () => {
    store.clearMessages()
  }

  const handleReload = () => {
    location.reload()
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    store.setSearchTerm(value)
  }

  const handleTogglePhoenixFilter = () => {
    store.togglePhoenixFilter()
  }

  const handleSetDirectionFilter = (filter: DirectionFilterType) => {
    store.setDirectionFilter(filter)
  }

  const handleToggleHighlighting = () => {
    store.toggleHighlighting()
  }

  return (
    <div className="bg-slate-700 h-screen p-0 flex flex-col overflow-hidden">
      <div className="flex w-full justify-end h-8">
        <NavButton variant="info" onClick={handleReload} square>
          <IconRefresh className="size-4 mr-1" />
          Reload
        </NavButton>
      </div>

      <div className="flex-grow overflow-auto">
        <MessageList />
      </div>

      <div className="flex w-full justify-between items-center h-8">
        <div className="flex items-center">
          <div className="relative flex items-center">
            <IconSearch className="absolute left-2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8 pr-2 py-1 h-8 bg-slate-800 text-white hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <Separator />

          <div className="flex gap-px">
            <NavButton
              variant={
                store.directionFilter === 'all' ? 'success' : 'secondary'
              }
              onClick={() => handleSetDirectionFilter('all')}
              square
            >
              <IconArrowsUpDown className="size-4" />
            </NavButton>
            <NavButton
              variant={
                store.directionFilter === 'inbound' ? 'success' : 'secondary'
              }
              onClick={() => handleSetDirectionFilter('inbound')}
              square
            >
              <IconArrowDown className="size-4" />
            </NavButton>
            <NavButton
              variant={
                store.directionFilter === 'outbound' ? 'success' : 'secondary'
              }
              onClick={() => handleSetDirectionFilter('outbound')}
              square
            >
              <IconArrowUp className="size-4" />
            </NavButton>
          </div>

          <Separator />

          <NavButton
            variant={store.highlightingEnabled ? 'success' : 'secondary'}
            onClick={handleToggleHighlighting}
            square
            title={
              store.highlightingEnabled
                ? 'Disable element highlighting'
                : 'Enable element highlighting'
            }
          >
            {store.highlightingEnabled ? (
              <IconEye className="size-4" />
            ) : (
              <IconEyeOff className="size-4" />
            )}
          </NavButton>
        </div>

        <NavButton variant="danger" onClick={handleClear} square>
          <IconTrash className="size-4 mr-1" />
          Clear
        </NavButton>
      </div>
    </div>
  )
})

function Separator() {
  return <div className="w-px h-full bg-slate-600" />
}
