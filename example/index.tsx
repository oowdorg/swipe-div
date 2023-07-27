import * as ReactDOM from 'react-dom/client'
import * as styles from './index.module.scss'
import SwipeDiv, { SwipeData } from '../index'
import classNames from 'classnames'
import { useState } from 'react'

function App() {
    const [swipeData, setSwipeData] = useState<SwipeData | undefined>()
    return (
        <div className={classNames(styles.App)}>
            <SwipeDiv className={classNames(styles.App__SwipeDiv)} onSwipe={setSwipeData}>
                <span>{typeof swipeData === 'undefined' ? 'Swipe!' : swipeData.angle === Infinity ? `Clicked! ${swipeData.duration}` : swipeData.angle}</span>
            </SwipeDiv>
        </div>
    )
}

ReactDOM.createRoot(document.querySelector('#root') as HTMLElement).render(<App />)
