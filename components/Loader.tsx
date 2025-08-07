import React, { FunctionComponent } from 'react'

const LoadingComponent: FunctionComponent = () => {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-16 h-16 border-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
    </div>
  )
}

export default LoadingComponent;
