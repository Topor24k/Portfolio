import { useState, useRef, useEffect, useCallback } from 'react'
import './lazy-image.css'

export default function LazyImage({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  aspectRatio,
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  style = {},
  imgStyle = {},
  onLoad,
  onError,
  ...props
}) {
  const [loaded, setLoaded] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const imgRef = useRef(null)

  const handleLoaded = useCallback(() => {
    setLoaded(true)
    onLoad?.()
  }, [onLoad])

  // Check if image is already cached upon mount or src change
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true)
      setShowSkeleton(false)
    }
  }, [src])

  // Clean up skeleton element after fade transition completes to free CPU
  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        setShowSkeleton(false)
      }, 450)
      return () => clearTimeout(timer)
    } else {
      setShowSkeleton(true)
    }
  }, [loaded])

  const wrapperStyle = {
    ...(aspectRatio ? { aspectRatio } : {}),
    ...style,
  }

  return (
    <div
      className={`skeleton-image-wrapper ${loaded ? 'is-loaded' : 'is-loading'} ${wrapperClassName}`.trim()}
      style={wrapperStyle}
    >
      {showSkeleton && (
        <div className="skeleton-placeholder" aria-hidden="true">
          <div className="skeleton-shimmer" />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`lazy-img ${loaded ? 'lazy-img--loaded' : 'lazy-img--loading'} ${className}`.trim()}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        draggable={false}
        onLoad={handleLoaded}
        onError={onError}
        style={imgStyle}
        {...props}
      />
    </div>
  )
}

