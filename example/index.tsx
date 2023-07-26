import * as ReactDOM from 'react-dom/client'
import * as styles from './index.module.scss'
import SwipeDiv from '../lib/index'
import classNames from 'classnames'
import { useState } from 'react'

function App() {
    const [angle, setAngle] = useState<number | undefined>()
    return (
        <div className={classNames(styles.App)}>
            <SwipeDiv className={classNames(styles.App__SwipeDiv)} onSwipe={setAngle}>
                <span>{typeof angle === 'undefined' ? 'Swipe!' : angle === Infinity ? 'Clicked' : angle}</span>
            </SwipeDiv>
        </div>
    )
}

ReactDOM.createRoot(document.querySelector('#root') as HTMLElement).render(<App />)
