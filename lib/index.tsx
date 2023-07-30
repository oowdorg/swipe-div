import { CSSProperties, MouseEventHandler, ReactNode, useEffect, useState } from 'react'
import classNames from 'classnames'

export type SwipeData = {
    angle: number
    duration: number
    x: number
    y: number
}

type MousedownPoint = {
    x: number
    y: number
    timestamp: number
}

const CLICK_DIST = 10

export type OnSwipe = (swipeData: SwipeData) => void

type PressTimestamps = {
    [key: string]: number
}

interface Props {
    children?: ReactNode
    className?: string
    style?: CSSProperties
    onClick?: MouseEventHandler<HTMLDivElement>
    //
    onSwipe: OnSwipe
    lockedScreen?: boolean
}

function SwipeDiv({ children, className, style, onSwipe, lockedScreen }: Props): JSX.Element {
    const [mousedownPoint, setMousedownPoint] = useState<MousedownPoint | undefined>()
    const [pressTimestamps, setPressTimestamps] = useState<PressTimestamps>({})

    // Mouse
    const getPointByE = (e: any) => {
        // e.preventDefault()
        if (e.changedTouches && e.changedTouches[0]) {
            e = e.changedTouches[0]
            e.returnValue = false
        }
        const x = e.pageX
        const y = e.pageY
        const mousedownPoint: MousedownPoint = { x, y, timestamp: Date.now() }
        return mousedownPoint
    }
    const mousedownFn = (e: any) => {
        const target = e.target as HTMLElement
        if (!(target.classList.contains('swipe-div') || target.classList.contains(className)) || mousedownPoint || lockedScreen) {
            return
        }
        setMousedownPoint(getPointByE(e))
    }
    const mouseleaveFn = () => {
        setMousedownPoint(undefined)
    }
    const mouseupFn = (e: any) => {
        const target = e.target as HTMLElement
        if (!(target.classList.contains('swipe-div') || target.classList.contains(className)) || !mousedownPoint || lockedScreen) {
            setMousedownPoint(undefined)
            return
        }
        const mouseupPoint = getPointByE(e)
        const dist = Math.sqrt(Math.pow(mouseupPoint.y - mousedownPoint.y, 2) + Math.pow(mouseupPoint.x - mousedownPoint.x, 2))
        const angle = Math.atan2(mouseupPoint.y - mousedownPoint.y, mouseupPoint.x - mousedownPoint.x)
        const duration = mouseupPoint.timestamp - mousedownPoint.timestamp
        setMousedownPoint(undefined)
        onSwipe({
            angle: dist > CLICK_DIST ? angle : Infinity,
            duration,
            x: mouseupPoint.x,
            y: mouseupPoint.y,
        })
    }

    // Keyboard
    const keydownFn = (e: any) => {
        if (pressTimestamps[`key_${e.key}`] || lockedScreen) {
            return
        }
        setPressTimestamps({ ...pressTimestamps, [`key_${e.key}`]: Date.now() })
    }
    const keyupFn = (e: any) => {
        const downTimestamp = pressTimestamps[`key_${e.key}`]
        if (!downTimestamp || lockedScreen) {
            setPressTimestamps({ ...pressTimestamps, [`key_${e.key}`]: 0 })
            return
        }
        const duration = Date.now() - downTimestamp
        if (e.key === 'ArrowLeft') {
            onSwipe({ angle: -Math.PI, duration, x: 0, y: document.body.clientHeight / 2 })
        } else if (e.key === 'ArrowUp') {
            onSwipe({ angle: -Math.PI / 2, duration, x: document.body.clientWidth / 2, y: 0 })
        } else if (e.key === 'ArrowRight') {
            onSwipe({ angle: 0, duration, x: document.body.clientWidth, y: document.body.clientHeight / 2 })
        } else if (e.key === 'ArrowDown') {
            onSwipe({ angle: Math.PI / 2, duration, x: document.body.clientWidth / 2, y: document.body.clientHeight })
        } else if (e.key === ' ') {
            onSwipe({ angle: Infinity, duration, x: Infinity, y: Infinity })
        }
        setPressTimestamps({ ...pressTimestamps, [`key_${e.key}`]: 0 })
    }

    // Reset, Gamepad
    useEffect(() => {
        window.addEventListener('keydown', keydownFn)
        window.addEventListener('keyup', keyupFn)
        return () => {
            window.removeEventListener('keydown', keydownFn)
            window.removeEventListener('keyup', keyupFn)
        }
    }, [lockedScreen, onSwipe, mousedownPoint, pressTimestamps])

    // Render
    return (
        <div className={classNames('swipe-div', className)} style={style} onMouseDown={mousedownFn} onMouseUp={mouseupFn} onMouseLeave={mouseleaveFn} onTouchStart={mousedownFn} onTouchEnd={mouseupFn}>
            {children}
        </div>
    )
}

export default SwipeDiv
