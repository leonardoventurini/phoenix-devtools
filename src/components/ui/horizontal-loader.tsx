import React from 'react'

export function HorizontalLoader() {
  return (
    <div className="w-full p-4">
      <div className="horizontal-loader" role="loader">
        <div className="horizontal-loader__pill" />
      </div>
    </div>
  )
}
