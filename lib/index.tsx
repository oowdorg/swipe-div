import { CSSProperties, MouseEventHandler, ReactNode, useEffect, useState } from 'react'
import classNames from 'classnames'
import * as styles from './index.module.scss'

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

type OnSwipe = (swipeData: SwipeData) => void

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
    const [gamepadConnections, setGamepadConnections] = useState<boolean[]>([])
    const [mousedownPoint, setMousedownPoint] = useState<MousedownPoint | undefined>()
    const [pressTimestamps, setPressTimestamps] = useState<{ [key: string]: number }>({})

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
        if (mousedownPoint || lockedScreen) {
            return
        }
        setMousedownPoint(getPointByE(e))
    }
    const mouseupFn = (e: any) => {
        if (!mousedownPoint || lockedScreen) {
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
            onSwipe({ angle: -Math.PI, duration, x: Infinity, y: Infinity })
        } else if (e.key === 'ArrowUp') {
            onSwipe({ angle: -Math.PI / 2, duration, x: Infinity, y: Infinity })
        } else if (e.key === 'ArrowRight') {
            onSwipe({ angle: 0, duration, x: Infinity, y: Infinity })
        } else if (e.key === 'ArrowDown') {
            onSwipe({ angle: Math.PI / 2, duration, x: Infinity, y: Infinity })
        } else if (e.key === ' ') {
            onSwipe({ angle: Infinity, duration, x: Infinity, y: Infinity })
        }
        setPressTimestamps({ ...pressTimestamps, [`key_${e.key}`]: 0 })
    }

    // Reset, Gamepad
    useEffect(() => {
        window.addEventListener('keydown', keydownFn)
        window.addEventListener('keyup', keyupFn)

        // Gamepad
        let gamepadCheckTimer: number | undefined = undefined
        let gamepadLoopTimer: number | undefined = undefined
        if (window.Gamepad && navigator.getGamepads) {
            const check = () => {
                const gamepads = navigator.getGamepads()
                if (!gamepads[0] || typeof gamepadLoopTimer !== 'undefined') {
                    return
                }
                const currentGamepadConnections = gamepads.map((g) => !!g)
                if (gamepadConnections.join(',') !== currentGamepadConnections.join(',')) {
                    setGamepadConnections(currentGamepadConnections)
                }
                gamepadLoopTimer = setInterval(() => {
                    const gamepads = navigator.getGamepads()
                    if (!gamepads[0]) {
                        clearInterval(gamepadLoopTimer)
                        gamepadLoopTimer = undefined
                        return
                    }
                    for (let gamepadIndex = 0; gamepadIndex < gamepads.length; gamepadIndex++) {
                        const gamepad = gamepads[gamepadIndex]
                        if (!gamepad || !gamepad.connected) {
                            continue
                        }
                        // gamepad.index gamepad.timestamp gamepad.id gamepad.mapping
                        const buttons = gamepad.buttons
                        for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++) {
                            const button = buttons[buttonIndex]
                            const buttonKey = `${gamepadIndex}_${buttonIndex}`
                            if (button.pressed) {
                                if (pressTimestamps[buttonKey] || lockedScreen) {
                                    setPressTimestamps({ ...pressTimestamps, [buttonKey]: 0 })
                                } else {
                                    setPressTimestamps({ ...pressTimestamps, [buttonKey]: Date.now() })
                                }
                            } else if (!pressTimestamps[buttonKey] || lockedScreen) {
                                setPressTimestamps({ ...pressTimestamps, [buttonKey]: 0 })
                            } else {
                                const angle = buttonIndex === 12 ? -Math.PI / 2 : buttonIndex === 13 ? Math.PI / 2 : buttonIndex === 14 ? -Math.PI : buttonIndex === 15 ? 0 : Infinity
                                const duration = Date.now() - pressTimestamps[buttonKey]
                                setPressTimestamps({ ...pressTimestamps, [buttonKey]: 0 })
                                onSwipe({ angle, duration, x: Infinity, y: Infinity })
                            }
                        }
                        // const axes = gamepad.axes
                        // for (let j = 0; j < axes.length; j++) {
                        //     const axis = axes[j]
                        // }
                    }
                }, 1000 / 15)
            }
            gamepadCheckTimer = setInterval(check, 1000 * 3)
            check()
        }

        // Reset
        return () => {
            window.removeEventListener('keydown', keydownFn)
            window.removeEventListener('keyup', keyupFn)

            // Gamepad
            if (typeof gamepadCheckTimer !== 'undefined') {
                clearInterval(gamepadCheckTimer)
            }
            if (typeof gamepadLoopTimer !== 'undefined') {
                clearInterval(gamepadLoopTimer)
            }
        }
    }, [lockedScreen, onSwipe, gamepadConnections, mousedownPoint, pressTimestamps])

    // Render
    return (
        <div className={classNames(styles.SwipeDiv, className)} style={style} onMouseDown={mousedownFn} onMouseUp={mouseupFn} onTouchStart={mousedownFn} onTouchEnd={mouseupFn}>
            {children}
            <div className={classNames(styles.SwipeDiv__Gamepads)}>{gamepadConnections.map((flag) => flag && <span className={classNames(styles.SwipeDiv__Gamepads__Player)}>🎮</span>)}</div>
        </div>
    )
}

export default SwipeDiv
