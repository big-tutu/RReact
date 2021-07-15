

import React, { useEffect, useState } from 'react'


// class

// export default class Counter extends React.Component {
// 	state = {
// 		count: 0
// 	}

// 	componentDidMount () {
// 		document.title = `你点击了${this.state.count}次`;
// 	}

// 	componentWillUpdate () {
// 		document.title = `你点击了${this.state.count}次`;
// 	}

// 	componentWillUnmount () {
//     document.title = `你离开了 UseEffectDemo 组件`;
//   }

// 	onClick = () => {
// 		this.setState(preState => preState.count++);
// 	}
// 	render () {
// 		return (
// 			<div>
// 				<p>你点击了{this.state.count}次</p>
// 				<button className="btn" onClick={this.onClick}>点击</button>
// 			</div>
// 		)
// 	}
// }


/**
 * 函数组件，
 * 第二个参数控制不必要的渲染
 */
export default () => {
	const [count, setCount] = useState({num: 0});
	const [name, setName] = useState('dd');

	useEffect(() => {
		// document.title = `你点击了${count.num}次`;
		return () => {
			console.log('clean effect');
			document.title = `你离开了 UseEffectDemo 组件`;
		}
	}, [name]);

	const onClick = () => {
		setCount({num: count.num + 1});
		// setName(’kyrie‘);
	}
	// console.log(name);
	return(
		<div>
 			<p>你点击了{count.num}次</p>
	 		<button className="btn" onClick={onClick}>点击</button>
	 	</div>
	)
}