import React, {useState, useMemo} from 'react';

import List from './List'

export default () => {
	const [count, setCount] = useState(0);
	const name = 'kyrie';
	return (
		<div>
			{useMemo(() => <List name={name} />, [name])}
			<p>你点击了{count}次</p>
			<button className="btn" onClick={() => setCount(count + 1)}>点击</button>
		</div>
		
	)
}
