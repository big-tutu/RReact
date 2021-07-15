
import React, {useCallback, useState} from 'react';

export default () => {
	const [count, setCount] = useState(0);
	const [count1, setCount1] = useState(0);
  const handleClick = () => {
		setCount(count + 1)
  }
  const handleClick1 = useCallback(() => {
		setCount1(count1 + 1);
	}, [count1]);
  return(
    <div>
      <button className="btn" onClick={handleClick}>handleCick</button>
			<p>{count}</p>
      <button className="btn" onClick={handleClick1}>handleCick1</button>
			<p>{count1}</p>
    </div>
  )
}