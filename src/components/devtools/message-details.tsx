import React from 'react'
import { Message, MessageDirection, MessageType } from './types'
import CodeMirror from '@uiw/react-codemirror'
import { atomone } from '@uiw/codemirror-theme-atomone'
import { json } from '@codemirror/lang-json'

interface MessageDetailsProps {
  message: Message | null
}

export const MessageDetails: React.FC<MessageDetailsProps> = ({ message }) => {
  // Determine message direction
  const directionText =
    message?.direction === MessageDirection.Inbound ? 'Received' : 'Sent'

  // Calculate message time
  const messageTime = message
    ? new Date(message.timestamp).toLocaleString()
    : ''

  // Try to parse and format the data
  let formattedData = message?.data || ''
  let parsedData: any = null
  let isJson = false
  let headers: Record<string, string> = {}
  let url: string = ''
  let method: string = ''
  let status: number | string = ''
  let statusText: string = ''

  try {
    if (!message) {
      // No message available
    }
    // First check if we have pre-parsed data
    else if (message.parsedData) {
      parsedData = JSON.parse(message.parsedData)
      isJson = true

      // Extract HTTP-specific data
      if (message.type === MessageType.Http) {
        if (message.direction === MessageDirection.Inbound) {
          // Try to extract response data
          if (parsedData.headers) {
            headers = parsedData.headers
          } else if (parsedData.responseInfo?.headers) {
            headers = parsedData.responseInfo.headers
          }

          url = parsedData.url || parsedData.responseInfo?.url || ''
          status = parsedData.status || parsedData.responseInfo?.status || ''
          statusText =
            parsedData.statusText || parsedData.responseInfo?.statusText || ''
        } else {
          // Try to extract request data
          if (parsedData.headers) {
            headers = parsedData.headers
          } else if (parsedData.requestInfo?.headers) {
            headers = parsedData.requestInfo.headers
          }

          url = parsedData.url || parsedData.requestInfo?.url || ''
          method = parsedData.method || parsedData.requestInfo?.method || ''
        }
      }
    } else {
      // Otherwise try to parse the raw data
      parsedData = JSON.parse(message.data)
      isJson = true
    }

    // Format the JSON for display
    if (parsedData) {
      formattedData = JSON.stringify(parsedData, null, 2)
    }
  } catch (e) {
    // Not valid JSON, keep original
  }

  return (
    <div className="h-full">
      <div className="mb-4">
        {message && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-200">
                Direction:
              </span>
              <span className="text-sm text-gray-300">{directionText}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-200">Size:</span>
              <span className="text-sm text-gray-300">
                {message.size} bytes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-200">Time:</span>
              <span className="text-sm text-gray-300">{messageTime}</span>
            </div>

            {/* HTTP-specific information */}
            {message.type === MessageType.Http && (
              <>
                {url && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-200">
                      URL:
                    </span>
                    <span className="text-sm text-gray-300 max-w-[70%] truncate text-right">
                      {url}
                    </span>
                  </div>
                )}

                {method && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-200">
                      Method:
                    </span>
                    <span className="text-sm text-gray-300">{method}</span>
                  </div>
                )}

                {status && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-200">
                      Status:
                    </span>
                    <span className="text-sm text-gray-300">
                      {status} {statusText}
                    </span>
                  </div>
                )}

                {Object.keys(headers).length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-200 mb-1">
                      Headers:
                    </div>
                    <div className="text-xs bg-slate-800 p-2 rounded-md overflow-auto max-h-24">
                      {Object.entries(headers).map(([key, value]) => (
                        <div key={key} className="flex items-start mb-1">
                          <span className="font-medium text-blue-400 min-w-[120px] mr-2">
                            {key}:
                          </span>
                          <span className="text-gray-300 break-all">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <div className="h-[calc(100%-6rem)] overflow-auto">
        {(() => {
          return formattedData ? (
            <CodeMirror
              value={formattedData}
              height="100%"
              theme={atomone}
              extensions={isJson ? [json()] : []}
              readOnly={true}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                indentOnInput: true,
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">
                No content to display
              </p>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
