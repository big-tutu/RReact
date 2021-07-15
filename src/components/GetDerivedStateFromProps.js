import React, { Component } from 'react';

class Child extends Component {
	state = {
		color: null,
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		console.log('getDerivedStateFromProps', nextProps, prevState);
		//根据nextProps和prevState计算出预期的状态改变，返回结果会被送给setState
		if (nextProps.color !== prevState.color) {
			return nextProps
		}
		return null;
	}

	getSnapshotBeforeUpdate(prevProps, prevState) {
		// 此处记录一些dom渲染前的数据，并返回
    return 'foo';
	}
	UNSAFE_componentDidUpdate(prevProps, prevState, snapshot) {
		// 作为第三个参数传进来
		console.log('#enter componentDidUpdate snapshot = ', snapshot);
	}



	render () {
		console.log('render', this.state);
		return (
			<div>
				<h2 style={this.state}>我是Child组件</h2>
			</div>
		)
	}
}

export default class Father extends Component {
	state = {
		color: '#999'
	}
	render () {
		return (
			<div>
				<button className="btn" onClick={() => this.setState({color: 'blue'})}>blue</button>
				<button className="btn" onClick={() => this.setState({color: 'pink'})}>pink</button>
				<button className="btn" onClick={() => this.setState({color: 'yellow'})}>yellow</button>
				<Child color={this.state.color} />
			</div>
		)
	}
}




