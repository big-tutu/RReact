import React, {useState, useMemo} from 'react';

export default (props) => {
	const { name } = props;


	console.log("我是 list 组件，render")
	return (
		<div>
			<p>{name}</p>
			<ul>
				<li key="1">1</li>
				<li key="2">2</li>
				<li key="3">3</li>
				<li key="4">4</li>
				<li key="5">5</li>
			</ul>
		</div>
	)
}
