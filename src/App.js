
import React, { useState } from 'react'

const App = () => {
	let [count, setCount] = useState(0)
	console.log('count', count)
	return (
		<div>
			{/* <p>
				<a onClick={() => {setCount(++count)}}>我是一个按钮，点我</a>
			</p>
			<span>
				{count}
			</span> */}
			{
				Array(3000).fill(1).map((i,index) => <div key={index}>{index}</div>)
			}
		</div>
	)
}

export default App