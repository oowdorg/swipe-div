import { CSSProperties, MouseEventHandler, ReactNode, useEffect, useState } from 'react'
import classNames from 'classnames'
import * as styles from './index.module.scss'

class Point {
    x: number
    y: number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

let mousedownPoint: Point | undefined
let pressList: { [key: string]: boolean } = {}

interface Props {
    children?: ReactNode
    className?: string
    style?: CSSProperties
    onClick?: MouseEventHandler<HTMLDivElement>
    //
    onSwipe?: (angle: number) => void
    lockedScreen?: boolean
}

function SwipeDiv({ children, className, style, onClick, onSwipe, lockedScreen }: Props): JSX.Element {
    const [gamepadConnections, setGamepadConnections] = useState<boolean[]>([])

    // Events
    const getPointByE = (e: any) => {
        // e.preventDefault()
        if (e.changedTouches && e.changedTouches[0]) {
            e = e.changedTouches[0]
            e.returnValue = false
        }
        const x = e.pageX
        const y = e.pageY
        return new Point(x, y)
    }
    const mousedownFn = (e: any) => {
        mousedownPoint = getPointByE(e)
    }
    const mouseupFn = (e: any) => {
        if (!mousedownPoint || lockedScreen) {
            return
        }
        const mouseupPoint = getPointByE(e)
        const dist = Math.sqrt(Math.pow(mouseupPoint.y - mousedownPoint.y, 2) + Math.pow(mouseupPoint.x - mousedownPoint.x, 2))
        const angle = Math.atan2(mouseupPoint.y - mousedownPoint.y, mouseupPoint.x - mousedownPoint.x)
        mousedownPoint = undefined
        if (onSwipe) {
            onSwipe(dist > 10 ? angle : Infinity)
        }
    }
    const keyupFn = (e: any) => {
        if (!onSwipe) {
            return
        }
        if (e.key === 'ArrowLeft') {
            onSwipe(-Math.PI)
        } else if (e.key === 'ArrowUp') {
            onSwipe(-Math.PI / 2)
        } else if (e.key === 'ArrowRight') {
            onSwipe(0)
        } else if (e.key === 'ArrowDown') {
            onSwipe(Math.PI / 2)
        } else if (e.key === 'Space') {
            onSwipe(Infinity)
        }
    }
    useEffect(() => {
        // Key
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
                            if (button.pressed) {
                                pressList[`${gamepadIndex}_${buttonIndex}`] = true
                            } else {
                                if (pressList[`${gamepadIndex}_${buttonIndex}`]) {
                                    const angle = buttonIndex === 12 ? -Math.PI / 2 : buttonIndex === 13 ? Math.PI / 2 : buttonIndex === 14 ? -Math.PI : buttonIndex === 15 ? 0 : Infinity
                                    if (typeof angle === 'number' && onSwipe) {
                                        onSwipe(angle)
                                    }
                                }
                                pressList[`${gamepadIndex}_${buttonIndex}`] = false
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
        return () => {
            // Key
            window.removeEventListener('keyup', keyupFn)
            // Gamepad
            if (typeof gamepadCheckTimer !== 'undefined') {
                clearInterval(gamepadCheckTimer)
            }
            if (typeof gamepadLoopTimer !== 'undefined') {
                clearInterval(gamepadLoopTimer)
            }
        }
    }, [lockedScreen, onSwipe, gamepadConnections])

    // Render
    return (
        <div className={classNames(styles.SwipeDiv, className)} style={style} onMouseDown={mousedownFn} onMouseUp={mouseupFn} onTouchStart={mousedownFn} onTouchEnd={mouseupFn}>
            {children}
            <div className={classNames(styles.SwipeDiv__Gamepads)}>{gamepadConnections.map((flag) => flag && <span className={classNames(styles.SwipeDiv__Gamepads__Player)}>🎮</span>)}</div>
        </div>
    )
}

export default SwipeDiv
