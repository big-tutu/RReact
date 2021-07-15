import React, {useState, useRef} from 'react';

export default () => {
	const [count, setCount] = useState(0);
	// const lastCount = useRef(count);
	// lastCount.current = count;
	const log = () => {
    setTimeout(() => {
			console.log("2 count = 1 count =", count); 
			// console.log("2 count = 1 count =", lastCount.current); 
		}, 1000);

		// console.log("2 count = 1 count =", lastCount.current);
	};
	const handleClick = () => {
		// log();
		setCount(2);  
		log();
	}
	console.log('app', count);
	return (
    <button className="btn" onClick={handleClick}>click me</button>
  );
}