// 实现inpu的双向绑定

import React, { useState, useCallback} from 'react';

let temp;

// 自定义的Hook
// function useBind(initialVal) {
// 	const [value, setValue] = useState(initialVal);
// // useCallback用来控制函数重新执行时每次都重新定义函数, 第二个参数作为依赖项，再发生变化的时候才会更新
// 	const onChange = useCallback(function(event) {
//     setValue(event.currentTarget.value);
// 	}, []);
// 	console.log(onChange === current);
// 	current = onChange;
// 	return {value, onChange};
// }


const UserName = () => {
	const [val, setVal] = useState('kyrie');
	function onInputChange (e) {
		setVal(e.target.value);
	}

	// 使用自定义的hook
	// const useHook = useBind('kyrie');

	return (
		<div>
			<input value={val} onChange={onInputChange}/>
			{/* <input {...useHook}/> */}
		</div>
	)
}

const PassWord = () => {
	const [val, setVal] = useState('123');
	function onInputChange (e) {
		setVal(e.target.value);
	}
	// 每次都是重新定义的一个函数
	console.log(onInputChange === temp);
	temp = onInputChange
	
	// 使用自定义的Hook
	// const useHook = useBind('123');
	return (
		<div>
			<input value={val} onChange={onInputChange}/>
			{/* <input {...useHook}/> */}
		</div>
	)
}





export default () => <div>
	<UserName />
	<PassWord />
</div>;